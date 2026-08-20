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
      file.size < 1 ||
      file.size > MAX_AUDIT_UPLOAD_BYTES
    ) {
      return NextResponse.json(
        { success: false, error: "A file no larger than 15 MB is required" },
        { status: 400 }
      );
    }

    const { storage } = createAdminClient();

    // Convert the file to a buffer for node-appwrite
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    if (!hasExpectedFileSignature(buffer, file.type)) {
      return NextResponse.json(
        { success: false, error: "File content does not match its claimed type" },
        { status: 400 },
      );
    }
    await assertMalwareFree(buffer);

    // Use native File object instead of InputFile to avoid instanceof check
    // failure caused by Next.js bundling duplicating the InputFile class.
    // The node-appwrite SDK's chunkedUpload accepts both InputFile and
    // native File (undici.File), so this is fully compatible.
    const nativeFile = new File([buffer], file.name, { type: file.type });

    // Upload the file to Appwrite Storage
    const uploadedFile = await storage.createFile(
      AUDIT_BUCKET_ID,
      ID.unique(),
      nativeFile
    );

    // Construct the public absolute URL for the file so Appwrite's URL validation doesn't fail
    const relativeUrl = getSecureFileUrl(AUDIT_BUCKET_ID, uploadedFile.$id);
    let baseUrl = request.headers.get("origin");
    if (!baseUrl && request.headers.get("referer")) {
      baseUrl = new URL(request.headers.get("referer")).origin;
    }
    if (!baseUrl || baseUrl.includes("0.0.0.0")) {
      // Fallback if browser headers are somehow missing or proxy strips them
      baseUrl = process.env.NODE_ENV === "production" ? "https://easy-coop.de" : "http://localhost:3000";
    }
    const fileUrl = `${baseUrl}${relativeUrl}`;

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
