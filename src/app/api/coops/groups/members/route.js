import { NextResponse } from "next/server";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_GROUPMEMBERS,
  COLLECTION_ID_GROUPS,
  COLLECTION_ID_SHARE,
  COLLECTION_ID_DOCUMENTS,
} from "@/lib/appwrite-server";
import { Query } from "node-appwrite";
import { resolveSession, sessionErrorResponse, AuthorizationError } from "@/lib/auth/session";
import { requireCoopMembership } from "@/lib/auth/membership-access";
import { safePublicError } from "@/lib/api/safe-public-error";

// fetch all groups of the member + shred doc in the group + shared doc with the member alone
export async function GET(req) {
  const { databases } = createAdminClient();
  const { searchParams } = new URL(req.url);

  const userId = searchParams.get("userId");
  const coopId = searchParams.get("coopId");

  try {
    const session = await resolveSession();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 },
      );
    }

    if (!coopId) {
      return NextResponse.json(
        { success: false, error: "coopId is required" },
        { status: 400 },
      );
    }
    if (userId !== session.userId) throw new AuthorizationError();
    await requireCoopMembership(session, coopId, userId);

    const membershipsRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_GROUPMEMBERS,
      [Query.equal("userId", userId), Query.limit(100)],
    );

    const customGroupIds = [
      ...new Set(membershipsRes.documents.map((m) => m.groupId)),
    ];

    let customGroups = [];

    if (customGroupIds.length > 0) {
      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_GROUPS,
        [Query.equal("$id", customGroupIds), Query.limit(100)],
      );
      customGroups = res.documents;
    }

    const allGroupsRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_GROUPS,
      [
        Query.equal("isAllMembers", true),
        Query.equal("coopId", coopId),
        Query.limit(100),
      ],
    );

    const allMemberGroups = allGroupsRes.documents;

    const groupMap = new Map();

    [...customGroups, ...allMemberGroups].forEach((g) => {
      groupMap.set(g.$id, g);
    });

    const groups = Array.from(groupMap.values());
    const groupIds = groups.map((g) => g.$id);

    const userSharesRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_SHARE,
      [
        Query.equal("sharedWithType", "USER"),
        Query.equal("userId", userId),
        Query.equal("coopId", coopId),
        Query.limit(100),
      ],
    );

    let groupSharesRes = { documents: [] };

    if (groupIds.length > 0) {
      groupSharesRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_SHARE,
        [
          Query.equal("sharedWithType", "GROUP"),
          Query.equal("groupId", groupIds),
          Query.equal("coopId", coopId),
          Query.limit(100),
        ],
      );
    }

    const shares = [...userSharesRes.documents, ...groupSharesRes.documents];

    if (shares.length === 0) {
      return NextResponse.json({
        success: true,
        groups: [],
        direct: [],
      });
    }

    const docIds = [...new Set(shares.map((s) => s.documentId))];

    let documents = [];

    if (docIds.length > 0) {
      const docsRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_DOCUMENTS,
        [Query.equal("$id", docIds), Query.limit(100)],
      );

      documents = docsRes.documents;
    }

    const docMap = {};
    documents.forEach((d) => {
      docMap[d.$id] = d;
    });

    const groupShareMap = {};
    const directShares = [];

    shares.forEach((s) => {
      if (s.sharedWithType === "GROUP") {
        if (!groupShareMap[s.groupId]) {
          groupShareMap[s.groupId] = [];
        }
        groupShareMap[s.groupId].push(s);
      } else {
        directShares.push(s);
      }
    });

    const grouped = groups.map((group) => {
      const groupShares = groupShareMap[group.$id] || [];

      const groupDocs = groupShares
        .map((s) => {
          const doc = docMap[s.documentId];
          if (!doc) return null;

          return {
            ...doc,
            sharedAt: s.sharedAt,
            sharedBy: s.sharedBy,
          };
        })
        .filter(Boolean);

      return {
        groupId: group.$id,
        groupName: group.name,
        isAllMembers: group.isAllMembers,
        documents: groupDocs,
      };
    });

    const directDocs = directShares
      .map((s) => {
        const doc = docMap[s.documentId];
        if (!doc) return null;

        return {
          ...doc,
          sharedAt: s.sharedAt,
          sharedBy: s.sharedBy,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      groups: grouped,
      direct: directDocs,
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("User Groups API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: safePublicError(error, "Failed to fetch user groups"),
      },
      { status: 500 },
    );
  }
}
