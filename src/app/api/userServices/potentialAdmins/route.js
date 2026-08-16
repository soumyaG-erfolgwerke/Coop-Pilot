import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_PROFILE } from "@/lib/appwrite-server";
import { resolveSession, requireRole, sessionErrorResponse } from "@/lib/auth/session";

// GET /api/userServices/potentialAdmins - Get potential admins (coopadmins)
export async function GET() {
  try {
    const session = await resolveSession();
    requireRole(session, ["superuser", "superadmin"]);
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
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error in getPotentialAdmins:", error);
    return NextResponse.json(
      { success: false, error: "Could not fetch potential admins" },
      { status: 500 }
    );
  }
}
