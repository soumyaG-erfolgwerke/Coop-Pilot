import { NextResponse } from "next/server";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_COOPERATIVES } from "@/lib/appwrite-server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const coopId = searchParams.get("coopId");

    if (!coopId) {
      return NextResponse.json(
        { success: false, error: "coopId is required" },
        { status: 400 }
      );
    }

    const { databases } = createAdminClient();

    const coop = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId
    );

    return NextResponse.json({ success: true, name: coop.name });
  } catch (error) {
    console.error("Failed to fetch cooperative name:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
