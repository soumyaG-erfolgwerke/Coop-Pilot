/**
 * KYC Review Client Service
 * Handles API calls to the consolidated kyc-applications management endpoint.
 */

/**
 * Accepts a member's KYC application.
 * @param {string} userId - The unique identifier of the user.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const acceptKycAction = async (userId, coopId = null) => {
  try {
    const response = await fetch("/api/coop-admin/kyc-applications/review", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "accept", coopId }),
    });
    return await response.json();
  } catch (error) {
    console.error("Failed to accept KYC:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Rejects a member's KYC application with a reason.
 * @param {string} userId - The unique identifier of the user.
 * @param {string} reason - The explanation for the rejection.
 * @param {boolean} askResubmission - Whether to ask the member for a resubmission.
 * @param {string|null} coopId - The cooperative ID context.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const rejectKycAction = async (userId, reason, askResubmission = false, coopId = null) => {
  try {
    const response = await fetch("/api/coop-admin/kyc-applications/review", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "reject", reason, askResubmission, coopId }),
    });
    return await response.json();
  } catch (error) {
    console.error("Failed to reject KYC:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Requests a document resubmission for a member's KYC.
 * @param {string} userId - The unique identifier of the user.
 * @param {string} reason - The explanation for why resubmission is needed.
 * @param {string|null} coopId - The cooperative ID context.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const resubmitKycAction = async (userId, reason, coopId = null) => {
  try {
    const response = await fetch("/api/coop-admin/kyc-applications/review", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "resubmit", reason, coopId }),
    });
    return await response.json();
  } catch (error) {
    console.error("Failed to request resubmission:", error);
    return { success: false, error: error.message };
  }
};
