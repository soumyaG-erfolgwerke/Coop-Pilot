import { NextResponse } from "next/server";
import { COLLECTION_ID_AUDIT_ORGS, createAdminClient, DATABASE_ID } from "@/lib/appwrite-server";

export async function GET() {
  try {
    const { databases } = createAdminClient();

    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_ORGS,
    );

    return NextResponse.json({
      success: true,

      documents: response.documents,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,

        error: error.message || "Failed to fetch audit organizations",
      },
      {
        status: 500,
      },
    );
  }
}
