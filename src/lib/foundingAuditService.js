/**
 * Frontend Service Layer for Founding Audits (§11 Abs. 2 Nr. 3 GenG)
 * Coordinates data state tracking between the UI components and Next.js API routes.
 */

const BASE_URL = "/api/orgadmin/founding-audit";

export const foundingAuditService = {
  /**
   * 1. Fetch all founding audit instances for a given organization ID.
   * Fired when the Founding Audit dashboard tab is mounted.
   * @param {string} orgId
   * @returns {Promise<Array>} List of audit instances
   */
  getAllOrgAudits: async (orgId) => {
    if (!orgId) throw new Error("Organization ID is required to fetch audits.");

    const response = await fetch(
      `${BASE_URL}?orgId=${encodeURIComponent(orgId)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );

    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Failed to fetch organization audits.");

    // Returns Appwrite's listDocuments payload array structure (.documents)
    return result.data?.documents || [];
  },

  /**
   * 2. Initialize a brand new founding audit instance session with a blank state.
   * Fired when the "Create New" action button is triggered.
   * @param {string} orgId
   * @param {string} createdBy - User ID of the operating auditor
   * @param {string} auditName - Name of the new audit instance
   * @returns {Promise<Object>} Newly created Appwrite document data
   */
  createNewAudit: async (orgId, createdBy, auditName) => {
    if (!orgId || !createdBy || !auditName)
      throw new Error("Missing parameters required for audit initiation.");

    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, createdBy, auditName }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(
        result.error || "Failed to initiate new founding audit instance.",
      );
    }

    return result.data;
  },

  /**
   * 3. Hydrates and compiles the complete masterState context map for a single audit.
   * Fired when an auditor selects an individual audit entry card from the queue.
   * @param {string} auditId
   * @returns {Promise<Object>} Unified masterState object
   */
  getAuditDetails: async (auditId) => {
    if (!auditId) throw new Error("Audit ID context parameter is missing.");

    const response = await fetch(`${BASE_URL}/${auditId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Failed to load audit session details.");

    // Returns the completely assembled masterState payload from buildMasterState
    return result.data;
  },

  /**
   * 4. Synchronizes phase-specific updates up to the database.
   * Fired globally when "Save Draft" or "Validate & Submit Phase" buttons are triggered.
   * @param {string} auditId
   * @param {"G1"|"G2"|"G3"|"G4"|"G5"|"G6"|"G7"} phaseId - Capitalized tracking identifier
   * @param {boolean} isSubmit - True forces server-side strict legal schema checking
   * @param {Object} data - Clean property-state dictionary slice for this specific phase
   * @returns {Promise<Object>} Status message and submission confirmation metrics
   */
  syncPhaseData: async (auditId, phaseId, isSubmit, data) => {
    if (!auditId || !phaseId || !data) {
      throw new Error(
        "Missing required parameters required to commit phase data.",
      );
    }

    const response = await fetch(`${BASE_URL}/${auditId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phaseId, isSubmit, data }),
    });

    const result = await response.json();
    if (!response.ok) {
      const err = new Error(result.error || "Phase synchronization failed.");
      err.details = result.details || null;
      throw err;
    }

    return result;
  },

  /**
   * Modifies target tracking columns or status states on an individual audit instance.
   * @param {string} auditId
   * @param {Object} updatePayload - e.g., { globalStatus: "ARCHIVED" }
   */
  modifyAuditInstance: async (auditId, updatePayload) => {
    if (!auditId) throw new Error("Audit ID context parameter is missing.");
    const response = await fetch(`${BASE_URL}/${auditId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatePayload),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(
        result.error || "Failed to patch audit configuration state.",
      );
    }
    return result;
  },

  /**
   * 5. Upload an independent multi-part file binary directly into the founding-audit storage bucket.
   * @param {File} file - Raw browser file payload
   * @returns {Promise<Object>} Contains response status success code and public view url string
   */
  uploadAuditFile: async (file) => {
    if (!file) throw new Error("No file payload selected.");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${BASE_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(
        result.error || "Network error occurred during file upload.",
      );
    }
    return result;
  },

  /**
   * Permanently removes a physical file from the storage bucket
   * @param {string} fileUrl - Absolute cloud link string
   */
  deleteAuditFile: async (fileUrl) => {
    const response = await fetch(
      `${BASE_URL}/upload?fileUrl=${encodeURIComponent(fileUrl)}`,
      {
        method: "DELETE",
      },
    );
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || "Storage cleanup failed.");
    }
    return result;
  },

  // =========================================================================
  // CORE COMPANION LAYOUT SUBFLOW METHODS (Phase G4 Member Matrix Relational Rows)
  // =========================================================================

  /**
   * 4. Retrieves the complete list of organizational members linked to this audit session.
   * Fired when the G4 phase is opened to load the member matrix data.
   * @param {string} auditId
   * @returns {Promise<Array>} List of member document records
   * Each record contains: { id, memberType, name, role, contactInfo, etc. }
   */
  getOrganMembers: async (auditId) => {
    if (!auditId) throw new Error("Audit ID is required to fetch members.");
    const response = await fetch(`${BASE_URL}/${auditId}/members`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(
        result.error || "Failed to fetch organizational members.",
      );
    }
    return result.data;
  },

  /**
   * 5. Appends a brand new member row entry inside the separate relational collection.
   * @param {string} auditId
   * @param {Object} memberData - Unified person row fields configuration profile
   */
  addOrganMember: async (auditId, memberData) => {
    const response = await fetch(`${BASE_URL}/${auditId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(memberData),
    });
    const result = await response.json();
    if (!response.ok || !result.success)
      throw new Error(result.error || "Failed to append record.");
    return result.data;
  },

  /**
   * 6. Modifies an existing member row document record in-place.
   * @param {string} auditId
   * @param {string} memberId
   * @param {Object} memberData
   */
  updateOrganMember: async (auditId, memberId, memberData) => {
    const response = await fetch(`${BASE_URL}/${auditId}/members`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, ...memberData }),
    });
    const result = await response.json();
    if (!response.ok || !result.success)
      throw new Error(result.error || "Failed to update record.");
    return result.message;
  },

  /**
   * 7. Drops a member row document record out of the collection completely.
   * @param {string} auditId
   * @param {string} memberId
   */
  deleteOrganMember: async (auditId, memberId) => {
    const response = await fetch(
      `${BASE_URL}/${auditId}/members?memberId=${encodeURIComponent(memberId)}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      },
    );
    const result = await response.json();
    if (!response.ok || !result.success)
      throw new Error(result.error || "Failed to drop record.");
    return result.message;
  },

  /**
   * 8. Retrieves the complete list of organizational members linked to this audit session.
   * @param {string} auditId
   */
  getOrgMembersByAuditId: async (auditId) => {
    if (!auditId) throw new Error("Audit ID is required to fetch members.");
    const response = await fetch(`${BASE_URL}/${auditId}/members`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();
    if (!response.ok || !result.success)
      throw new Error(result.error || "Failed to fetch members.");

    return result.data;
  },

  /**
   * Triggers the final legal report PDF generation and signature engine workflow block.
   * @param {string} auditId
   * @param {Object} gutachtenFields - payload containing G7 state parameters
   */
  generateGutachten: async (auditId, gutachtenFields) => {
    const response = await fetch(`${BASE_URL}/${auditId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(gutachtenFields),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(
        result.error || "Failed to execute Gutachten report generation pass.",
      );
    }
    return result.data;
  },
};
