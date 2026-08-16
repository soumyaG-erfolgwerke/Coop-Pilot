import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { safePublicError } from "@/lib/api/safe-public-error";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_COOPERATIVES,
  COLLECTION_ID_DOCUMENTS,
} from "@/lib/appwrite-server";
import {
  deriveDefaultSettingsFromCoop,
  ensureCoopAdminAccess,
  getAuthenticatedProfile,
  getCoopById,
  getSettingsDocumentByCoopId,
  writeSettingsAndAudit,
} from "@/lib/helpers/_helpers";

export async function GET(request) {
  try {
    const auth = await getAuthenticatedProfile();
    const { searchParams } = new URL(request.url);
    const coopId = searchParams.get("coopId");

    if (coopId) {
      await ensureCoopAdminAccess(coopId);
      const coopDoc = await getCoopById(coopId);
      const settingsDoc = await getSettingsDocumentByCoopId(coopId);

      const { databases } = createAdminClient();
      const satzungRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_DOCUMENTS,
        [
          Query.equal("coopId", coopId),
          Query.equal("category", "SATZUNG"),
          Query.limit(1),
        ]
      );
      const hasSatzung = satzungRes.documents.length > 0;

      return NextResponse.json({
        success: true,
        settings: {
          cooperative_id: coopId,
          ...deriveDefaultSettingsFromCoop(coopDoc, settingsDoc),
          hasSatzung,
          status: "active",
        },
        source: settingsDoc ? "cooperative_and_settings_document" : "cooperative_document",
      });
    }

    const { databases } = createAdminClient();

    let coopDocs = [];
    if (auth.role === "superuser") {
      const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID_COOPERATIVES, [
        Query.limit(100),
      ]);
      coopDocs = result.documents;
    } else if (auth.role === "coopadmin") {
      if (!auth.coopId) {
        return NextResponse.json({ success: true, settings: [] });
      }
      const coop = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID_COOPERATIVES,
        auth.coopId,
      );
      coopDocs = coop ? [coop] : [];
    } else {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const coopIds = coopDocs.map((coop) => coop.$id);
    const satzungRes =
      coopIds.length > 0
        ? await databases.listDocuments(DATABASE_ID, COLLECTION_ID_DOCUMENTS, [
            Query.equal("coopId", coopIds),
            Query.equal("category", "SATZUNG"),
            Query.limit(100),
          ])
        : { documents: [] };
    const satzungCoopIds = new Set(satzungRes.documents.map((doc) => doc.coopId));

    const settingsRes =
      coopIds.length > 0
        ? await databases.listDocuments(DATABASE_ID, COLLECTION_ID_DOCUMENTS, [
            Query.equal("coopId", coopIds),
            Query.equal("category", "SETTINGS"),
            Query.limit(100),
          ])
        : { documents: [] };
    const settingsByCoopId = new Map(
      settingsRes.documents.map((doc) => [doc.coopId, doc])
    );

    const settingsByCoop = coopDocs.map((coop) => {
      const settingsDoc = settingsByCoopId.get(coop.$id);
      const hasSatzung = satzungCoopIds.has(coop.$id);
      return {
        cooperative_id: coop.$id,
        ...deriveDefaultSettingsFromCoop(coop, settingsDoc),
        hasSatzung,
        status: "active",
      };
    });

    return NextResponse.json({ success: true, settings: settingsByCoop });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, error: safePublicError(error, "Failed to list settings") },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const auth = await getAuthenticatedProfile();
    const body = await request.json();
    const coopId = body?.coopId;

    if (!coopId) {
      return NextResponse.json({ success: false, error: "coopId is required" }, { status: 400 });
    }

    await ensureCoopAdminAccess(coopId);

    const { databases } = createAdminClient();
    const satzungRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_DOCUMENTS,
      [
        Query.equal("coopId", coopId),
        Query.equal("category", "SATZUNG"),
        Query.limit(1),
      ]
    );
    const hasSatzung = satzungRes.documents.length > 0;

    const result = await writeSettingsAndAudit({
      coopId,
      incomingSettings: {
        ...(body?.settings || body),
        hasSatzung,
      },
      changedBy: auth,
      changeReason: body?.changeReason,
    });

    if (!result.validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          errors: result.validation.errors,
          warnings: result.validation.warnings,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: {
        cooperative_id: coopId,
        ...deriveDefaultSettingsFromCoop(result.coopDocument, result.document),
        hasSatzung,
        status: "active",
      },
      warnings: result.validation.warnings,
    });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, error: safePublicError(error, "Failed to create settings") },
      { status: 500 }
    );
  }
}
