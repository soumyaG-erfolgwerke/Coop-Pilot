import { getCoopById, stripInternalFields } from "@/lib/helpers/_helpers";
import { NextResponse } from "next/server";
import { requireCoopAuditAccess } from "@/lib/auth/audit-access";
import { sessionErrorResponse } from "@/lib/auth/session";

export async function GET(request, { params }) {
  try {
    const { coopId } = await params;
    await requireCoopAuditAccess(coopId, { allowCoopAdmin: false });
    const coopData = await getCoopById(coopId);
    return NextResponse.json(
      {
        coop: stripInternalFields(coopData),
        success: true,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Failed to load cooperative data:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load cooperative data" },
      { status: 500 },
    );
  }
}
