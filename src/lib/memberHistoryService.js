import { DATABASE_ID, COLLECTION_ID_COOPXMEMBER } from "./appwrite-server.js";

/**
 * Appends a new status entry to the history JSON array text.
 * 
 * @param {string|null} currentHistoryJsonText Current history JSON string
 * @param {string} newStatus New status to append
 * @returns {string} The updated history JSON string
 */
export function getUpdatedHistoryJson(currentHistoryJsonText, newStatus) {
  let history = [];
  if (currentHistoryJsonText) {
    try {
      history = JSON.parse(currentHistoryJsonText);
      if (!Array.isArray(history)) {
        history = [];
      }
    } catch (e) {
      console.error("Failed to parse historyJson:", e);
      history = [];
    }
  }

  // Check if the last entry is already the same status to prevent consecutive duplicate states
  const lastEntry = history[history.length - 1];
  if (!lastEntry || lastEntry.status !== newStatus) {
    history.push({
      status: newStatus,
      changedAt: new Date().toISOString()
    });
  }

  return JSON.stringify(history);
}

/**
 * Appends a new status to the coopXmember history and updates the document.
 * 
 * @param {object} databases Appwrite databases service instance
 * @param {string} memberDocId The coopXmember document ID
 * @param {string|null} currentHistoryJsonText Current history JSON string
 * @param {string} newStatus The new status to set
 * @returns {Promise<object>} The updated document
 */
export async function appendMemberHistory(databases, memberDocId, currentHistoryJsonText, newStatus) {
  const updatedHistory = getUpdatedHistoryJson(currentHistoryJsonText, newStatus);
  return await databases.updateDocument(
    DATABASE_ID,
    COLLECTION_ID_COOPXMEMBER,
    memberDocId,
    {
      historyJson: updatedHistory
    }
  );
}
