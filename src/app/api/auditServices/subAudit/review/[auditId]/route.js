import {
  COLLECTION_ID_AUDIT_HISTORY,
  createAdminClient,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { NextResponse } from "next/server";
import { requireRole, resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { requireAuditEditor } from "@/lib/auth/audit-access";

const { databases } = createAdminClient();

export const PATCH = async (request, { params }) => {
  try {
    const session = requireRole(await resolveSession(), ["aud_E", "auditer", "org_admin", "superuser"]);
    const { auditId } = await params;
    const { status } = await request.json();
    if (typeof status !== "boolean") {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }
    const existing = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_HISTORY,
      auditId,
    );
    await requireAuditEditor(existing.coopId);

    const result = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_HISTORY,
      auditId,
      { isSubApproved: status, subReviewedBy: session.email || session.userId },
    );

    if (!result) {
      return NextResponse.json(
        { error: "Failed to update audit status" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      result,
      message: "Audit updated successfully",
      success: true,
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403 || error?.message === "FORBIDDEN") {
      return sessionErrorResponse(error?.message === "FORBIDDEN" ? { status: 403 } : error);
    }
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch audit review" },
      { status: 500 },
    );
  }
};
