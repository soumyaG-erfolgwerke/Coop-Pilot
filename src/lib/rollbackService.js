import { 
    createAdminClient, 
    DATABASE_ID, 
    COLLECTION_ID_KYC_APPLICATIONS,
    COLLECTION_ID_KYC_DOCUMENTS,
    AUDIT_BUCKET_ID
} from "@/lib/appwrite-server";
import { Query } from "node-appwrite";

/**
 * Rollback Manager - A utility to manage "undo" operations for multi-step processes.
 * This ensures that if any step in a complex creation fails, we can revert previous steps.
 */
export const createRollbackManager = () => {
  const stack = [];

  return {
    /**
     * Add a cleanup function to the rollback stack.
     * @param {Function} cleanupFn - An async function that reverts the operation.
     */
    add: (cleanupFn) => {
      stack.push(cleanupFn);
    },

    /**
     * Execute all cleanup functions in reverse order.
     * This is typically called in a catch block.
     */
    execute: async () => {
      if (stack.length === 0) return;

      console.log(`[Rollback] Reverting ${stack.length} successful operations due to failure...`);
      
      // Execute in reverse order (LIFO)
      for (const cleanup of [...stack].reverse()) {
        try {
          await cleanup();
        } catch (err) {
          // We catch errors here so that one failed cleanup doesn't block the others
          console.error("[Rollback] A cleanup step failed:", err);
        }
      }
      
      console.log("[Rollback] Cleanup completed.");
    },
    
    /**
     * Returns the current number of operations tracket
     */
    size: () => stack.length
  };
};

/**
 * Deletes the KYC application record for a specific user ID.
 * @param {string} userId - The unique ID of the user.
 */
export async function deleteKycApplication(userId) {
    if (!userId) return;
    const { databases } = createAdminClient();
    
    try {
        const result = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID_KYC_APPLICATIONS,
            [Query.equal("userId", userId)]
        );
        
        if (result.documents.length > 0) {
            await databases.deleteDocument(
                DATABASE_ID,
                COLLECTION_ID_KYC_APPLICATIONS,
                result.documents[0].$id
            );
        }
    } catch (err) {
        console.error(`[Rollback] Failed to delete KYC application for ${userId}:`, err);
    }
}

/**
 * Deletes a KYC document record and its associated file from storage.
 * Used primarily for rollback operations.
 * @param {string} documentId - The database document ID.
 * @param {string} fileId - The storage file ID.
 */
export async function deleteKycDocument(documentId, fileId) {
    if (!documentId || !fileId) return;
    
    const { databases, storage } = createAdminClient();
    
    try {
      // 1. Delete the file from storage
      if (fileId) {
        await storage.deleteFile(AUDIT_BUCKET_ID, fileId);
      }
      
      // 2. Delete the record from database
      if (documentId) {
        await databases.deleteDocument(
          DATABASE_ID,
          COLLECTION_ID_KYC_DOCUMENTS,
          documentId
        );
      }
      
      console.log(`[Rollback] Successfully deleted KYC document ${documentId} and file ${fileId}`);
    } catch (err) {
      console.error(`[Rollback] Failed to delete KYC document/file:`, err);
    }
}
