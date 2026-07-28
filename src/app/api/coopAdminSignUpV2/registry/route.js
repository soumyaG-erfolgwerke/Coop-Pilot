import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_COOP_REGISTRY } from "@/lib/appwrite-server";

// GET /api/coopAdminSignUp/registry - Get coop registry list
export async function GET() {
  try {
    const { databases } = createAdminClient();

    const coopRecords = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_COOP_REGISTRY,
      [Query.limit(100)]
    );

    return NextResponse.json({ success: true, documents: coopRecords.documents });
  } catch (error) {
    console.error("Error fetching coop registry:", error);
    return NextResponse.json(
      { success: false, error: "Could not fetch coop registry" },
      { status: 500 }
    );
  }
}
