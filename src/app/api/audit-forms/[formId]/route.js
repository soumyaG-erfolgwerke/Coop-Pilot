import { NextResponse } from "next/server";
import { getAuditFormById, updateAuditForm } from "@/lib/auditFormService";
import { safePublicError } from "@/lib/api/safe-public-error";
import { requireAuditOrgAccess } from "@/lib/auth/audit-access";
import { sessionErrorResponse } from "@/lib/auth/session";

const EDITOR_ROLES = new Set(["superuser", "superadmin", "org_admin", "auditer", "aud_E"]);

// Get audit form by id
export async function GET(request, { params }) {
  try {
    const { formId } = await params;
    const auditForm = await getAuditFormById(formId);
    const auditOrgId = auditForm.auditOrgs?.$id || auditForm.auditOrgs;
    if (!auditOrgId) return sessionErrorResponse({ status: 403 });
    await requireAuditOrgAccess(auditOrgId);

    return NextResponse.json({
      success: true,
      auditForm,
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error(error);
    const status = error.message === "UNAUTHORIZED" ? 401 : error.code === 404 ? 404 : 500;
    return NextResponse.json(
      {
        success: false,
        error: safePublicError(error),
      },
      { status },
    );
  }
}

// Update audit forms
export async function PATCH(request, { params }) {
  try {
    const { formId } = await params;
    const existingForm = await getAuditFormById(formId);
    const auditOrgId = existingForm.auditOrgs?.$id || existingForm.auditOrgs;
    if (!auditOrgId) return sessionErrorResponse({ status: 403 });
    const session = await requireAuditOrgAccess(auditOrgId);
    if (!EDITOR_ROLES.has(session.role)) return sessionErrorResponse({ status: 403 });
    const { template, version, status, macros } = await request.json();

    const auditForm = await updateAuditForm(formId, {
      template,
      version,
      status,
      macros
    });

    return NextResponse.json({
      success: true,
      auditForm,
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error(error);
    const status = error.message === "UNAUTHORIZED" ? 401 : 500;

    return NextResponse.json(
      {
        success: false,
        error: safePublicError(error),
      },
      { status },
    );
  }
}

