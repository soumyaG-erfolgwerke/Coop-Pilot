import { NextResponse } from "next/server";
import { listAuditForms } from "@/lib/auditFormService";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json(
        {
          success: false,
          error: "orgId is required",
        },
        { status: 400 },
      );
    }

    const { total, documents } = await listAuditForms(orgId);

    return NextResponse.json({
      success: true,
      total,
      auditForms: documents,
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
