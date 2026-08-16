import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_PROFILE,
  COLLECTION_ID_COOPXMEMBER,
} from "@/lib/appwrite-server";
import { resolveSession, sessionErrorResponse, AuthorizationError } from "@/lib/auth/session";
import { ensureCoopAdminAccess } from "@/lib/helpers/_helpers";

export async function GET(request) {
  try {
    const session = await resolveSession();
    const coopId = new URL(request.url).searchParams.get("coopId");
    if (!coopId) return NextResponse.json({ success: false, error: "coopId is required" }, { status: 400 });
    const { databases } = createAdminClient();

    if (["superuser", "superadmin"].includes(session.role)) {
      // Platform administrators may inspect any cooperative roster.
    } else if (session.role === "coopadmin") {
      await ensureCoopAdminAccess(coopId);
    } else if (session.role === "member") {
      const ownMembership = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_COOPXMEMBER,
        [Query.equal("coopId", coopId), Query.equal("userId", session.userId), Query.notEqual("status", "cancelled"), Query.limit(1)],
      );
      if (ownMembership.total === 0) throw new AuthorizationError();
    } else {
      throw new AuthorizationError();
    }

    const memberships = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_COOPXMEMBER,
      [Query.equal("coopId", coopId), Query.notEqual("status", "cancelled"), Query.limit(500)],
    );
    const memberIds = [...new Set(memberships.documents.map((item) => item.userId).filter(Boolean))];
    if (memberIds.length === 0) return NextResponse.json({ success: true, members: [] });

    const profiles = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      [
        Query.equal("userId", memberIds),
        Query.limit(500),
        Query.orderAsc("FirstName"),
      ],
    );

    const members = profiles.documents.map((profile) => ({
      userId: profile.userId,
      memberName: `${profile.FirstName || ""} ${profile.LastName || ""}`.trim(),
      memberEmail: profile.contactEmail || profile.email || "",
    }));

    return NextResponse.json({
      success: true,
      members,
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("GET_ALL_MEMBERS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        members: [],
        error: "Failed to fetch members",
      },
      {
        status: 500,
      },
    );
  }
}
