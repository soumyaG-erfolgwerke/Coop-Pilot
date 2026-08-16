import { NextResponse } from "next/server";
import { createAdminClient, DATABASE_ID } from "@/lib/appwrite-server";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { requireCoopAdministration } from "@/lib/auth/membership-access";
import { requireCoopAuditAccess } from "@/lib/auth/audit-access";

const COLLECTION_ID_COOPERATIVES = "683f21190030cfd38fce";

// GET /api/coops/[coopId]/report - Get report data for a cooperative
export async function GET(request, { params }) {
  try {
    const { coopId } = await params;

    if (!coopId) {
      return NextResponse.json({ error: "Cooperative ID is required" }, { status: 400 });
    }
    const session = await resolveSession();
    if (["org_admin", "auditer", "aud_E", "aud_T"].includes(session.role)) await requireCoopAuditAccess(coopId);
    else await requireCoopAdministration(session, coopId);

    const { databases } = createAdminClient();

    const doc = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId
    );

    const reportData = doc?.reportData && Object.keys(doc.reportData).length > 0
      ? doc.reportData
      : null;

    return NextResponse.json({ reportData });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error(`Failed to get report data:`, error);
    return NextResponse.json(
      { error: "Failed to get report data" },
      { status: 500 }
    );
  }
}

// PUT /api/coops/[coopId]/report - Save report data for a cooperative
export async function PUT(request, { params }) {
  try {
    const { coopId } = await params;
    const { reportData } = await request.json();

    if (!coopId) {
      return NextResponse.json({ error: "Cooperative ID is required" }, { status: 400 });
    }
    const session = await resolveSession();
    await requireCoopAdministration(session, coopId);

    if (reportData == null || typeof reportData !== "object") {
      return NextResponse.json(
        { error: "reportData must be a non-null object" },
        { status: 400 }
      );
    }
    const serializedReport = JSON.stringify(reportData);
    if (serializedReport.length > 1_000_000) {
      return NextResponse.json({ error: "reportData is too large" }, { status: 413 });
    }

    const { databases } = createAdminClient();

    const updated = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId,
      { reportData: serializedReport }
    );

    return NextResponse.json({ reportData: updated.reportData ?? reportData });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error(`Failed to save report data:`, error);
    return NextResponse.json(
      { error: "Failed to save report data" },
      { status: 500 }
    );
  }
}
