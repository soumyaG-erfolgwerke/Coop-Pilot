import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_DOCUMENTS,
} from "@/lib/appwrite-server";
import {
  deriveDefaultSettingsFromCoop,
  ensureCoopAdminAccess,
  getCoopById,
  getSettingsDocumentByCoopId,
  writeSettingsAndAudit,
} from "@/lib/helpers/_helpers";
import { getSubscription } from "@/lib/stripe/utils";
import { safePublicError } from "@/lib/api/safe-public-error";

export async function GET(request, { params }) {
  try {
    const { coopId } = await params;
    if (!coopId) {
      return NextResponse.json(
        { success: false, error: "coopId is required" },
        { status: 400 },
      );
    }

    await ensureCoopAdminAccess(coopId);

    const coopDoc = await getCoopById(coopId);
    // console.log("coopDoc", coopDoc);

    const settingsDoc = await getSettingsDocumentByCoopId(coopId);
    // console.log("settingsDoc", settingsDoc);

    const defaults = deriveDefaultSettingsFromCoop(coopDoc, settingsDoc);
    // console.log("defaults", defaults);

    const { databases } = createAdminClient();
    const satzungRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_DOCUMENTS,
      [
        Query.equal("coopId", coopId),
        Query.equal("category", "SATZUNG"),
        Query.limit(1),
      ],
    );
    const hasSatzung = satzungRes.documents.length > 0;

    return NextResponse.json({
      success: true,
      settings: {
        cooperative_id: coopId,
        ...defaults,
        hasSatzung,
        status: "active",
      },
      source: settingsDoc
        ? "cooperative_and_settings_document"
        : "cooperative_document",
    });
  } catch (error) {
    if (error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (error.code === 404) {
      return NextResponse.json(
        { success: false, error: "Cooperative not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: false, error: safePublicError(error, "Failed to get settings") },
      { status: 500 },
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { coopId } = await params;
    if (!coopId) {
      return NextResponse.json(
        { success: false, error: "coopId is required" },
        { status: 400 },
      );
    }

    const auth = await ensureCoopAdminAccess(coopId);
    const body = await request.json();
    // console.log("body", body);

    const { databases } = createAdminClient();

    // --- SECURITY SAFEGUARD ---
    const incomingSettings = body?.settings;
    if (incomingSettings?.isLive === true) {
      try {
        const subData = await getSubscription(databases, coopId);

        if (subData?.stripeSubscriptionStatus !== "ACTIVE") {
          return NextResponse.json(
            {
              success: false,
              errors: ["Cannot go live. The cooperative does not have an active subscription."],
              warnings: []
            },
            { status: 403 },
          );
        }
      } catch (stripeError) {
        return NextResponse.json(
          {
            success: false,
            errors: ["Failed to verify subscription status securely. Please try again."],
            warnings: []
          },
          { status: 500 },
        );
      }
    }
    // --- END SECURITY GATEWAY ---

    const satzungRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_DOCUMENTS,
      [
        Query.equal("coopId", coopId),
        Query.equal("category", "SATZUNG"),
        Query.limit(1),
      ],
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
        { status: 400 },
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
    if (error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (error.code === 404) {
      return NextResponse.json(
        { success: false, error: "Cooperative not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: false, error: safePublicError(error, "Failed to update settings") },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  // DELETE is intentionally disabled for safety right now.
  // Original implementation kept below for easy re-enable when needed.
  /*
  try {
    const { coopId } = await params;
    if (!coopId) {
      return NextResponse.json({ success: false, error: "coopId is required" }, { status: 400 });
    }

    await ensureCoopAdminAccess(coopId);

    return NextResponse.json(
      { success: false, error: "DELETE_DISABLED" },
      { status: 405 }
    );
  } catch (error) {
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: safePublicError(error, "Failed to delete settings") },
      { status: 500 }
    );
  }
  */

  return NextResponse.json(
    {
      success: false,
      error: "DELETE_DISABLED",
      message: "Deleting cooperative coop settings is currently disabled.",
    },
    { status: 405 },
  );
}
