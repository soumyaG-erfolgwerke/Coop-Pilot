import { createAdminClient, DATABASE_ID, COLLECTION_ID_KYC_APPLICATIONS } from "@/lib/appwrite-server";
import { Query } from "node-appwrite";

/**
 * Fetches the KYC status for a given user from the kycApplications collection.
 * @param {string} userId - The unique ID of the user.
 * @param {boolean} includeDetails - If true, returns the full application record instead of just the status string.
 * @param {string|null} coopId - Optional coopId to scope the KYC lookup.
 * @returns {Promise<string|object>} The KYC status or the full application record.
 */
export async function getKycStatus(userId, includeDetails = false, coopId = null) {
  if (!userId) return includeDetails ? null : "PENDING";

  try {
    const { databases } = createAdminClient();

    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_KYC_APPLICATIONS,
      [
        Query.equal("userId", userId),
        Query.orderDesc("$createdAt"),
        Query.limit(10)
      ]
    );

    let doc = null;
    if (response.documents.length > 0) {
      const sortedDocs = [...response.documents].sort((a, b) => {
        const dateA = new Date(a.$createdAt || a.createdAt || 0);
        const dateB = new Date(b.$createdAt || b.createdAt || 0);
        return dateB - dateA;
      });
      if (coopId) {
        doc = sortedDocs.find(d =>
          (d.coopId === coopId || (d.coopId && d.coopId.$id === coopId)) ||
          (!d.coopId || (d.coopId && typeof d.coopId === 'object' && !d.coopId.$id))
        );
      } else {
        doc = sortedDocs[0];
      }
    }

    if (doc) {
      if (includeDetails) {
        return {
          status: doc.kycStatus || "PENDING",
          resubmissionRequested: doc.resubmissionRequested || false,
          reason: doc.reason || null,
          $id: doc.$id
        };
      }
      return doc.kycStatus || "PENDING";
    }

    return includeDetails ? null : "PENDING";
  } catch (error) {
    console.error(`Error fetching KYC status for user ${userId}:`, error);
    return includeDetails ? null : "PENDING";
  }
}
