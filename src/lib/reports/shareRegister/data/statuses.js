import { COLLECTION_ID_COOPXMEMBER, DATABASE_ID } from "@/lib/appwrite-server";
import { listAllDocuments } from "@/lib/appwritePagination";
import { chunkArray } from "@/lib/reports/utils/misc";
import { Query } from "node-appwrite";

/**
 * CoopXMember Table:
 * @param MemberNumber - membershipId in table
 * @param Status - historyJson in table, find status on stichtag timestamp
 * @param EntryDate - historyJson in table, find first 'ACTIVE' entry
 */

const fetchStatus = async ({ databases, coopId, userIds, memberNumbers }) => {
  return await listAllDocuments({
    databases,
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_COOPXMEMBER,
    queries: [
      Query.equal("coopId", coopId),
      Query.equal("userId", userIds),
      Query.equal("membershipId", memberNumbers),
      Query.select(["userId", "membershipId", "historyJson"]),
    ],
    pageSize: 500,
  });
};

export const getStatusByUserIds = async ({ databases, coopId, userIds, memberNumbers }) => {
  if (!userIds?.length) {
    return [];
  }

  const chunks = chunkArray(userIds, 100);
  const docs = [];

  for (const ids of chunks) {
    const res = await fetchStatus({ databases, coopId, userIds: ids, memberNumbers });
    docs.push(...res.documents);
  }

  return docs;
};
