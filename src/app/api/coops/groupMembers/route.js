import { NextResponse } from "next/server";
import {
  COLLECTION_ID_GROUPMEMBERS,
  COLLECTION_ID_GROUPS,
  COLLECTION_ID_PROFILE,
  createAdminClient,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { Query } from "node-appwrite";
import { getMembersOfCoopInternal } from "@/lib/memberService";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { requireCoopAdministration } from "@/lib/auth/membership-access";
import { safePublicError } from "@/lib/api/safe-public-error";

// fetch members for a group
export async function GET(req) {
  const { databases } = createAdminClient();
  const { searchParams } = new URL(req.url);

  const groupId = searchParams.get("groupId");

  try {
    const session = await resolveSession();
    if (!groupId) {
      return NextResponse.json(
        { success: false, error: "groupId is required" },
        { status: 400 },
      );
    }

    let group;
    try {
      group = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID_GROUPS,
        groupId,
      );
    } catch {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 },
      );
    }
    await requireCoopAdministration(session, group.coopId);

    if (group.isAllMembers) {
      const members = await getMembersOfCoopInternal(group.coopId);

      const formatted = members.map((m) => ({
        userId: m.userId,
        name: m.membername,
        email: m.memberemail,
        kycStatus: m.kycStatus,
      }));

      return NextResponse.json({
        success: true,
        type: "ALL",
        members: formatted,
      });
    }

    const groupMembersRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_GROUPMEMBERS,
      [Query.equal("groupId", groupId), Query.limit(1000)],
    );

    const userIds = [
      ...new Set(groupMembersRes.documents.map((m) => m.userId)),
    ];

    if (userIds.length === 0) {
      return NextResponse.json({
        success: true,
        type: "CUSTOM",
        members: [],
      });
    }

    const profilesRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      [Query.equal("userId", userIds), Query.limit(100)],
    );

    const profileMap = {};
    profilesRes.documents.forEach((p) => {
      profileMap[p.userId] = p;
    });

    const formatted = userIds.map((id) => {
      const p = profileMap[id];

      return {
        userId: id,
        name: p ? `${p.FirstName} ${p.LastName}` : "Unknown",
        email: p?.contactEmail || null,
      };
    });

    return NextResponse.json({
      success: true,
      type: "CUSTOM",
      members: formatted,
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Group Members API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: safePublicError(error, "Failed to fetch group members"),
      },
      { status: 500 },
    );
  }
}
