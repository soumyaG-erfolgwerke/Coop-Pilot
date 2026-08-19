import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import { createAdminClient, AUDIT_BUCKET_ID } from "@/lib/appwrite-server";
import { requireRole, resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { getSecureFileUrl } from "@/lib/secureFileUrl";
import { hasExpectedFileSignature } from "@/lib/files/file-signature";
import { assertMalwareFree } from "@/lib/files/malware-scan";

const MAX_AUDIT_UPLOAD_BYTES = 15 * 1024 * 1024;

// POST /api/auditServices/upload - Upload audit file
export async function POST(request) {
  try {
    requireRole(await resolveSession(), ["superuser", "superadmin", "org_admin", "auditer", "aud_E", "coopadmin"]);
    const formData = await request.formData();
    const file = formData.get("file");

    if (
      !file ||
      file.type !== "application/pdf" ||
      file.size < 1 ||
      file.size > MAX_AUDIT_UPLOAD_BYTES
    ) {
      return NextResponse.json(
        { success: false, error: "A PDF no larger than 15 MB is required" },
        { status: 400 }
      );
    }

    const { storage } = createAdminClient();

    // Convert the file to a buffer for node-appwrite
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    if (!hasExpectedFileSignature(buffer, file.type)) {
      return NextResponse.json(
        { success: false, error: "File content does not match a PDF" },
        { status: 400 },
      );
    }
    await assertMalwareFree(buffer);

    // Create InputFile from buffer
    const inputFile = InputFile.fromBuffer(buffer, file.name);

    // Upload the file to Appwrite Storage
    const uploadedFile = await storage.createFile(
      AUDIT_BUCKET_ID,
      ID.unique(),
      inputFile
    );

    // Construct the public URL for the file
    const fileUrl = getSecureFileUrl(AUDIT_BUCKET_ID, uploadedFile.$id);

    return NextResponse.json({ 
      success: true, 
      fileUrl,
      fileId: uploadedFile.$id 
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload file: " + (error.message || error.toString()) },
      { status: 500 }
    );
  }
}
