import { NextResponse } from "next/server";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_COOPERATIVES,
  COLLECTION_ID_AUDIT_HISTORY,
} from "@/lib/appwrite-server";
import { requireAuditEditor } from "@/lib/auth/audit-access";
import { sessionErrorResponse } from "@/lib/auth/session";

const ALLOWED_AUDIT_STATUSES = new Set([
  "START", "IN_PROGRESS", "SUBMITTED", "ASKED_TO_RESUBMIT",
  "ASK_TO_RESUBMIT", "APPROVED", "COMPLETED", "REJECTED",
]);

// PATCH /api/auditServices/[coopId]/status - Update audit status
export async function PATCH(request, { params }) {
  try {
    const { coopId } = await params;
    const session = await requireAuditEditor(coopId);
    const body = await request.json();
    let auditId = body.auditId;
    const auditStatus = body.auditStatus;

    if (!coopId) {
      return NextResponse.json(
        { success: false, error: "Cooperative ID is required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_AUDIT_STATUSES.has(auditStatus)) {
      return NextResponse.json(
        { success: false, error: "Audit status is required" },
        { status: 400 }
      );
    }

    const { databases } = createAdminClient();

    // 1. Fetch both documents first to record original status for rollback
    let coopDoc;
    try {
      coopDoc = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID_COOPERATIVES,
        coopId
      );
    } catch (err) {
      console.error(`Failed to fetch cooperative document:`, err);
      return NextResponse.json(
        { success: false, error: "Cooperative not found" },
        { status: 404 }
      );
    }

    if (!auditId) {
      auditId = coopDoc.currentAuditId;
    }

    if (!auditId) {
      return NextResponse.json(
        { success: false, error: "Audit ID is required" },
        { status: 400 }
      );
    }

    let auditDoc;
    try {
      auditDoc = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID_AUDIT_HISTORY,
        auditId
      );
    } catch (err) {
      console.error(`Failed to fetch audit history document:`, err);
      return NextResponse.json(
        { success: false, error: "Audit history document not found" },
        { status: 404 }
      );
    }
    if (auditDoc.coopId !== coopId) {
      return NextResponse.json({ success: false, error: "Audit history document not found" }, { status: 404 });
    }

    const originalCoopStatus = coopDoc.auditStatus || "";
    const originalAuditStatus = auditDoc.status || "";
    if (originalAuditStatus === auditStatus && originalCoopStatus === auditStatus) {
      return NextResponse.json({ success: true, document: coopDoc });
    }
    if (["COMPLETED", "REJECTED"].includes(originalAuditStatus)) {
      return NextResponse.json(
        { success: false, error: "Finalized audit status cannot be changed" },
        { status: 409 },
      );
    }

    // 2. Perform updates with tracking for rollbacks
    let coopUpdated = false;
    let auditUpdated = false;
    let updatedCoopDoc = null;

    try {
      await Promise.all([
        databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID_COOPERATIVES,
          coopId,
          { auditStatus: auditStatus }
        ).then((doc) => {
          coopUpdated = true;
          updatedCoopDoc = doc;
        }),
        databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID_AUDIT_HISTORY,
          auditId,
          { status: auditStatus }
        ).then(() => {
          auditUpdated = true;
        }),
      ]);
    } catch (updateError) {
      console.error("Failed to update status. Initiating rollback...", updateError);
      
      const rollbackPromises = [];
      if (coopUpdated) {
        rollbackPromises.push(
          databases.updateDocument(
            DATABASE_ID,
            COLLECTION_ID_COOPERATIVES,
            coopId,
            { auditStatus: originalCoopStatus }
          ).catch(err => console.error("Rollback failed for cooperative:", err))
        );
      }
      if (auditUpdated) {
        rollbackPromises.push(
          databases.updateDocument(
            DATABASE_ID,
            COLLECTION_ID_AUDIT_HISTORY,
            auditId,
            { status: originalAuditStatus }
          ).catch(err => console.error("Rollback failed for audit history:", err))
        );
      }

      if (rollbackPromises.length > 0) {
        await Promise.all(rollbackPromises);
      }

      throw updateError;
    }

    // Create Audit Log note for status update
    try {
      const role = session.role;
      if (role && ["org_admin", "auditer", "aud_E"].includes(role) && coopDoc.auditOrgId) {
        const { createAuditLog } = await import("@/lib/helpers/_loggerHelper");
        await createAuditLog({
          auditOrgId: coopDoc.auditOrgId,
          logNote: `Audit status for cooperative "${coopDoc.name}" (${coopId}) changed from "${originalCoopStatus || "NOT_STARTED"}" to "${auditStatus}".`,
          role,
        });
      }
    } catch (logErr) {
      console.error("Failed to write status update audit log:", logErr);
    }

    return NextResponse.json({ success: true, document: updatedCoopDoc });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error(`Failed to update audit status:`, error);
    return NextResponse.json(
      { success: false, error: "Could not update audit status" },
      { status: 500 }
    );
  }
}
