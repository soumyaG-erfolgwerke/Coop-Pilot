import {
  COLLECTION_ID_TRANSACTIONS_LEDGER,
  createAdminClient,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { listAllDocuments } from "@/lib/appwritePagination";
import { isQueryCapabilityError } from "@/lib/reports/utils/misc";
import { Query } from "node-appwrite";

/**
 * transactionsLedger Table:
 * @param MemberNumber - memberNumber in table
 * @param TotalCapital - amountCents in table
 *
 * Also returns 'sign' to check (DEBIT/CREDIT)
 */

const fetchTransactions = async ({ databases, coopId, startDate, endDate }) => {
  const result = await listAllDocuments({
    databases,
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_TRANSACTIONS_LEDGER,
    queries: [
      Query.equal("coopId", coopId),
      Query.equal("paymentStatus", "PAID"),
      Query.between("$createdAt", startDate, endDate),
      Query.select(["memberId", "sign", "amountCents", "$createdAt", "memberNumber"]),
    ],
    pageSize: 500,
  });

  return result;
};

/**
 * Fetches verified transactions for a given cooperative until a specified cutoff date.
 * @param {Object} databases - The databases instance.
 * @param {string} coopId - The cooperative ID.
 * @param {string} startDate - The start date in ISO format.
 * @param {string} endDate - The end date in ISO format.
 * @returns {Promise<Object>} - A promise resolving to the fetched transactions.
 */
export const getTransactionsInRange = async ({
  databases,
  coopId,
  startDate,
  endDate,
}) => {
  try {
    return await fetchTransactions({ databases, coopId, startDate, endDate });
  } catch (e) {
    if (isQueryCapabilityError(e)) {
        throw new Error("Query capability error: likely too many transactions to process. Please narrow the date range or contact support.");
      }
    else {
      throw e;
    }
  }
};

export const fetchTransactionsByMemberNumber = async (coopId, memberNumber, cutoffDate) => {
  const {databases} = createAdminClient();

  const result = await listAllDocuments({
    databases,
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_TRANSACTIONS_LEDGER,
    queries: [
      Query.equal("coopId", coopId),
      Query.equal("paymentStatus", "PAID"),
      Query.equal("memberNumber", memberNumber),
      Query.lessThanEqual("$createdAt", cutoffDate),
      Query.select(["memberId", "sign", "amountCents", "$createdAt", "memberNumber"]),
    ],
    pageSize: 500,
  });

  return result?.documents ?? [];
}
