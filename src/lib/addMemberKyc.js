import { createAdminClient, DATABASE_ID, COLLECTION_ID_KYC_APPLICATIONS } from "@/lib/appwrite-server";
import { ID, Query } from "node-appwrite";

/**
 * Adds a new record to the KYC applications collection for a user.
 * Automatically increments submissionAttempt if previous records exist.
 * @param {string} userId - The unique ID of the user.
 * @returns {Promise<object>} The created KYC application document.
 */
export async function addKycApplication(userId, rollback = null, coopId = null) {
  if (!userId || typeof userId !== "string") {
    throw new Error("Invalid userId: must be a non-empty string");
  }

  const { databases } = createAdminClient();

  // 1. Determine the highest current submissionAttempt for this user
  let nextAttempt = 1;
  try {
    const queries = [
      Query.equal("userId", userId),
      Query.orderDesc("submissionAttempt"),
      Query.limit(1)
    ];
    if (coopId) {
      queries.push(Query.equal("coopId", coopId));
    }
    const existingApps = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_KYC_APPLICATIONS,
      queries
    );

    if (existingApps.documents.length > 0) {
      const lastApp = existingApps.documents[0];
      const lastAttempt = lastApp.submissionAttempt || 1;
      nextAttempt = lastAttempt + 1;
    }
  } catch (err) {
    console.error(`Error calculating next attempt for user ${userId}:`, err);
    // Continue with nextAttempt = 1 as fallback
  }

  // 2. Prepare the NEW KYC application record
  const kycData = {
    userId: userId,
    kycStatus: "PENDING",
    reviewerId: null,
    reason: null,
    reviewedAt: null,
    submissionAttempt: nextAttempt,
    resubmissionRequested: false, // Initial state for a fresh submission
    coopId: coopId,
  };

  // 3. Create the new document in the kycApplications collection
  const result = await databases.createDocument(
    DATABASE_ID,
    COLLECTION_ID_KYC_APPLICATIONS,
    ID.unique(),
    kycData
  );

  // Register application record deletion in rollback
  if (rollback) {
    rollback.add(() => databases.deleteDocument(DATABASE_ID, COLLECTION_ID_KYC_APPLICATIONS, result.$id));
  }

  return result;
}
