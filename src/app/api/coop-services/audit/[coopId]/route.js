import { NextResponse } from "next/server";
import {
  DATABASE_ID,
  COLLECTION_ID_COOPERATIVES,
  createAdminClient,
} from "@/lib/appwrite-server";

export async function GET(request, { params }) {
  try {
    const { coopId } = await params;

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
