import { NextResponse } from "next/server";
import { ensureAuditAccess } from "@/lib/helpers/_orgAuxHelper";

export const GET = async (request, { params }) => {
  try {
    const { auditId } = await params;
    const access = await ensureAuditAccess(auditId);
    if (!access.isAllowed) {
      return NextResponse.json(
        {
          success: false,
          error: access.error || "Forbidden",
        },
        { status: access.error === "You are not logged in" ? 401 : 403 },
      );
    }

    return NextResponse.json({
      success: true,
      data: access.audit,
    });
  } catch (error) {
    console.error("Failed to fetch audit:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch audit",
      },
      { status: 500 },
    );
  }
};
