import {
  createAdminClient,
  FOUNDING_AUDIT_BUCKET_ID,
} from "@/lib/appwrite-server";
import { getSecureFileUrl } from "@/lib/secureFileUrl";
import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import { requireAuditStaff } from "@/lib/auth/audit-access";
import { sessionErrorResponse } from "@/lib/auth/session";
import { hasExpectedFileSignature } from "@/lib/files/file-signature";
import { assertMalwareFree } from "@/lib/files/malware-scan";

const ROLES = new Set(["org_admin", "auditer", "aud_E"]);
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

const NextErrorJson = (message, status = 500) =>
  NextResponse.json({ success: false, error: message }, { status: status });

export const uploadFileBuffer = async ({ storage, buffer, filename }) => {
  if (!buffer)
    throw new Error("A binary file buffer is required for upload operations.");

  const inputFile = InputFile.fromBuffer(buffer, filename);
  const targetFileId = ID.unique();

  const uploadedFile = await storage.createFile(
    FOUNDING_AUDIT_BUCKET_ID,
    targetFileId,
    inputFile,
    [],
  );

  const fileUrl = getSecureFileUrl(FOUNDING_AUDIT_BUCKET_ID, uploadedFile.$id);

  return {
    fileId: uploadedFile.$id,
    fileUrl,
  };
};

export const POST = async (req) => {
  try {
    await requireAuditStaff();
    const formData = await req.formData();
    const file = formData.get("file");

    const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
    if (!file || typeof file === "string" || file.size < 1 || file.size > MAX_UPLOAD_BYTES || !allowedTypes.has(file.type)) {
      return NextErrorJson("[FILE-UPLOAD]Invalid file format.", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (!hasExpectedFileSignature(buffer, file.type)) {
      return NextErrorJson("File content does not match its declared type", 400);
    }
    await assertMalwareFree(buffer);

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
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    return NextErrorJson("Failed to upload file", 500);
  }
};

export const DELETE = async (req) => {
  try {
    await requireAuditStaff();
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
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    return NextErrorJson("Failed to delete file");
  }
};
