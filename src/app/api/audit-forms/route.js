import { NextResponse } from "next/server";
import { getDraftForm, createAuditForm } from "@/lib/auditFormService";
import { safePublicError } from "@/lib/api/safe-public-error";
import { requireAuditOrgAccess } from "@/lib/auth/audit-access";
import { sessionErrorResponse } from "@/lib/auth/session";

const EDITOR_ROLES = new Set(["superuser", "superadmin", "org_admin", "auditer", "aud_E"]);
const validId = (value) => typeof value === "string" && value.length > 0 && value.length <= 64;
const validAuditType = (value) => typeof value === "string" && /^[a-zA-Z0-9_-]{1,50}$/.test(value);

// Get draft form
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const orgId = searchParams.get("orgId");
    const auditType = searchParams.get("auditType");

    if (!validId(orgId) || !validAuditType(auditType)) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing parameters",
        },
        { status: 400 },
      );
    }

    await requireAuditOrgAccess(orgId);

    const auditForm = await getDraftForm(orgId, auditType);

    return NextResponse.json({
      success: true,
      auditForm,
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

// Create new audit form draft
export async function POST(request) {
  try {
    const { auditOrgId, auditType, template = {}, version } = await request.json();

    let templateSize = Infinity;
    try { templateSize = Buffer.byteLength(JSON.stringify(template)); } catch {}
    if (!validId(auditOrgId) || !validAuditType(auditType) || (version !== undefined && (typeof version !== "string" || version.length > 30)) || !template || typeof template !== "object" || Array.isArray(template) || templateSize > 500_000) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid audit form data",
        },
        { status: 400 },
      );
    }


    const session = await requireAuditOrgAccess(auditOrgId);
    if (!EDITOR_ROLES.has(session.role)) return sessionErrorResponse({ status: 403 });

    const auditForm = await createAuditForm({
      auditOrgId,
      auditType,
      template,
      version,
    });

    return NextResponse.json({
      success: true,
      auditForm,
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
