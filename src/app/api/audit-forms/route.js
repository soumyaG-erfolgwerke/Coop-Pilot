import { NextResponse } from "next/server";
import { getDraftForm, createAuditForm } from "@/lib/auditFormService";

// Get draft form
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const orgId = searchParams.get("orgId");
    const auditType = searchParams.get("auditType");

    if (!orgId || !auditType) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing parameters",
        },
        { status: 400 },
      );
    }

    const auditForm = await getDraftForm(orgId, auditType);

    return NextResponse.json({
      success: true,
      auditForm,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}

// Create new audit form draft
export async function POST(request) {
  try {
    const { auditOrgId, auditType, template = {}, version } = await request.json();

    if (!auditOrgId || !auditType) {
      return NextResponse.json(
        {
          success: false,
          error: "auditOrgId and auditType are required",
        },
        { status: 400 },
      );
    }

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
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
