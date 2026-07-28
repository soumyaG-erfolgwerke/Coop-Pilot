/**
 * Member Service - Client-side API facade
 * All functions make fetch calls to /api/addMember/* routes
 */

/**
 * Creates a new member by calling the API route.
 * @param {object} formData - The form data collected from the AddMember component.
 * @returns {Promise<{success: boolean, userId?: string, documentId?: string, error?: {message: string, code?: number}, info?: string}>}
 */
export const createMember = async (formDataObj) => {
  try {
    const formData = new FormData();

  Object.entries(formDataObj).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

    const response = await fetch("/api/addMember", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    return result;

  } catch (error) {
    console.error("Member Creation Error:", error);
    return {
      success: false,
      error: {
        message:
          error.message ||
          "An unexpected error occurred during submission.",
        code: "UNKNOWN",
      },
    };
  }
};

/**
 * Creates a new coop admin via API route.
 * @param {object} formData - The form data for the admin.
 * @returns {Promise<{success: boolean, userId?: string, documentId?: string, error?: object}>}
 */
export const createCoopAdmin = async (formData) => {
  try {
    const response = await fetch("/api/addMember/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, role: "coopadmin" }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Admin Creation Error:", error);
    return {
      success: false,
      error: { message: error.message || "An unexpected error occurred during admin creation.", code: "UNKNOWN" },
    };
  }
};

/**
 * Creates a new super admin via API route.
 * @param {object} formData - The form data for the super admin.
 * @returns {Promise<{success: boolean, userId?: string, documentId?: string, error?: object}>}
 */
export const createSuperAdmin = async (formData) => {
  try {
    const response = await fetch("/api/addMember/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, role: "superuser" }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Super Admin Creation Error:", error);
    return {
      success: false,
      error: { message: error.message || "An unexpected error occurred during super admin creation.", code: "UNKNOWN" },
    };
  }
};

/**
 * Creates a new auditer via API route.
 * @param {object} formData - The form data for the auditer.
 * @returns {Promise<{success: boolean, userId?: string, documentId?: string, error?: object}>}
 */
export const createAuditer = async (formData) => {
  try {
    const response = await fetch("/api/addMember/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, role: "auditer" }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Auditer Creation Error:", error);
    return {
      success: false,
      error: { message: error.message || "An unexpected error occurred during auditer creation.", code: "UNKNOWN" },
    };
  }
};

/**
 * Creates a new auditer employee via API route.
 * @param {object} formData - The form data for the auditer employee.
 * @returns {Promise<{success: boolean, userId?: string, documentId?: string, error?: object}>}
 */
export const createAuditerEmployee = async (formData) => {
  try {
    const response = await fetch("/api/addMember/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, role: "auditerE" }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Auditer Employee Creation Error:", error);
    return {
      success: false,
      error: { message: error.message || "An unexpected error occurred during auditer employee creation.", code: "UNKNOWN" },
    };
  }
};

/**
 * Creates a new auditer trainee via API route.
 * @param {object} formData - The form data for the auditer trainee.
 * @returns {Promise<{success: boolean, userId?: string, documentId?: string, error?: object}>}
 */
export const createAuditerTrainee = async (formData) => {
  try {
    const response = await fetch("/api/addMember/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, role: "auditerT" }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Auditer Trainee Creation Error:", error);
    return {
      success: false,
      error: { message: error.message || "An unexpected error occurred during auditer trainee creation.", code: "UNKNOWN" },
    };
  }
};
