import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import {
  createAdminClient,
  ENDPOINT,
  DATABASE_ID,
  PROJECT_ID,
  COLLECTION_ID_AUDIT_ORGS,
} from "@/lib/appwrite-server";
import {
  getAuthenticatedProfile,
  stripInternalFields,
} from "@/lib/helpers/_helpers";

const COOP_BUCKET_ID = "6918a3360027dc0888aa";
const ALLOWED_FILE_KEYS = ["letterhead_url", "stamp_url", "logo_url", "esign_url"];

export async function GET() {
  try {
    const auth = await getAuthenticatedProfile();
    if (auth.role !== "org_admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { databases } = createAdminClient();
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_ORGS,
      [Query.equal("admin_email", auth.email), Query.limit(1)],
    );

    if (!response.documents[0]) {
      return NextResponse.json(
        { success: false, error: "Audit organization not found" },
        { status: 404 },
      );
    }

    const auditOrg = stripInternalFields(response.documents[0]);
    const files = {
      letterhead_url: auditOrg.letterhead_url,
      stamp_url: auditOrg.stamp_url,
      logo_url: auditOrg.logo_url,
      esign_url: auditOrg.esign_url,
    };

    return NextResponse.json({
      success: true,
      files: files,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch uploaded files",
      },
      {
        status: 500,
      },
    );
  }
}

const deleteFileByUrl = async (url) => {
  try {
    if (!url) return;

    let fileId = null;

    try {
      const parsedUrl = new URL(url);
      const parts = parsedUrl.pathname.split("/");

      // expected pattern: /storage/buckets/{bucketId}/files/{fileId}/view
      const fileIndex = parts.indexOf("files");

      if (fileIndex !== -1 && parts[fileIndex + 1]) {
        fileId = parts[fileIndex + 1];
      }
    } catch (e) {
      console.error("Invalid URL:", e);
      return;
    }

    if (!fileId) {
      console.warn("File ID not found in URL");
      return;
    }

    const { storage } = createAdminClient();

    await storage.deleteFile(COOP_BUCKET_ID, fileId);

  } catch (error) {
    console.error("Error deleting file:", error);
  }
};

const uploadFile = async (file) => {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const { storage } = createAdminClient();
  const inputFile = InputFile.fromBuffer(buffer, file.name);
  const uploadedFile = await storage.createFile(
    COOP_BUCKET_ID,
    ID.unique(),
    inputFile,
  );

  return {
    fileId: uploadedFile.$id,
    fileUrl: `${ENDPOINT}/storage/buckets/${COOP_BUCKET_ID}/files/${uploadedFile.$id}/view?project=${PROJECT_ID}`,
  };
};

export async function POST(request) {
  try {
    const auth = await getAuthenticatedProfile();
    if (auth.role !== "org_admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const field = formData.get("field");
    const action = formData.get("action") || "upload";
    const file = formData.get("file");

    if (!ALLOWED_FILE_KEYS.includes(field)) {
      return NextResponse.json(
        { success: false, error: "Invalid file field" },
        { status: 400 },
      );
    }

    const { databases } = createAdminClient();
    const auditOrgResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_ORGS,
      [Query.equal("admin_email", auth.email), Query.limit(1)],
    );

    if (!auditOrgResponse.documents[0]) {
      return NextResponse.json(
        { success: false, error: "Audit organization not found" },
        { status: 404 },
      );
    }

    const auditOrg = auditOrgResponse.documents[0];

    if (action === "delete") {
      const existingUrl = auditOrg[field];

      if (existingUrl) {
        await deleteFileByUrl(existingUrl);
      }

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID_AUDIT_ORGS,
        auditOrg.$id,
        {
          [field]: null,
        },
      );

      return NextResponse.json({
        success: true,
        message: "File deleted successfully",
      });
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 },
      );
    }

    const uploadedFile = await uploadFile(file);
    const existingUrl = auditOrg[field];

    if (existingUrl && existingUrl !== uploadedFile.fileUrl) {
      await deleteFileByUrl(existingUrl);
    }

    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_ORGS,
      auditOrg.$id,
      {
        [field]: uploadedFile.fileUrl,
      },
    );

    return NextResponse.json({
      success: true,
      message: "Files updated successfully",
      fileUrl: uploadedFile.fileUrl,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update files" },
      { status: 500 },
    );
  }
}
