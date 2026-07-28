import {
  createAdminClient,
  ENDPOINT,
  FOUNDING_AUDIT_BUCKET_ID,
  PROJECT_ID,
} from "@/lib/appwrite-server";
import { getAuthenticatedProfile } from "@/lib/helpers/_helpers";
import { NextResponse } from "next/server";
import { ID, Permission, Role } from "node-appwrite";
import { InputFile } from "node-appwrite/file";

const ROLES = new Set(["org_admin", "auditer", "aud_E"]);

const NextErrorJson = (message, status = 500) =>
  NextResponse.json({ success: false, error: message }, { status: status });

export const uploadFileBuffer = async ({ storage, buffer, filename }) => {
  if (!buffer)
    throw new Error("A binary file buffer is required for upload operations.");

  const inputFile = InputFile.fromBuffer(buffer, filename);
  const targetFileId = ID.unique();

  const filePermissions = [Permission.read(Role.any())];

  const uploadedFile = await storage.createFile(
    FOUNDING_AUDIT_BUCKET_ID,
    targetFileId,
    inputFile,
    filePermissions,
  );

  const fileUrl = `${ENDPOINT}/storage/buckets/${FOUNDING_AUDIT_BUCKET_ID}/files/${uploadedFile.$id}/view?project=${PROJECT_ID}&filename=${encodeURIComponent(filename)}`;

  return {
    fileId: uploadedFile.$id,
    fileUrl,
  };
};

export const POST = async (req) => {
  const session = await getAuthenticatedProfile();
  if (!session || !session.role || !ROLES.has(session.role)) {
    return NextErrorJson("User unauthorized.", 403);
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextErrorJson("[FILE-UPLOAD]Invalid file format.", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { storage } = createAdminClient();

    const { fileId, fileUrl } = await uploadFileBuffer({
      storage: storage,
      buffer: buffer,
      filename: file.name,
    });

    return NextResponse.json(
      { success: true, fileId, fileUrl },
      { status: 201 },
    );
  } catch (error) {
    return NextErrorJson(`[FILE-UPLOAD]: ${error.message}`, 500);
  }
};

export const DELETE = async (req) => {
  const session = await getAuthenticatedProfile();
  if (!session || !session.role || !ROLES.has(session.role)) {
    return NextErrorJson("User unauthorized.", 403);
  }

  try {
    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get("fileUrl");

    if (!fileUrl) {
      return NextErrorJson("File URL is required for deletion.", 400);
    }

    const urlParts = fileUrl.split("/files/");
    if (urlParts.length < 2) {
      return NextErrorJson("Invalid file storage URL mapping.", 400);
    }
    const fileId = urlParts[1].split("/")[0];

    const { storage } = createAdminClient();
    await storage.deleteFile(FOUNDING_AUDIT_BUCKET_ID, fileId);

    return NextResponse.json(
      { success: true, message: "Orphaned storage file deleted successfully." },
      { status: 200 },
    );
  } catch (error) {
    return NextErrorJson(`[FILE-DELETE] ${error.message}`);
  }
};
