import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_COOP_PLATFORM_REGISTRY } from "@/lib/appwrite-server";

// GET /api/coopAdminSignUp/pending - Get pending coops
export async function GET() {
  try {
    const { databases } = createAdminClient();

    const coopRecords = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_COOP_PLATFORM_REGISTRY,
      [Query.equal("isPending", true)]
    );

    return NextResponse.json({ success: true, documents: coopRecords.documents });
  } catch (error) {
    console.error("Error fetching pending coops:", error);
    return NextResponse.json(
      { success: false, error: "Could not fetch pending coops" },
      { status: 500 }
    );
  }
}
