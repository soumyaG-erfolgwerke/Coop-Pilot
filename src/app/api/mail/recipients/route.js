import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_PROFILE } from "@/lib/appwrite-server";
import { resolveSession, requireRole, sessionErrorResponse } from "@/lib/auth/session";

// GET /api/mail/recipients?role=... - Get recipients by role
export async function GET(request) {
  try {
    const session = await resolveSession();
    requireRole(session, ["superuser", "superadmin", "coopadmin", "org_admin"]);
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    const allowedRoles = ["member", "coopadmin", "org_admin", "auditer", "aud_E"];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: "role is required" },
        { status: 400 }
      );
    }

    const { databases } = createAdminClient();

    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      [Query.equal("role", role), Query.limit(100)]
    );

    const recipients = response.documents.map((profile) => ({
      userId: profile.userId,
      FirstName: profile.FirstName,
      LastName: profile.LastName,
      role: profile.role,
    }));
    return NextResponse.json({ success: true, recipients });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error(`Failed to fetch recipients:`, error);
    return NextResponse.json({ success: false, recipients: [] }, { status: 500 });
  }
}
