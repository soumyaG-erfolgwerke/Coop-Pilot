import { NextResponse } from "next/server";
import {
  COLLECTION_ID_GROUPMEMBERS,
  COLLECTION_ID_GROUPS,
  COLLECTION_ID_PROFILE,
  COLLECTION_ID_SHARE,
  COLLECTION_ID_TRANSACTION,
  createAdminClient,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { ID, Query } from "node-appwrite";
import { createAuditLog } from "@/lib/auditLogService";
import { ensureCoopAdminAccess } from "@/lib/helpers/_helpers";

// create group + add member in the group
export async function POST(req) {
  const { databases } = createAdminClient();

  try {
    const body = await req.json();

    const {
      name,
      coopId,
      members = [],
      isAllMembers = false,
    } = body;

    if (!name || !coopId ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const auth = await ensureCoopAdminAccess(coopId);

    const existing = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_GROUPS,
      [
        Query.equal("coopId", coopId),
        Query.equal("name", name),
        Query.limit(1),
      ],
    );

    if (existing.documents.length > 0) {
      return NextResponse.json(
        { success: false, error: "Group name already exists" },
        { status: 400 },
      );
    }

    const group = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_GROUPS,
      ID.unique(),
      {
        name,
        coopId,
        createdBy: auth.userId,
        isAllMembers,
        createdAt: new Date().toISOString(),
      },
    );

    try {
      let finalMembers = [];

      if (isAllMembers) {
        const membersRes = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID_TRANSACTION,
          [Query.equal("coopId", coopId), Query.limit(1000)],
        );

        finalMembers = [...new Set(membersRes.documents.map((m) => m.memberId).filter(Boolean))];
      } else {
        finalMembers = [...new Set(members)];
      }

      if (finalMembers.length > 0) {
        await Promise.all(
          finalMembers.map(async (userId) => {
            if (!isAllMembers) {
              await databases.createDocument(
                DATABASE_ID,
                COLLECTION_ID_GROUPMEMBERS,
                ID.unique(),
                {
                  groupId: group.$id,
                  userId,
                },
              );
            }

            try {
              await createAuditLog({
                action: "MEMBER_ADDED_TO_GROUP",
                entityType: "GROUP",
                entityId: group.$id,

                performedBy: auth.userId,
                performedByName: null,

                coopId,

                targetType: "USER",
                targetId: userId,

                metadata: {
                  groupId: group.$id,
                  groupName: group.name,
                  isAllMembers: isAllMembers,
                },
              });
            } catch (err) {
              console.error("⚠️ Audit failed for user:", userId, err.message);
            }
          }),
        );
      }
    } catch (err) {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID_GROUPS,
        group.$id,
      );
      throw err;
    }

    return NextResponse.json({
      success: true,
      group,
    });
  } catch (error) {
    console.error("Create Group Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create group",
      },
      { status: 500 },
    );
  }
}

// fetch group
export async function GET(req) {
  const { databases } = createAdminClient();
  const { searchParams } = new URL(req.url);

  const coopId = searchParams.get("coopId");

  try {
    if (!coopId) {
      return NextResponse.json(
        { success: false, error: "coopId is required" },
        { status: 400 },
      );
    }

    const groupsRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_GROUPS,
      [Query.equal("coopId", coopId), Query.limit(100)],
    );

    const groups = groupsRes.documents;

    if (groups.length === 0) {
      return NextResponse.json({
        success: true,
        groups: [],
      });
    }

    const allMembersRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_GROUPMEMBERS,
      [Query.limit(1000)],
    );

    const allMembers = allMembersRes.documents;

    const memberCountMap = {};

    allMembers.forEach((m) => {
      if (!memberCountMap[m.groupId]) {
        memberCountMap[m.groupId] = 0;
      }
      memberCountMap[m.groupId]++;
    });

    const groupsWithCount = groups.map((group) => {
      return {
        ...group,
        memberCount: group.isAllMembers
          ? "ALL"
          : memberCountMap[group.$id] || 0,
      };
    });

    return NextResponse.json({
      success: true,
      groups: groupsWithCount,
    });
  } catch (error) {
    console.error("Fetch Groups Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch groups",
      },
      { status: 500 },
    );
  }
}

// delete group
export async function DELETE(req) {
  const { databases } = createAdminClient();
  const { searchParams } = new URL(req.url);

  const groupId = searchParams.get("groupId");

  try {
    if (!groupId) {
      return NextResponse.json(
        { success: false, error: "groupId required" },
        { status: 400 },
      );
    }

    const membersRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_GROUPMEMBERS,
      [Query.equal("groupId", groupId), Query.limit(1000)],
    );

    const sharesRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_SHARE,
      [Query.equal("groupId", groupId), Query.limit(1000)],
    );

    await Promise.all(
      membersRes.documents.map((m) =>
        databases.deleteDocument(
          DATABASE_ID,
          COLLECTION_ID_GROUPMEMBERS,
          m.$id,
        ),
      ),
    );

    await Promise.all(
      sharesRes.documents.map((s) =>
        databases.deleteDocument(DATABASE_ID, COLLECTION_ID_SHARE, s.$id),
      ),
    );

    await databases.deleteDocument(DATABASE_ID, COLLECTION_ID_GROUPS, groupId);

    return NextResponse.json({
      success: true,
      message: "Group deleted",
    });
  } catch (error) {
    console.error("Delete Group Error:", error);

    return NextResponse.json(
      { success: false, error: error.message || "Delete failed" },
      { status: 500 },
    );
  }
}

//edit group
export async function PUT(req) {
  const { databases } = createAdminClient();
  const { searchParams } = new URL(req.url);

  const groupId = searchParams.get("groupId");

  try {
    if (!groupId) {
      return NextResponse.json(
        { success: false, error: "groupId required" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { name, members = [], isAllMembers = false } = body;

    const updated = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_GROUPS,
      groupId,
      { name, isAllMembers },
    );

    const existingRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_GROUPMEMBERS,
      [
        Query.equal("groupId", groupId),
        Query.limit(1000), 
      ],
    );

    const existing = existingRes.documents;

    const uniqueMembers = [...new Set(members)];

    try {
      if (!isAllMembers && uniqueMembers.length > 0) {
        await Promise.all(
          uniqueMembers.map((userId) =>
            databases.createDocument(
              DATABASE_ID,
              COLLECTION_ID_GROUPMEMBERS,
              ID.unique(),
              { groupId, userId },
            ),
          ),
        );
      }

      await Promise.all(
        existing.map((m) =>
          databases.deleteDocument(
            DATABASE_ID,
            COLLECTION_ID_GROUPMEMBERS,
            m.$id,
          ),
        ),
      );
    } catch (err) {
      console.error("Member update failed:", err);
      throw err;
    }

    return NextResponse.json({
      success: true,
      group: updated,
    });
  } catch (error) {
    console.error("Update Group Error:", error);

    return NextResponse.json(
      { success: false, error: error.message || "Update failed" },
      { status: 500 },
    );
  }
}