import {
  DATABASE_ID,
  COLLECTION_ID_NIEDERSCHRIFT,
  AUDIT_BUCKET_ID,
  createAdminClient,
} from "@/lib/appwrite-server";
import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import {
  ensureCoopAdminAccess,
  getAuthenticatedProfile,
} from "@/lib/helpers/_helpers";
import { Query } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import { requireAssemblyAdmin } from "@/lib/auth/assembly-access";
import { sessionErrorResponse } from "@/lib/auth/session";
import { safePublicError } from "@/lib/api/safe-public-error";
import { hasExpectedFileSignature } from "@/lib/files/file-signature";
import { assertMalwareFree } from "@/lib/files/malware-scan";

const MAX_MINUTES_FILE_BYTES = 10 * 1024 * 1024;

export async function GET(req) {
  const { databases } = createAdminClient();
  const { searchParams } = new URL(req.url);
  const assemblyId = searchParams.get("assemblyId");

  try {
    if (!assemblyId) {
      return NextResponse.json(
        { success: false, error: "assemblyId is required" },
        { status: 400 },
      );
    }

    await requireAssemblyAdmin(assemblyId);

    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_NIEDERSCHRIFT,
      [Query.equal("assemblyId", assemblyId)],
    );

    if (!res.documents.length) {
      return NextResponse.json({
        success: true,
        exists: false,
        niederschrift: null,
      });
    }

    const doc = res.documents[0];

    return NextResponse.json({
      success: true,
      exists: true,
      niederschrift: {
        id: doc.$id,
        assemblyId: doc.assemblyId,
        fileId: doc.fileId,
        chair: doc.chair,
        secretary: doc.secretary,
        status: doc.status,
        finalisedAt: doc.finalisedAt,
      },
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403 || error?.message === "FORBIDDEN") {
      return sessionErrorResponse(error?.message === "FORBIDDEN" ? { status: 403 } : error);
    }
    console.error("Fetch Niederschrift Error:", error);
    return NextResponse.json(
      { success: false, error: safePublicError(error)},
      { status: 500 },
    );
  }
}
//POST- Upload the nierderschrift doc
export async function POST(req) {
  try {
    const { storage, databases } = createAdminClient();
    const formData = await req.formData();

    const file = formData.get("file");
    const assemblyId = formData.get("assemblyId");
    const coopId = formData.get("coopId");
    const chair = formData.get("chair");
    const secretary = formData.get("secretary");

    if ( !file || !assemblyId || !coopId || assemblyId === "undefined" || assemblyId === "null" ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields invalid assembly id" },
        { status: 400 },
      );
    }

    const { assembly } = await requireAssemblyAdmin(assemblyId);
    if (assembly.coopId !== coopId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }
    if (file.type !== "application/pdf" || file.size < 1 || file.size > MAX_MINUTES_FILE_BYTES) {
      return NextResponse.json(
        { success: false, error: "Minutes must be a PDF no larger than 10 MB" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (!hasExpectedFileSignature(buffer, file.type)) {
      return NextResponse.json(
        { success: false, error: "File content does not match a PDF" },
        { status: 400 },
      );
    }
    await assertMalwareFree(buffer);

    const uploaded = await storage.createFile(
      AUDIT_BUCKET_ID,
      ID.unique(),
      InputFile.fromBuffer(buffer, file.name),
    );

    try {
      const record = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID_NIEDERSCHRIFT,
        ID.unique(),
        {
          assemblyId: assemblyId,
          // assemblyId,
          coopId,
          fileId: uploaded.$id,
          chair,
          secretary,
          finalisedAt: new Date().toISOString(),
          status: "FINALIZED",
        },
      );

      return NextResponse.json({
        success: true,
        file: uploaded,
        record,
      });
    } catch (dbError) {
      await storage
        .deleteFile(AUDIT_BUCKET_ID, uploaded.$id)
        .catch(console.error);
      throw dbError;
    }
  } catch (error) {
    if (error?.status === 401 || error?.status === 403 || error?.message === "FORBIDDEN") {
      return sessionErrorResponse(error?.message === "FORBIDDEN" ? { status: 403 } : error);
    }
    console.error("Upload Niederschrift Error:", error);
    return NextResponse.json(
      { success: false, error: safePublicError(error)},
      { status: 500 },
    );
  }
}
