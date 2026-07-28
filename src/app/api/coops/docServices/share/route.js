import { NextResponse } from "next/server";
import {
  COLLECTION_ID_DOCUMENTS,
  COLLECTION_ID_GROUPMEMBERS,
  COLLECTION_ID_GROUPS,
  COLLECTION_ID_PROFILE,
  COLLECTION_ID_SHARE,
  createAdminClient,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { ID, Query } from "node-appwrite";
import { createAuditLog } from "@/lib/auditLogService";
import { ensureCoopAdminAccess } from "@/lib/helpers/_helpers";

// Fetch share
export async function GET(req) {
  const { databases } = createAdminClient();
  const { searchParams } = new URL(req.url);

  // const adminId = searchParams.get("adminId");
  const coopId = searchParams.get("coopId");
  try {
    if ( !coopId) {
      return NextResponse.json(
        { success: false, error: "coopId are required" },
        { status: 400 },
      );
    }

    const auth = await ensureCoopAdminAccess(coopId)

    const sharesRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_SHARE,
      [
        Query.equal("sharedBy", auth.userId),
        Query.equal("coopId", coopId),
        Query.orderDesc("sharedAt"),
        Query.limit(100),
      ],
    );

    const shares = sharesRes.documents;

    if (shares.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const docIds = [...new Set(shares.map((s) => s.documentId))];
    const groupIds = [
      ...new Set(shares.filter((s) => s.groupId).map((s) => s.groupId)),
    ];
    const userIds = [
      ...new Set(shares.filter((s) => s.userId).map((s) => s.userId)),
    ];

    const docsRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_DOCUMENTS,
      [Query.equal("$id", docIds), Query.limit(100)],
    );

    const docMap = {};
    docsRes.documents.forEach((d) => {
      docMap[d.$id] = d;
    });

    const groupMap = {};
    if (groupIds.length > 0) {
      const groupsRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_GROUPS,
        [Query.equal("$id", groupIds), Query.limit(100)],
      );

      groupsRes.documents.forEach((g) => {
        groupMap[g.$id] = g.name;
      });
    }

    const userMap = {};
    if (userIds.length > 0) {
      const usersRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_PROFILE,
        [Query.equal("userId", userIds), Query.limit(100)],
      );

      usersRes.documents.forEach((u) => {
        userMap[u.userId] = `${u.FirstName} ${u.LastName}`;
      });
    }

    const result = shares
      .map((share) => {
        const doc = docMap[share.documentId];
        if (!doc) return null;

        return {
          ...doc,
          shareInfo: {
            sharedAt: share.sharedAt,
            type: share.sharedWithType,
            target:
              share.sharedWithType === "GROUP"
                ? groupMap[share.groupId] || "Unknown Group"
                : userMap[share.userId] || "Unknown User",
          },
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Admin Share Fetch Error:", error);
    const message = error?.message || "Failed to fetch shared docs";
    const status =
      message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status },
    );
  }
}

// create share
export async function POST(req) {
  const { databases } = createAdminClient();

  try {
    const body = await req.json();

    let { documentId, sharedWithType, groupId, userId, coopId } = body;

    sharedWithType = sharedWithType?.toUpperCase();

    if (!documentId || !sharedWithType) {
      throw new Error("Missing required fields");
    }
    if (!coopId) {
      throw new Error("Missing required coopId");
    }

    if (sharedWithType === "GROUP" && !groupId) {
      throw new Error("groupId required");
    }

    if (sharedWithType === "USER" && !userId) {
      throw new Error("userId required");
    }

    const user = await ensureCoopAdminAccess(coopId)

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 404 },
      );
    }

    const existing = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_SHARE,
      [
        Query.equal("documentId", documentId),
        Query.equal("sharedWithType", sharedWithType),
        ...(sharedWithType === "USER"
          ? [Query.equal("userId", userId)]
          : [Query.equal("groupId", groupId)]),
      ],
    );

    if (existing.total > 0) {
      return NextResponse.json({
        success: false,
        error: "Already shared",
      });
    }

    const share = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_SHARE,
      ID.unique(),
      {
        documentId,
        sharedWithType,
        groupId: groupId || null,
        userId: userId || null,
        sharedBy: user.userId,
        coopId,
        sharedAt: new Date().toISOString(),
      },
    );

    if (sharedWithType === "GROUP") {
      const res = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID_DOCUMENTS,
        documentId,
        {
          sharedWithMembers: true,
        },
      );
    }

    try {

      const doc = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID_DOCUMENTS,
        documentId,
      );

      if (sharedWithType === "USER") {
        await createAuditLog({
          action: "SHARE_DOC",
          entityType: "DOCUMENT",
          entityId: documentId,

          performedBy: user.userId,
          performedByName: null,

          coopId,

          targetType: "USER",
          targetId: userId,

          metadata: {
            fileName: doc?.fileName,
            category: doc?.category,
          },
        });
      }

      if (sharedWithType === "GROUP") {
        const membersRes = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID_GROUPMEMBERS,
          [Query.equal("groupId", groupId), Query.limit(1000)],
        );

        const BATCH_SIZE = 25;

        const members = [...new Set(membersRes.documents.map((m) => m.userId))];


        const groupDoc = await databases.getDocument(
          DATABASE_ID,
          COLLECTION_ID_GROUPS,
          groupId,
        );

        for (let i = 0; i < members.length; i += BATCH_SIZE){
          const batch = members.slice(i, i + BATCH_SIZE);
            await Promise.all(
              members.map(async (memberId) => {
                try {
                  await createAuditLog({
                    action: "GROUP_DOC_SHARED",
                    entityType: "DOCUMENT",
                    entityId: documentId,

                    performedBy: user.userId,
                    performedByName: null,

                    coopId,

                    targetType: "USER",
                    targetId: memberId,

                    metadata: {
                      fileName: doc?.fileName,
                      category: doc?.category,
                      groupId,
                      groupName: groupDoc.name,
                    },
                  });
                } catch (err) {
                  console.error("Audit failed for member:", memberId, err.message);
                }
              }),
            );
      }
      }
    } catch (error) {
      console.error("FULL AUDIT ERROR:", error);
    }


    return NextResponse.json({
      success: true,
      share,
    });
  } catch (error) {
    console.error("Share API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to share document",
      },
      { status: 500 },
    );
  }
}
