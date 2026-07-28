import { NextResponse } from "next/server";
import { createAdminClient, ENDPOINT, PROJECT_ID } from "@/lib/appwrite-server";
import { ID } from "node-appwrite";
import { InputFile } from "node-appwrite/file";

const COOP_BUCKET_ID = "6918a3360027dc0888aa";
const DOCS_BUCKET_ID = "6918a3360027dc0888aa";

// POST /api/coops/upload - Upload a file (logo, banner, or document)
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const type = formData.get("type") || "coop"; // "coop" for logos/banners, "docs" for documents

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Determine which bucket to use
    const bucketId = type === "docs" ? DOCS_BUCKET_ID : COOP_BUCKET_ID;

    // Convert the web File object to a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { storage } = createAdminClient();

    // Create the file using InputFile from node-appwrite
    const inputFile = InputFile.fromBuffer(buffer, file.name);

    const uploadedFile = await storage.createFile(
      bucketId,
      ID.unique(),
      inputFile
    );

    // Construct the file view URL
    const fileUrl = `${ENDPOINT}/storage/buckets/${bucketId}/files/${uploadedFile.$id}/view?project=${PROJECT_ID}`;

    return NextResponse.json({
      fileId: uploadedFile.$id,
      fileUrl: fileUrl,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
