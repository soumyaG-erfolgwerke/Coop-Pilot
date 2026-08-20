import { NextResponse } from "next/server";
import {
  DATABASE_ID,
  COLLECTION_ID_COOPERATIVES,
  createAdminClient,
} from "@/lib/appwrite-server";
import { requireCoopAuditAccess } from "@/lib/auth/audit-access";
import { sessionErrorResponse } from "@/lib/auth/session";

export async function GET(request, { params }) {
  try {
    const { coopId } = await params;
    await requireCoopAuditAccess(coopId);

    const { databases } = createAdminClient();

    const coop = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId,
    );

    let auditJson = coop.auditJson;

    // If the audit was submitted or asked to resubmit, the coop's auditJson might be cleared.
    // In that case, fetch it from the current audit history document.
    if (!auditJson && coop.currentAuditId) {
      try {
        const auditHistory = await databases.getDocument(
          DATABASE_ID,
          "6a184c0200214ea76983", // COLLECTION_ID_AUDIT_HISTORY
          coop.currentAuditId
        );
        auditJson = auditHistory.auditJson;
      } catch (err) {
        console.error("Failed to fetch audit history:", err);
      }
    }

    return NextResponse.json({
      success: true,
      auditJson: auditJson || null,
      auditStatus: coop.auditStatus || null,
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch audit status",
      },
      { status: 500 },
    );
  }
}
