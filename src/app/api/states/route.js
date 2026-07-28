import { NextResponse } from "next/server";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_STATES } from "@/lib/appwrite-server";

// GET /api/states - Get all states
export async function GET() {
  try {
    const { databases } = createAdminClient();

    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_STATES
    );

    return NextResponse.json({ success: true, states: response.documents });
  } catch (error) {
    console.error("Error fetching states:", error);
    return NextResponse.json({ success: false, states: [] }, { status: 500 });
  }
}
