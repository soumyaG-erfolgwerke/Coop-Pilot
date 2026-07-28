import { NextResponse } from "next/server";
import { getLatestAuditForm } from "@/lib/auditFormService";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const orgId = searchParams.get("orgId");
    const auditType = searchParams.get("auditType");

    if (!orgId || !auditType) {
      return NextResponse.json(
        {
          success: false,
          error: "orgId and auditType are required",
        },
        { status: 400 },
      );
    }

    const auditForm = await getLatestAuditForm(orgId, auditType);

    return NextResponse.json({
      success: true,
      auditForm: auditForm || null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
