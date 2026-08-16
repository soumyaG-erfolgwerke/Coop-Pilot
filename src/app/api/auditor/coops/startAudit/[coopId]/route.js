import { startAuditorService } from "@/services/auditor/audit/_auditHelpers";
import { NextResponse } from "next/server";
import { safePublicError } from "@/lib/api/safe-public-error";
import { requireAuditEditor, requireAuditOrgAccess } from "@/lib/auth/audit-access";
import { sessionErrorResponse } from "@/lib/auth/session";

export async function POST(req, { params }) {
  const { coopId } = await params;
  const { formType, orgId } = await req.json();
  try {
    if (typeof coopId !== "string" || coopId.length === 0 || coopId.length > 64 || typeof orgId !== "string" || orgId.length === 0 || orgId.length > 64 || typeof formType !== "string" || !/^[a-zA-Z0-9_-]{1,50}$/.test(formType)) {
      return NextResponse.json({ success: false, error: "Invalid audit start request" }, { status: 400 });
    }
    await requireAuditEditor(coopId);
    await requireAuditOrgAccess(orgId);
    const result = await startAuditorService(coopId, formType, orgId);
    return NextResponse.json(
      { code: 200, result, message: "Audit started successfully" },
      { status: 200 },
    );
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("ERROR IN STARTING AUDIT", error);
    return NextResponse.json(
      { code: 500, error: safePublicError(error), message: "Failed to start audit" },
      { status: 500 },
    );
  }
}
