import {
  AUDIT_BUCKET_ID,
  COLLECTION_ID_DOCUMENTS,
  COLLECTION_ID_PROFILE,
  createAdminClient,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { createAuditLog } from "@/lib/auditLogService";
import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import { ensureCoopAdminAccess, getAuthenticatedProfile } from "@/lib/helpers/_helpers";
import { updateSatzungState } from "@/lib/satzungService";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { requireCoopMembership } from "@/lib/auth/membership-access";
import { requireCoopAuditAccess } from "@/lib/auth/audit-access";
import { safePublicError } from "@/lib/api/safe-public-error";
import { hasExpectedFileSignature } from "@/lib/files/file-signature";
import { assertMalwareFree } from "@/lib/files/malware-scan";

// Get all uploaded docs by coopAdmin
export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const coopId = searchParams.get("coopId");

  if (!coopId) {
    return NextResponse.json(
      { success: false, error: "coopId is required" },
      { status: 400 },
    );
  }

  const { databases } = createAdminClient();

  try {
    const user = await resolveSession();
    if (["org_admin", "auditer", "aud_E", "aud_T"].includes(user.role)) {
      await requireCoopAuditAccess(coopId);
    } else {
      await requireCoopMembership(user, coopId);
    }

    await updateSatzungState(coopId);

    const queries = [
      Query.equal("coopId", coopId),
      Query.limit(100),
      Query.orderDesc("isCurrent"),
      Query.orderDesc("uploadedAt"),
    ];

    if (user.role !== "coopadmin" && user.role !== "aud_E") {
      queries.push(Query.equal("visibleToMembers", true));
    }

    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_DOCUMENTS,
      queries,
    );

    if (res.documents.length === 0) {
      return NextResponse.json({
        success: true,
        documents: [],
        grouped: {},
        message: "No documents found",
      });
    }

    const userIds = [
      ...new Set(res.documents.map((doc) => doc.uploadedBy).filter(Boolean)),
    ];

    let profileMap = {};

    if (userIds.length > 0) {
      const profileRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_PROFILE,
        [Query.equal("userId", userIds)],
      );

      profileMap = profileRes.documents.reduce((acc, profile) => {
        acc[profile.userId] = profile;
        return acc;
      }, {});
    }

    const enrichedDocs = res.documents.map((doc) => {
      const profile = profileMap[doc.uploadedBy];

      return {
        ...doc,
        uploadedByProfile: profile
          ? {
              salutation: profile.salutation,
              firstName: profile.FirstName,
              lastName: profile.LastName,
              email: profile.contactEmail,
            }
          : null,
      };
    });

    const grouped = enrichedDocs.reduce((acc, doc) => {
      if (!acc[doc.category]) {
        acc[doc.category] = [];
      }
      acc[doc.category].push(doc);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      documents: enrichedDocs,
      grouped,
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error fetching documents:", error);

    return NextResponse.json(
      {
        success: false,
        error: safePublicError(error, "Failed to fetch documents"),
      },
      { status: 500 },
    );
  }
}

// upload document api for coopAdmin
export async function POST(request) {
  const { storage, databases } = createAdminClient();

  try {
    const formData = await request.formData();

    const file = formData.get("file");
    const metaRaw = formData.get("meta");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: { message: "No valid file uploaded" } },
        { status: 400 },
      );
    }

    if (!metaRaw) {
      return NextResponse.json(
        { success: false, error: { message: "Missing metadata" } },
        { status: 400 },
      );
    }

    let meta;
    try {
      meta = JSON.parse(metaRaw);
    } catch {
      return NextResponse.json(
        { success: false, error: { message: "Invalid metadata JSON" } },
        { status: 400 },
      );
    }

    const MAX_SIZE = 25 * 1024 * 1024;

    const ALLOWED_TYPES = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/png",
    ];

    const VALID_CATEGORIES = [
      "SATZUNG",
      "NIEDERSCHRIFTEN",
      "BEITRITTSERKLÄRUNGEN",
      "FINANZEN",
      "PRÜFUNGSBERICHTE",
      "KORRESPONDENZ",
      "KYC",
      "SONSTIGES",
    ];

    if (!meta.coopId ) {
      return NextResponse.json(
        { success: false, error: { message: "Missing coopId" } },
        { status: 400 },
      );
    }

    if (!VALID_CATEGORIES.includes(meta.category)) {
      return NextResponse.json(
        { success: false, error: { message: "Invalid category" } },
        { status: 400 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { success: false, error: { message: "Empty file not allowed" } },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: { message: `${file.name} exceeds 25MB` } },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: { message: `${file.name} type not allowed` } },
        { status: 400 },
      );
    }

    const user = await getAuthenticatedProfile();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 },
      );
    }

    const auth = await ensureCoopAdminAccess(meta.coopId);
    if (!auth || auth.error) {
      return NextResponse.json(
        { success: false, error: { message: "Forbidden" } },
        { status: 403 },
      );
    }
    
    const uploadedAt = new Date();
    const referenceYear = uploadedAt.getFullYear();

    const documentId = ID.unique();
    const referenceId = documentId;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (!hasExpectedFileSignature(buffer, file.type)) {
      return NextResponse.json(
        { success: false, error: { message: "File content does not match its declared type" } },
        { status: 400 },
      );
    }
    await assertMalwareFree(buffer);

    let version = null;
    let isCurrent = false;

    if (meta.category === "SATZUNG") {
      const year = uploadedAt.getFullYear();
      const month = String(uploadedAt.getMonth() + 1).padStart(2, "0");

      version = `${year}-${month}`;

      if (meta.effectiveFrom) {
        const effectiveDate = new Date(meta.effectiveFrom);

        const effectiveYear = effectiveDate.getFullYear();
        const effectiveMonth = effectiveDate.getMonth() + 1;

        const [versionYear, versionMonth] = version.split("-").map(Number);

        if (
          effectiveYear < versionYear ||
          (effectiveYear === versionYear && effectiveMonth <= versionMonth)
        ) {
          isCurrent = true;
        }
      }
    }


    const uploadedFile = await storage.createFile(
      AUDIT_BUCKET_ID,
      ID.unique(),
      InputFile.fromBuffer(buffer, file.name),
    );

    try{
      const newDocument = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID_DOCUMENTS,
        documentId,
        {
          coopId: meta.coopId,
          category: meta.category,
          subCategory: meta.subCategory ?? null,

          fileId: uploadedFile.$id,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,

          visibleToMembers: meta.visibleToMembers ?? false,
          downloadAllowed: meta.downloadAllowed ?? false,
          sharedWithMembers: meta.visibleToMembers ? true : false,

          referenceYear,
          referenceId,

          version,
          effectiveFrom: meta.effectiveFrom,
          registerEntryRef: null,

          isCurrent,
          isArchived: false,

          uploadedBy: user.userId,
          uploadedAt,

          userId: meta.userId ?? null,
        },
      );

      if (meta.category === "SATZUNG" && isCurrent) {
        const currentDocs = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID_DOCUMENTS,
          [
            Query.equal("coopId", meta.coopId),
            Query.equal("category", "SATZUNG"),
            Query.equal("isCurrent", true),
            Query.limit(2),
          ],
        );

        for (const doc of currentDocs.documents) {
          if (doc.$id !== newDocument.$id) {
            await databases.updateDocument(
              DATABASE_ID,
              COLLECTION_ID_DOCUMENTS,
              doc.$id,
              {
                isCurrent: false,
                isArchived: true,
              },
            );
          }
        }
      }
    
      if (meta.visibleToMembers) {
        const uploaderProfile = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID_PROFILE,
          [Query.equal("userId", user.userId)],
        );

        const profile = uploaderProfile.documents[0];

        await createAuditLog({
          action:
            meta.category === "SATZUNG"
              ? "SATZUNG_VERSION_UPDATE"
              : "UPLOAD_DOC",
          entityType: "DOCUMENT",
          entityId: newDocument.$id,

          performedBy: user.userId,
          performedByName: profile
            ? `${profile.FirstName} ${profile.LastName}`
            : "Unknown",

          coopId: meta.coopId,

          targetType: meta.visibleToMembers ? "ALL" : "ADMIN",

          metadata: {
            fileName: file.name,
            category: meta.category,
            version: version || null,
            visibleToMembers: meta.visibleToMembers,
            downloadAllowed: meta.downloadAllowed,
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: newDocument,
      });
    } catch (dbError){
      await storage.deleteFile(AUDIT_BUCKET_ID, uploadedFile.$id)
        .catch(console.error);
      throw dbError;
    }
  
  } catch (error) {
    console.error("Upload Failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: safePublicError(error, "Upload failed"),
        },
      },
      { status: 500 },
    );
  }
}

// Add registry entry in docs
export async function PUT(req) {
  const { databases } = createAdminClient();

  try {
    const body = await req.json();
    const { documentId, coopId, registerEntryRef } = body;

    if (!documentId || !coopId || !registerEntryRef) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const auth = await ensureCoopAdminAccess(coopId);

    if (!auth || auth.error) {
      return NextResponse.json(
        {
          success: false,
          error: auth?.error || "Unauthorized access. Admins only.",
        },
        { status: 403 },
      );
    }

    const doc = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_DOCUMENTS,
      documentId,
    );

    if (!doc) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 },
      );
    }

    if (doc.category !== "SATZUNG") {
      return NextResponse.json(
        { success: false, error: "Only SATZUNG docs can have registry entry" },
        { status: 400 },
      );
    }

    const updated = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_DOCUMENTS,
      documentId,
      {
        registerEntryRef,
      },
    );

    try {
      await createAuditLog({
        action: "REGISTRY_ENTRY_ADDED",
        entityType: "DOCUMENT",
        entityId: documentId,
        performedBy: auth.userId,
        performedByName: null,
        coopId,
        targetType: "ALL",
        metadata: {
          fileName: doc.fileName,
          category: doc.category,
          registerEntryRef,
        },
      });
    } catch (err) {
      console.error("Audit failed:", err.message);
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Update Registry Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: safePublicError(error, "Failed to update registry entry"),
      },
      { status: 500 },
    );
  }
}
