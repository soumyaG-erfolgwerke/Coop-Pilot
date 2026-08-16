import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_PROFILE } from "@/lib/appwrite-server";
import { resolveSession, requireRole, sessionErrorResponse } from "@/lib/auth/session";

// POST /api/userServices/byIds - Get users by list of IDs
export async function POST(request) {
  try {
    const session = await resolveSession();
    requireRole(session, ["coopadmin", "auditer", "aud_E", "org_admin", "superuser", "superadmin"]);
    const { userIds } = await request.json();
    
    if (!Array.isArray(userIds) || userIds.length < 1 || userIds.length > 100 || userIds.some((id) => typeof id !== "string" || id.length > 64)) {
      return NextResponse.json(
        { success: false, error: "userIds array is required" },
        { status: 400 }
      );
    }

    const { databases } = await createAdminClient();

    const usersResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      [Query.equal("userId", userIds)]
    );

    const users = usersResult.documents.map((user) => ({
      id: user.userId,
      name: `${user.FirstName} ${user.LastName}`,
      email: user.contactEmail,
      role: user.role,
      status: user.status,
    }));

    return NextResponse.json({ success: true, users });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error in getUserByListOfIdsService:", error);
    return NextResponse.json(
      { success: false, error: "Could not fetch users by IDs" },
      { status: 500 }
    );
  }
}
