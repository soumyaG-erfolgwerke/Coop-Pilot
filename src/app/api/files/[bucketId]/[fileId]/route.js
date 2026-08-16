import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite-server";
import {
  authorizeFileAccess,
  isIntentionallyPublicFile,
  PRIVATE_FILE_BUCKETS,
} from "@/lib/auth/file-access";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

function safeFilename(value) {
  return String(value || "document")
    .replace(/[\r\n"\\/]/g, "_")
    .slice(0, 180);
}

export async function GET(request, { params }) {
  try {
    const { bucketId, fileId } = await params;
    if (!PRIVATE_FILE_BUCKETS.has(bucketId) || !SAFE_ID.test(fileId)) {
      return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
    }

    const isPublic = await isIntentionallyPublicFile(bucketId, fileId);
    if (!isPublic) {
      const session = await resolveSession();
      await authorizeFileAccess(session, bucketId, fileId);
    }

    const { storage } = createAdminClient();
    const [metadata, payload] = await Promise.all([
      storage.getFile({ bucketId, fileId }),
      storage.getFileDownload({ bucketId, fileId }),
    ]);
    const disposition = new URL(request.url).searchParams.get("download") === "1"
      ? "attachment"
      : "inline";

    return new Response(payload, {
      status: 200,
      headers: {
        "Content-Type": metadata.mimeType || "application/octet-stream",
        "Content-Length": String(metadata.sizeOriginal || payload.byteLength),
        "Content-Disposition": `${disposition}; filename="${safeFilename(metadata.name)}"`,
        "Cache-Control": isPublic ? "public, max-age=300" : "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    if (error?.code === 404) {
      return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
    }
    console.error("Secure file delivery failed", error);
    return NextResponse.json({ success: false, error: "Unable to retrieve file" }, { status: 500 });
  }
}
