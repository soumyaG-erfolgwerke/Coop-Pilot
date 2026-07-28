import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_COOPERATIVES,
  COLLECTION_ID_AUDIT_HISTORY,
} from "@/lib/appwrite-server";
import { getCurrentUserRole } from "../route";

// GET /api/auditServices/[coopId]/[auditId] - Get audit data for a cooperative
export async function GET(request, { params }) {
  try {
    const { coopId, auditId } = await params;

    if (!coopId) {
      return NextResponse.json(
        { success: false, error: "Cooperative ID is required" },
        { status: 400 },
      );
    }

    if (!auditId) {
      return NextResponse.json(
        { success: false, error: "Audit ID is required" },
        { status: 400 },
      );
    }

    const { databases } = createAdminClient();

    const auditDoc = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_HISTORY,
      auditId,
    );

    return NextResponse.json({
      success: true,
      auditData: auditDoc.auditJson,
      auditStatus: auditDoc.status,
    });
  } catch (error) {
    console.error(`Failed to get audit data:`, error);
    return NextResponse.json(
      { success: false, error: "Could not fetch audit data" },
      { status: 500 },
    );
  }
}
