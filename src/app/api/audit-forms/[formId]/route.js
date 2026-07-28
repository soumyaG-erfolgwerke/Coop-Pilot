import { NextResponse } from "next/server";
import { getAuditFormById, updateAuditForm } from "@/lib/auditFormService";
import { getAuthenticatedProfile } from "@/lib/helpers/_helpers";

// Get audit form by id
export async function GET(request, { params }) {
  try {
    const user = await getAuthenticatedProfile();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { formId } = await params;
    const auditForm = await getAuditFormById(formId);

    return NextResponse.json({
      success: true,
      auditForm,
    });
  } catch (error) {
    console.error(error);
    const status = error.message === "UNAUTHORIZED" ? 401 : error.code === 404 ? 404 : 500;
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status },
    );
  }
}

// Update audit forms
export async function PATCH(request, { params }) {
  try {
    const user = await getAuthenticatedProfile();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only administrators and auditors are allowed to modify form templates
    const allowedRoles = ["org_admin", "auditer", "superuser", "aud_E", "aud_A"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    const { formId } = await params;
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
    console.error(error);
    const status = error.message === "UNAUTHORIZED" ? 401 : 500;

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status },
    );
  }
}

