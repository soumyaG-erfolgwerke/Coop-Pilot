/**
 * Cooperative Service - Client-side API facade
 * All functions make fetch calls to /api/coops/* routes
 */

// Get all uploaded docs by coopAdmin
export const getDocumentsofCoop = async (coopId) => {
  if (!coopId) {
    throw new Error("coopId is required");
  }

  try {
    const res = await fetch(
      `/api/coops/docServices?coopId=${coopId}`,
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to fetch documents");
    }

    return data;
  } catch (error) {
    console.error("Fetch documents error:", error);
    throw error;
  }
};

/**
 * Upload multiple documents with metadata via API route.
 * @param {Array} documents - Array of document objects
 * @returns {Promise<Array>} Uploaded documents
 */

// upload document sevice for coopAdmin
export const uploadDocuments = async (doc) => {
  if (!doc || !doc.file) {
    throw new Error("Document required");
  }

  try {
    const formData = new FormData();

    formData.append("file", doc.file);

    formData.append(
      "meta",
      JSON.stringify({
        coopId: doc.coopId,
        category: doc.category,
        subCategory: doc.subCategory || null,
        effectiveFrom: doc.effectiveFrom,

        visibleToMembers: doc.visibleToMembers ?? false,
        downloadAllowed: doc.downloadAllowed ?? false,

        uploadedBy: doc.uploadedBy,
        userId: doc.userId || null,
      }),
    );

    const response = await fetch("/api/coops/docServices", {
      method: "POST",
      body: formData,
    });

    const res = await response.json();

    if (!response.ok) {
      throw new Error(res.error?.message || "Upload failed");
    }

    return res.data;
  } catch (error) {
    console.error("Upload service error:", error);
    throw error;
  }
};

