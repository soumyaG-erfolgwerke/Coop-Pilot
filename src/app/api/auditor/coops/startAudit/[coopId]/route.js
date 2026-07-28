import { startAuditorService } from "@/services/auditor/audit/_auditHelpers";
import { NextResponse } from "next/server";

export async function POST(req, { params }) {
  const { coopId } = await params;
  const { formType, orgId } = await req.json();
  try {
    const result = await startAuditorService(coopId, formType, orgId);
    return NextResponse.json(
      { code: 200, result, message: "Audit started successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("ERROR IN STARTING AUDIT", error);
    return NextResponse.json(
      { code: 500, error: error.message, message: "Failed to start audit" },
      { status: 500 },
    );
  }
}
