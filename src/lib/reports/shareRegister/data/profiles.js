import { COLLECTION_ID_PROFILE, DATABASE_ID } from "@/lib/appwrite-server";
import { listAllDocuments } from "@/lib/appwritePagination";
import { chunkArray } from "@/lib/reports/utils/misc";
import { Query } from "node-appwrite";

/**
 * Profile Table:
 * @param Name - FirstName, LastName in table
 * @param Date of Birth - bday in table
 */

const fetchProfiles = async ({ databases, userIds }) => {
  return await listAllDocuments({
    databases,
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_PROFILE,
    queries: [
      Query.equal("userId", userIds),
      Query.select(["userId", "FirstName", "LastName", "bday"]),
    ],
    pageSize: 500,
  });
}

export const getProfilesByUserIds = async ({ databases, userIds }) => {
  if (!userIds?.length) {
    return [];
  }

  const chunks = chunkArray(userIds, 100);
  const docs = [];

  for (const ids of chunks) {
    const res = await fetchProfiles({ databases, userIds: ids });
    docs.push(...res.documents);
  }

  return docs;
};