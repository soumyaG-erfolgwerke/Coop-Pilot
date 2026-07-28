import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_PROFILE } from "@/lib/appwrite-server";

// GET /api/userServices/activeMembers - Get all active members
export async function GET() {
  try {
    const { databases } = await createAdminClient();

    const profilesResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      [Query.equal("status", "active"), Query.equal("role", "member")]
    );

    const members = profilesResult.documents.map((user) => ({
      id: user.userId,
      name: `${user.FirstName} ${user.LastName}`,
      email: user.contactEmail,
      role: user.role,
      status: user.status,
    }));

    return NextResponse.json({ success: true, members });
  } catch (error) {
    console.error("Error in getAllActiveMembersService:", error);
    return NextResponse.json(
      { success: false, error: "Could not fetch active members" },
      { status: 500 }
    );
  }
}
