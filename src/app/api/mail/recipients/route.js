import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_PROFILE } from "@/lib/appwrite-server";

// GET /api/mail/recipients?role=... - Get recipients by role
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    if (!role) {
      return NextResponse.json(
        { success: false, error: "role is required" },
        { status: 400 }
      );
    }

    const { databases } = createAdminClient();

    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      [Query.equal("role", role)]
    );

    return NextResponse.json({ success: true, recipients: response.documents });
  } catch (error) {
    console.error(`Failed to fetch recipients:`, error);
    return NextResponse.json({ success: false, recipients: [] }, { status: 500 });
  }
}
