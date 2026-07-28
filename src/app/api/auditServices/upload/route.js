import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import { createAdminClient, AUDIT_BUCKET_ID, ENDPOINT, PROJECT_ID } from "@/lib/appwrite-server";

// POST /api/auditServices/upload - Upload audit file
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    const { storage } = createAdminClient();

    // Convert the file to a buffer for node-appwrite
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create InputFile from buffer
    const inputFile = InputFile.fromBuffer(buffer, file.name);

    // Upload the file to Appwrite Storage
    const uploadedFile = await storage.createFile(
      AUDIT_BUCKET_ID,
      ID.unique(),
      inputFile
    );

    // Construct the public URL for the file
    const fileUrl = `${ENDPOINT}/storage/buckets/${AUDIT_BUCKET_ID}/files/${uploadedFile.$id}/view?project=${PROJECT_ID}`;

    return NextResponse.json({ 
      success: true, 
      fileUrl,
      fileId: uploadedFile.$id 
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload file: " + error.message },
      { status: 500 }
    );
  }
}
