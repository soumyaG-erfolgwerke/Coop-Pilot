// Client-side service that calls API routes
import { createNotificationForCoop } from "./notificationService.js";

/**
 * Uploads a file to audit storage via API route.
 * @param {File | null} file - The file object to upload.
 * @returns {Promise<string|null>} A promise that resolves to the publicly accessible file URL, or null.
 */
export const uploadAuditFilesAndGetURL = async (file) => {
  if (!file) return null;

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/auditServices/upload", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to upload file");
    }

    return data.fileUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("Failed to upload file. " + error.message);
  }
};

export const updateAuditData = async (coopId, auditData, currentAuditId) => {
  if (!coopId || !auditData) {
    throw new Error("Cooperative ID and the audit data object are required.");
  }

  try {
    const response = await fetch(`/api/auditServices/${coopId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ auditData, currentAuditId }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to update audit data");
    }

    return data.document;
  } catch (error) {
    console.error(
      `Failed to update audit log for cooperative with ID ${coopId}:`,
      error,
    );
    throw error;
  }
};

export const saveAuditData = async (coopId, auditData, currentAuditId) => {
  if (!coopId || !auditData) {
    throw new Error("Cooperative ID and the audit data object are required.");
  }

  try {
    const response = await fetch(`/api/auditServices/${coopId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ auditData, save: true, currentAuditId }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to update audit data");
    }

    return data.document;
  } catch (error) {
    console.error(
      `Failed to update audit log for cooperative with ID ${coopId}:`,
      error,
    );
    throw error;
  }
};

export const getAuditData = async (coopId, auditId) => {
  if (!coopId || !auditId) {
    throw new Error(
      "Cooperative ID and audit ID are required to fetch audit data.",
    );
  }

  try {
    const response = await fetch(
      `/api/auditServices/${encodeURIComponent(coopId)}/${encodeURIComponent(auditId)}`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch audit data");
    }

    return {
      auditData: data.auditData,
      auditStatus: data.auditStatus,
    };
  } catch (error) {
    console.error(`Failed to get audit data for coop ID ${coopId}:`, error);
    throw error;
  }
};

export const getAuditHistoryById = async (auditId) => {
  const response = await fetch(
    `/api/auditServices/auditHistory/byId/${auditId}`,
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch audit");
  }

  return data.document;
};

const updateAuditStatus = async (coopId, auditId, auditStatus) => {
  if (!coopId) {
    throw new Error("Cooperative ID is required.");
  }

  try {
    const response = await fetch(`/api/auditServices/${coopId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ auditId, auditStatus }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to update audit status");
    }

    // Create notification for status changes (except SUBMITTED)
    if (auditStatus !== "SUBMITTED") {
      createNotificationForCoop(coopId, auditStatus);
    }

    return data.document;
  } catch (error) {
    console.error(`Failed to update audit status for coop ${coopId}:`, error);
    throw error;
  }
};

export const getAuditHistory = async (coopId) => {
  const response = await fetch(`/api/auditServices/auditHistory/${coopId}`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch audit history");
  }

  return data.documents;
};

// Individual wrappers for each audit status

////export const setAuditStatusNotStarted = (coopId) =>
//   updateAuditStatus(coopId, "NOT_STARTED");

////export const setAuditStatusInProgress = (coopId) =>
//   updateAuditStatus(coopId, "IN_PROGRESS");

//// export const setAuditStatusSubmitted = (coopId) =>
//   updateAuditStatus(coopId, "SUBMITTED");

export const setAuditStatusUnderReview = (coopId, auditId) =>
  updateAuditStatus(coopId, auditId, "UNDER_REVIEW");

export const setAuditStatusAskedToResubmit = (coopId, auditId) =>
  updateAuditStatus(coopId, auditId, "ASKED_TO_RESUBMIT");

export const setAuditStatusApproved = (coopId, auditId) =>
  updateAuditStatus(coopId, auditId, "APPROVED");

export const setAuditStatusRejected = (coopId, auditId) =>
  updateAuditStatus(coopId, auditId, "REJECTED");

// this function only access the coop table
export const setAuditStatusStart = async (formType, coopId, orgId) => {
  if (!coopId) {
    throw new Error("Cooperative ID is required.");
  }

  try {
    const response = await fetch(
      `/api/auditServices/${encodeURIComponent(coopId)}/status/start`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ formType, coopId, orgId }),
      },
    );

    const data = await response.json();
    if (!data.success) {
      return {
        result: null,
        message: data.error || "Failed to update audit status",
        success: false,
      };
    }

    // Create notification for status changes (except SUBMITTED)
    if (data.document.auditStatus !== "SUBMITTED") {
      createNotificationForCoop(coopId, data.document.auditStatus);
    }

    return {
      result: data.document,
      message: "Audit started successfully",
      success: true,
    };
  } catch (error) {
    console.error(`Failed to update audit status for coop ${coopId}:`, error);
    return {
      result: null,
      message: "Failed to update audit status",
      success: false,
    };
  }
};

export const setSubAuditStatus = async (auditId, userEmail, status) => {
  try {
    const response = await fetch(
      `/api/auditServices/subAudit/review/${encodeURIComponent(auditId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userEmail, status }),
      },
    );
    // console.log("response", response);
    return response;
  } catch (error) {
    console.error(
      `Failed to update subaudit status for audit ${auditId}:`,
      error,
    );
    return {
      result: null,
      message: "Failed to update subaudit status",
      success: false,
    };
  }
};
