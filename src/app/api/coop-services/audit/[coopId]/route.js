import { NextResponse } from "next/server";
import {
  DATABASE_ID,
  COLLECTION_ID_COOPERATIVES,
  createAdminClient,
} from "@/lib/appwrite-server";
import { requireCoopAuditAccess } from "@/lib/auth/audit-access";
import { sessionErrorResponse } from "@/lib/auth/session";

export async function GET(request, { params }) {
  try {
    const { coopId } = await params;
    await requireCoopAuditAccess(coopId);

    const { databases } = createAdminClient();

    const coop = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId,
    );

    return NextResponse.json({
      success: true,
      auditJson: coop.auditJson || null,
      auditStatus: coop.auditStatus || null,
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch audit status",
      },
      { status: 500 },
    );
  }
}
