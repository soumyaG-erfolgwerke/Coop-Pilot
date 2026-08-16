import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_PROFILE } from "@/lib/appwrite-server";
import { requireRole, resolveSession, sessionErrorResponse } from "@/lib/auth/session";

// GET /api/userServices - Get all users
export async function GET(request) {
  try {
    requireRole(await resolveSession(), ["superuser", "superadmin"]);
    const { databases } = await createAdminClient();
    
    const profilesResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      [Query.limit(500), Query.orderDesc("$createdAt")]
    );

    const merged = profilesResult.documents.map((user) => ({
      id: user.$id,
      name: `${user.FirstName} ${user.LastName}`,
      email: user.contactEmail,
      role: user.role,
      status: user.status,
    }));

    return NextResponse.json({ success: true, users: merged });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error in allUsersService:", error);
    return NextResponse.json(
      { success: false, error: "Could not fetch users" },
      { status: 500 }
    );
  }
}
