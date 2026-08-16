import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite-server";
import { ID } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import { getSecureFileUrl } from "@/lib/secureFileUrl";
import { resolveSession, requireRole, sessionErrorResponse } from "@/lib/auth/session";
import { safePublicError } from "@/lib/api/safe-public-error";
import { hasExpectedFileSignature } from "@/lib/files/file-signature";
import { assertMalwareFree } from "@/lib/files/malware-scan";

const COOP_BUCKET_ID = "6918a3360027dc0888aa";
const DOCS_BUCKET_ID = "6918a3360027dc0888aa";

// POST /api/coops/upload - Upload a file (logo, banner, or document)
export async function POST(request) {
  try {
    const session = await resolveSession();
    requireRole(session, ["coopadmin", "org_admin", "superuser", "superadmin"]);
    const formData = await request.formData();
    const file = formData.get("file");
    const type = formData.get("type") || "coop"; // "coop" for logos/banners, "docs" for documents

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!["coop", "docs"].includes(type)) {
      return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
    }
    const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
    if (!allowedMimeTypes.has(file.type) || file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Unsupported file or file too large" }, { status: 400 });
    }

    // Determine which bucket to use
    const bucketId = type === "docs" ? DOCS_BUCKET_ID : COOP_BUCKET_ID;

    // Convert the web File object to a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    if (!hasExpectedFileSignature(buffer, file.type)) {
      return NextResponse.json(
        { error: "File content does not match its declared type" },
        { status: 400 },
      );
    }
    await assertMalwareFree(buffer);

    const { storage } = createAdminClient();

    // Create the file using InputFile from node-appwrite
    const inputFile = InputFile.fromBuffer(buffer, file.name);

    const uploadedFile = await storage.createFile(
      bucketId,
      ID.unique(),
      inputFile
    );

    // Construct the file view URL
    const fileUrl = getSecureFileUrl(bucketId, uploadedFile.$id);

    return NextResponse.json({
      fileId: uploadedFile.$id,
      fileUrl: fileUrl,
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: safePublicError(error, "Failed to upload file") },
      { status: 500 }
    );
  }
}
