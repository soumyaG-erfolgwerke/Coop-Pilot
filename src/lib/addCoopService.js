/**
 * Uploads a file to storage via API route.
 * @param {File | null} file - The file object to upload.
 * @param {string} type - Either "coop" for logos/banners or "docs" for documents.
 * @returns {Promise<string|null>} A promise that resolves to the publicly accessible file URL, or null.
 */
export const uploadFileAndGetURL = async (file, type = "coop") => {
  // If no file is provided, do nothing.
  if (!file) return null;

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const response = await fetch("/api/coops/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to upload file");
    }

    const result = await response.json();
    return result.fileUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("Failed to upload file. " + error.message);
  }
};

/**
 * Creates a new cooperative via API route.
 * @param {object} coopData - Data for the cooperative.
 * @returns {Promise<object>} A promise that resolves to the created document.
 */
export const createCooperative = async (coopData) => {
  try {
    // Handle file uploads first if files are provided
    let logoUrl = null;
    let bannerUrl = null;

    if (coopData.logo instanceof File) {
      logoUrl = await uploadFileAndGetURL(coopData.logo);
    }

    if (coopData.bannerImage instanceof File) {
      bannerUrl = await uploadFileAndGetURL(coopData.bannerImage);
    }

    const response = await fetch("/api/coops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: coopData.name,
        admins: coopData.admins,
        country: coopData.country,
        state: coopData.state,
        sector: coopData.sector,
        sharePrice: coopData.sharePrice,
        court: coopData.court,
        regNumber: coopData.regNumber,
        about: coopData.about,
        logoUrl: logoUrl,
        bannerUrl: bannerUrl,
        status: "active",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create cooperative");
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to create cooperative:", error);
    throw new Error(`Failed to create cooperative: ${error.message}`);
  }
};

/**
 * Creates an inactive cooperative via API route.
 * @param {object} coopData - Data for the cooperative.
 * @returns {Promise<object>} A promise that resolves to the created document.
 */
export const createInactiveCooperative = async (coopData) => {
  try {
    // Handle file uploads first if files are provided
    let logoUrl = null;
    let bannerUrl = null;

    if (coopData.logo instanceof File) {
      logoUrl = await uploadFileAndGetURL(coopData.logo);
    }

    if (coopData.bannerImage instanceof File) {
      bannerUrl = await uploadFileAndGetURL(coopData.bannerImage);
    }

    const response = await fetch("/api/coops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: coopData.name,
        admins: [], // Inactive coops have no admins
        country: coopData.country,
        state: coopData.state,
        sector: coopData.sector,
        sharePrice: coopData.sharePrice,
        court: coopData.court,
        regNumber: coopData.regNumber,
        about: coopData.about,
        logoUrl: logoUrl,
        bannerUrl: bannerUrl,
        status: "inactive",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create cooperative");
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to create cooperative:", error);
    throw new Error(`Failed to create cooperative: ${error.message}`);
  }
};

/**
 * Updates an existing cooperative document by its ID via API route.
 * @param {string} coopId - The ID of the cooperative document to update.
 * @param {object} updateData - An object containing the data to update.
 * @returns {Promise<object>} A promise that resolves to the updated document.
 */
export const updateCooperativeById = async (coopId, updateData) => {
  if (!coopId) {
    throw new Error("Cooperative ID is required for an update.");
  }

  try {
    // Handle file uploads if new files are provided
    let newLogoUrl = null;
    let newBannerUrl = null;

    if (updateData.logoFile instanceof File) {
      newLogoUrl = await uploadFileAndGetURL(updateData.logoFile);
    }

    if (newLogoUrl === null && updateData.logoFile) {
      newLogoUrl = updateData.logoFile; // If no new file, keep existing URL
    }

    if (updateData.bannerFile instanceof File) {
      newBannerUrl = await uploadFileAndGetURL(updateData.bannerFile);
    }
    if (newBannerUrl === null && updateData.bannerFile) {
      newBannerUrl = updateData.bannerFile; // If no new file, keep existing URL
    }

    const response = await fetch(`/api/coops/${coopId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: updateData.name,
        adminEmails: updateData.adminEmails,
        country: updateData.country,
        state: updateData.state,
        sector: updateData.sector,
        sharePrice: updateData.sharePrice,
        court: updateData.court,
        regNumber: updateData.regNumber,
        about: updateData.about,
        logoUrl: newLogoUrl,
        bannerUrl: newBannerUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update cooperative");
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to update cooperative with ID ${coopId}:`, error);
    throw error;
  }
};

/**
 * Updates the status of a specific cooperative via API route.
 * @param {string} coopId - The ID of the cooperative to update.
 * @param {'active' | 'inactive' | 'pending'} newStatus - The new status for the cooperative.
 * @returns {Promise<object>} A promise that resolves to the updated document.
 */
export const updateCoopStatus = async (coopId, newStatus) => {
  if (!coopId || !newStatus) {
    throw new Error("Cooperative ID and a new status are required.");
  }

  if (!["active", "inactive", "pending"].includes(newStatus)) {
    throw new Error(
      "Invalid status provided. Must be 'active', 'inactive', or 'pending'.",
    );
  }

  try {
    const response = await fetch(`/api/coops/${coopId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update status");
    }

    return await response.json();
  } catch (error) {
    console.error(
      `Failed to update status for cooperative with ID ${coopId}:`,
      error,
    );
    throw error;
  }
};

/**
 * Assigns auditors to a cooperative via API route.
 * @param {string} coopId - The cooperative ID.
 * @param {string[]} auditorIds - Array of auditor IDs.
 * @returns {Promise<object>} A promise that resolves to the updated document.
 */
export async function assignAuditorsToCoop(coopId, auditorIds) {
  if (!coopId) throw new Error("coopId is required");
  if (!Array.isArray(auditorIds))
    throw new Error("auditorIds must be an array");

  const response = await fetch(`/api/coops/${coopId}/auditors`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ auditorIds }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to assign auditors");
  }

  return await response.json();
}

/**
 * Gets auditor IDs for a cooperative via API route.
 * @param {string} coopId - The cooperative ID.
 * @returns {Promise<string[]>} A promise that resolves to an array of auditor IDs.
 */
export async function getCoopAuditerIds(coopId) {
  if (!coopId) throw new Error("coopId is required");

  const response = await fetch(`/api/coops/${coopId}/auditors`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get auditor IDs");
  }

  const data = await response.json();
  return data.auditorIds || [];
}
/**
 * Saves report data for a cooperative via API route.
 * @param {string} coopId - The cooperative ID.
 * @param {object} reportData - The report data object.
 * @returns {Promise<object>} A promise that resolves to the report data.
 */
export const saveCooperativeReportData = async (coopId, reportData) => {
  if (!coopId) throw new Error("coopId is required");
  if (reportData == null || typeof reportData !== "object") {
    throw new Error("reportData must be a non-null object");
  }

  const response = await fetch(`/api/coops/${coopId}/report`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reportData }),
  });

  if (!response.ok) {
    let errorMessage = "Failed to save report data";
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // ignore JSON parse error
      }
    }
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const data = await response.json();
    return data.reportData;
  }
  return reportData;
};

/**
 * Fetches report data for a cooperative via API route.
 * @param {string} coopId - The cooperative ID.
 * @returns {Promise<object|null>} A promise that resolves to the report data or null.
 */
export const fetchCooperativeReportData = async (coopId) => {
  if (!coopId) throw new Error("coopId is required");

  const response = await fetch(`/api/coops/${coopId}/report`);

  if (!response.ok) {
    let errorMessage = "Failed to fetch report data";
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // ignore JSON parse error
      }
    }
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const data = await response.json();
    return data.reportData;
  }
  return null;
};


/**
 * Uploads a document file and gets the URL via API route.
 * @param {File | null} file - The file to upload.
 * @returns {Promise<string|null>} A promise that resolves to the file URL or null.
 */
export const uploadDocsAndGetURL = async (file) => {
  // If no file is provided, do nothing.
  if (!file) return null;

  // Use the existing uploadFileAndGetURL with type "docs"
  return uploadFileAndGetURL(file, "docs");
};

/**
 * Updates document links for a cooperative via API route.
 * @param {string} coopId - The cooperative ID.
 * @param {string[]} documentIds - Array of document URLs/IDs.
 * @returns {Promise<object>} A promise that resolves to the updated document.
 */
export const updateCoopDocs = async (coopId, documentIds) => {
  if (!coopId || !documentIds) {
    throw new Error("Cooperative ID and documentIds are required.");
  }

  const response = await fetch(`/api/coops/${coopId}/docs`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentIds }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update documents");
  }

  return await response.json();
};

/**
 * Fetches all document links for a cooperative via API route.
 * @param {string} coopId - Cooperative document ID.
 * @returns {Promise<string[]>} Array of document URLs.
 */
export const getAllDocLinks = async (coopId) => {
  if (!coopId) {
    throw new Error("Cooperative ID is required to fetch documents.");
  }

  const response = await fetch(`/api/coops/${coopId}/docs`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch documents");
  }

  const data = await response.json();
  return data.documents || [];
};
