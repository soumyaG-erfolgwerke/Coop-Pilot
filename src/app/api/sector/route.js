import { NextResponse } from "next/server";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_SECTORS } from "@/lib/appwrite-server";

// GET /api/sector - Get all sectors
export async function GET() {
  try {
    const { databases } = createAdminClient();

    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_SECTORS
    );

    return NextResponse.json({ success: true, sectors: response.documents });
  } catch (error) {
    console.error("Error fetching sectors:", error);
    return NextResponse.json({ success: false, sectors: [] }, { status: 500 });
  }
}
