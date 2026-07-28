import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_PROFILE } from "@/lib/appwrite-server";

// POST /api/coopAdminSignUp/searchUser - Check if user exists by email
export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const { databases } = createAdminClient();

    const existingProfiles = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      [Query.equal("contactEmail", email)]
    );

    const exists = existingProfiles.documents.length > 0;

    return NextResponse.json({ success: true, exists });
  } catch (error) {
    console.error("Error searching for user:", error);
    return NextResponse.json(
      { success: false, error: "Could not search for user" },
      { status: 500 }
    );
  }
}
