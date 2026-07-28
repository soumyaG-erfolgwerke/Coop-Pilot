import { NextResponse } from "next/server";
import { createAdminClient, DATABASE_ID } from "@/lib/appwrite-server";

const COLLECTION_ID_COOPERATIVES = "683f21190030cfd38fce";

// GET /api/coops/[coopId]/report - Get report data for a cooperative
export async function GET(request, { params }) {
  try {
    const { coopId } = await params;

    if (!coopId) {
      return NextResponse.json({ error: "Cooperative ID is required" }, { status: 400 });
    }

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
    console.error(`Failed to get report data:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to get report data" },
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

    if (reportData == null || typeof reportData !== "object") {
      return NextResponse.json(
        { error: "reportData must be a non-null object" },
        { status: 400 }
      );
    }

    const { databases } = createAdminClient();

    const updated = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId,
      { reportData: JSON.stringify(reportData) }
    );

    return NextResponse.json({ reportData: updated.reportData ?? reportData });
  } catch (error) {
    console.error(`Failed to save report data:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to save report data" },
      { status: 500 }
    );
  }
}
