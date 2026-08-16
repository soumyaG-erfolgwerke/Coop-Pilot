import { NextResponse } from "next/server";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_AUDIT_HISTORY,
} from "@/lib/appwrite-server";
import { requireCoopAuditAccess } from "@/lib/auth/audit-access";
import { sessionErrorResponse } from "@/lib/auth/session";

// GET /api/auditServices/[coopId]/[auditId] - Get audit data for a cooperative
export async function GET(request, { params }) {
  try {
    const { coopId, auditId } = await params;
    await requireCoopAuditAccess(coopId);

    if (!coopId) {
      return NextResponse.json(
        { success: false, error: "Cooperative ID is required" },
        { status: 400 },
      );
    }

    if (!auditId) {
      return NextResponse.json(
        { success: false, error: "Audit ID is required" },
        { status: 400 },
      );
    }

    const { databases } = createAdminClient();

    const auditDoc = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_HISTORY,
      auditId,
    );
    if (auditDoc.coopId !== coopId) {
      return NextResponse.json({ success: false, error: "Audit not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      auditData: auditDoc.auditJson,
      auditStatus: auditDoc.status,
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error(`Failed to get audit data:`, error);
    return NextResponse.json(
      { success: false, error: "Could not fetch audit data" },
      { status: 500 },
    );
  }
}
