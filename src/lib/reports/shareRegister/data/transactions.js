import {
  COLLECTION_ID_TRANSACTIONS_LEDGER,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { listAllDocuments } from "@/lib/appwritePagination";
import { isQueryCapabilityError } from "@/lib/reports/utils/misc";
import { Query } from "node-appwrite";

/**
 * transactionsLedger Table:
 * @param NumberofShares - shares in table
 * @param TotalCapital - amountCents in table
 *
 * Also returns 'sign' to check (DEBIT/CREDIT)
 */

const fetchTransactions = async ({ databases, coopId, cutoffIso }) => {
  const result = await listAllDocuments({
    databases,
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_TRANSACTIONS_LEDGER,
    queries: [
      Query.equal("coopId", coopId),
      Query.equal("paymentStatus", "PAID"),
      Query.lessThanEqual("$createdAt", cutoffIso),
      Query.select(["memberId", "sign", "shares", "amountCents", "$createdAt", "memberNumber"]),
    ],
    pageSize: 500,
  });

  return result;
};

/**
 * Fetches verified transactions for a given cooperative until a specified cutoff date.
 * @param {Object} databases - The databases instance.
 * @param {string} coopId - The cooperative ID.
 * @param {string} cutoffIso - The cutoff date in ISO format.
 * @returns {Promise<Object>} - A promise resolving to the fetched transactions.
 */
export const getTransactionsTillCutoff = async ({
  databases,
  coopId,
  cutoffIso,
}) => {
  try {
    return await fetchTransactions({ databases, coopId, cutoffIso });
  } catch (e) {
    if (isQueryCapabilityError(e)) {
        throw new Error("Query capability error: likely too many transactions to process. Please narrow the date range or contact support.");
      }
    else {
      throw e;
    }
  }
};
