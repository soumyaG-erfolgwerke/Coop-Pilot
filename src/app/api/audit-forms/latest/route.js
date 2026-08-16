import { NextResponse } from "next/server";
import { getLatestAuditForm } from "@/lib/auditFormService";
import { safePublicError } from "@/lib/api/safe-public-error";
import { requireAuditOrgAccess } from "@/lib/auth/audit-access";
import { sessionErrorResponse } from "@/lib/auth/session";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const orgId = searchParams.get("orgId");
    const auditType = searchParams.get("auditType");

    if (typeof orgId !== "string" || orgId.length === 0 || orgId.length > 64 || typeof auditType !== "string" || !/^[a-zA-Z0-9_-]{1,50}$/.test(auditType)) {
      return NextResponse.json(
        {
          success: false,
          error: "orgId and auditType are required",
        },
        { status: 400 },
      );
    }

    await requireAuditOrgAccess(orgId);

    const auditForm = await getLatestAuditForm(orgId, auditType);

    return NextResponse.json({
      success: true,
      auditForm: auditForm || null,
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    return NextResponse.json(
      {
        success: false,
        error: safePublicError(error),
      },
      { status: 500 },
    );
  }
}
