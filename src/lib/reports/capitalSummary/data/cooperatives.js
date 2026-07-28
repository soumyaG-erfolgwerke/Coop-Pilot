import { COLLECTION_ID_COOP_CONFIG, COLLECTION_ID_COOPXMEMBER, DATABASE_ID, createAdminClient } from "@/lib/appwrite-server";
import { listAllDocuments } from "@/lib/appwritePagination";
import { chunkArray } from "@/lib/reports/utils/misc";
import { Query } from "node-appwrite";

/**
 * Cooperative_settings Table:
 * @param fiscalYearStart - fiscal_year_start in table
 * @param fiscalYearEnd - fiscal_year_end in table
 */

export const getCoopFiscalYearRange = async ({ databases, coopId }) => {
  const result = await databases.listDocuments({
    databases,
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_COOP_CONFIG,
    queries: [
      Query.equal("cooperative_id", coopId),
      Query.select(["fiscal_year_start", "fiscal_year_end"]),
    ],
    pageSize: 500,
  });

  return result?.documents?.[0] ?? null;
}

const fetchCapitalHistory = async ({ databases, coopId, memberNumbers }) => {
  return await listAllDocuments({
    databases,
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_COOPXMEMBER,
    queries: [
      Query.equal("coopId", coopId),
      Query.equal("membershipId", memberNumbers),
      Query.select(["$id", "userId", "membershipId", "capitalHistoryJson"]),
    ],
    pageSize: 500,
  });
};

export const getCapitalHistoryByMemberNumbers = async ({ databases, coopId, memberNumbers }) => {
  if (!memberNumbers?.length) {
    return [];
  }

  const chunks = chunkArray(memberNumbers, 100);
  const docs = [];

  for (const ids of chunks) {
    const res = await fetchCapitalHistory({ databases, coopId, memberNumbers: ids });
    docs.push(...res.documents);
  }

  return docs;
};

export const getAllCoopMembers = async ({ databases, coopId }) => {
  const result = await listAllDocuments({
    databases,
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_COOPXMEMBER,
    queries: [
      Query.equal("coopId", coopId),
      Query.select(["userId", "membershipId", "historyJson"]),
    ],
    pageSize: 500,
  });

  return result?.documents ?? [];
};

export const storeClosingBalance = async (documentId, existingHistoryArray, fiscalYear, closingBalance) => {
  const { databases } = createAdminClient();

  const updatedHistory = Array.isArray(existingHistoryArray) ? [...existingHistoryArray] : [];
  const existingIndex = updatedHistory.findIndex(entry => String(entry.fiscalYear) === String(fiscalYear));
  const newEntry = { fiscalYear: Number(fiscalYear), closingBalance: Number(closingBalance) };

  if (existingIndex !== -1) {
    updatedHistory[existingIndex] = newEntry;
  } else {
    updatedHistory.push(newEntry);
  }

  return await databases.updateDocument(
    DATABASE_ID,
    COLLECTION_ID_COOPXMEMBER,
    documentId,
    {
      capitalHistoryJson: JSON.stringify(updatedHistory),
    }
  );
};