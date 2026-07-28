import { cookies } from "next/headers";
import { Query, ID } from "node-appwrite";

import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_PROFILE,
  COLLECTION_ID_KYC_APPLICATIONS,
} from "@/lib/appwrite-server";

/**
 * Validates that the current user is a coopadmin.
 * @returns {Promise<string>} The admin's user ID.
 */
export async function validateAdminRole() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("appwrite-session");

  if (!sessionCookie?.value) {
    throw new Error("Unauthorized: No session found");
  }

  const sessionData = JSON.parse(sessionCookie.value);
  const adminUserId = sessionData.userId;

  const { databases } = createAdminClient();

  // Verify requester is a coopadmin
  const adminProfile = await databases.listDocuments(
    DATABASE_ID,
    COLLECTION_ID_PROFILE,
    [Query.equal("userId", adminUserId)]
  );

  if (adminProfile.documents.length === 0 || adminProfile.documents[0].role !== "coopadmin") {
    throw new Error("Forbidden: Admin access required");
  }

  return adminUserId;
}

/**
 * Updates the KYC status of a user.
 * @param {string} targetUserId - ID of the user being reviewed.
 * @param {string} status - New status (VERIFIED or REJECTED).
 * @param {string} adminId - ID of the reviewer.
 * @param {string|null} reason - Rejection reason (optional).
 * @param {boolean} resubmitRequested - Whether the admin is asking for a document resubmission.
 */
export async function updateKycStatus(targetUserId, status, adminId, reason = null, resubmitRequested = false, coopId = null) {
  const { databases } = createAdminClient();

  // Find the most recent KYC application documents for the target user
  const applicationResult = await databases.listDocuments(
    DATABASE_ID,
    COLLECTION_ID_KYC_APPLICATIONS,
    [
      Query.equal("userId", targetUserId),
      Query.orderDesc("$createdAt"),
      Query.limit(10)
    ]
  );

  let applicationDoc = applicationResult.documents.find(doc => doc.coopId === coopId);
  if (!applicationDoc && coopId) {
    applicationDoc = applicationResult.documents.find(doc => !doc.coopId);
  }
  if (!applicationDoc && !coopId) {
    applicationDoc = applicationResult.documents[0];
  }

  if (!applicationDoc) {
    return await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_KYC_APPLICATIONS,
      ID.unique(),
      {
        userId: targetUserId,
        kycStatus: status || "RESUBMISSION_REQUIRED",
        reviewerId: adminId,
        reviewedAt: new Date().toISOString(),
        reason: reason,
        resubmissionRequested: resubmitRequested,
        coopId: coopId,
      }
    );
  }
  const currentStatus = applicationDoc.kycStatus;

  // Allow updates if status is PENDING (normal accept/reject flow),
  // OR if setting RESUBMISSION_REQUIRED (yellow button, works on any status including VERIFIED).
  if (currentStatus !== "PENDING" && status !== "RESUBMISSION_REQUIRED") {
    throw new Error(`KYC application is already ${currentStatus} and cannot be modified without a resubmission request.`);
  }

  const docId = applicationDoc.$id;

  const updateData = {
    kycStatus: status,
    reviewerId: adminId,
    reviewedAt: new Date().toISOString(),
    reason: reason,
    resubmissionRequested: resubmitRequested,
  };

  if (coopId) {
    updateData.coopId = coopId;
  }

  // Update the status and audit fields
  return await databases.updateDocument(
    DATABASE_ID,
    COLLECTION_ID_KYC_APPLICATIONS,
    docId,
    updateData
  );
}
