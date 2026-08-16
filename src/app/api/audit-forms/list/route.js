import { NextResponse } from "next/server";
import { listAuditForms } from "@/lib/auditFormService";
import { safePublicError } from "@/lib/api/safe-public-error";
import { requireAuditOrgAccess } from "@/lib/auth/audit-access";
import { sessionErrorResponse } from "@/lib/auth/session";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const orgId = searchParams.get("orgId");

    if (typeof orgId !== "string" || orgId.length === 0 || orgId.length > 64) {
      return NextResponse.json(
        {
          success: false,
          error: "orgId is required",
        },
        { status: 400 },
      );
    }

    await requireAuditOrgAccess(orgId);

    const { total, documents } = await listAuditForms(orgId);

    return NextResponse.json({
      success: true,
      total,
      auditForms: documents,
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: safePublicError(error),
      },
      { status: 500 },
    );
  }
}
