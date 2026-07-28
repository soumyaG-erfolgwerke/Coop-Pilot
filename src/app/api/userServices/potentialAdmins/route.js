import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_PROFILE } from "@/lib/appwrite-server";

// GET /api/userServices/potentialAdmins - Get potential admins (coopadmins)
export async function GET() {
  try {
    const { databases } = await createAdminClient();

    const profilesResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      [Query.equal("role", "coopadmin")]
    );

    const coopAdminAccounts = profilesResult.documents.map((user) => ({
      id: user.userId,
      name: `${user.FirstName} ${user.LastName}`,
      email: user.contactEmail,
      role: user.role,
      status: user.status,
      isVerified: user.isVerified,
    }));

    return NextResponse.json({ success: true, admins: coopAdminAccounts });
  } catch (error) {
    console.error("Error in getPotentialAdmins:", error);
    return NextResponse.json(
      { success: false, error: "Could not fetch potential admins" },
      { status: 500 }
    );
  }
}
