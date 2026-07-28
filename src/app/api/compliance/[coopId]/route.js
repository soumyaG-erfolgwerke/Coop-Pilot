import { calculateComplianceGrade } from "@/lib/helpers/_complianceHelpers";
import { hasCoopAdminAccess } from "@/lib/helpers/_helpers";
import { complianceSchema } from "@/services/compliance/ComplianceSchema";
import {
  getAssemblyCountForCoop,
  getDocsCountForCoop,
} from "@/services/compliance/ComplianceServices";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { coopId } = await params;

    if (!coopId) {
      return NextResponse.json(
        { success: false, error: "coopId is required" },
        { status: 400 },
      );
    }

    const auth = await hasCoopAdminAccess(coopId);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const results = await Promise.all(
      complianceSchema.map(async (check) => {
        const result = await check.function(coopId);
        return {
          name: check.name,
          text: check.text,
          actionUrl: check.actionUrl,
          result,
        };
      }),
    );

    const { upcomingAssemblyCount, totalAssemblyCount } =
      await getAssemblyCountForCoop(coopId);
    const docsCount = await getDocsCountForCoop(coopId);
    const result = calculateComplianceGrade(results);

    return NextResponse.json(
      {
        success: true,
        details: results,
        result: result,
        assemblyInfo: {
          upcomingAssemblyCount,
          totalAssemblyCount,
        },
        docsCount: docsCount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error checking compliance:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error checking compliance",
      },
      { status: 500 },
    );
  }
}
