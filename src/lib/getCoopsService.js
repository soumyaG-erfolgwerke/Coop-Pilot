// Client-side service - uses API routes for coop operations

/**
 * Fetches all cooperatives from the database.
 * @returns {Promise<Array<object>>} A promise resolving to an array of formatted cooperative objects.
 */
export const getAllCoops = async () => {
  try {
    const res = await fetch("/api/coop-services/all");
    const data = await res.json();
    return data.coops || [];
  } catch (error) {
    console.error("Failed to fetch cooperatives:", error);
    return [];
  }
};

export const getAssignedCoopsAudit = async (auditorId) => {
  try {
    const res = await fetch(
      `/api/coop-services/assigned?auditorId=${encodeURIComponent(auditorId)}`,
    );
    const data = await res.json();
    return data.coops || [];
  } catch (error) {
    console.error("Failed to fetch cooperatives:", error);
    return [];
  }
};

export const getAllActivatedCoops = async () => {
  try {
    const res = await fetch("/api/coop-services/active");
    const data = await res.json();
    return data.coops || [];
  } catch (error) {
    console.error("Failed to fetch cooperatives:", error);
    return [];
  }
};

export const getCoopById = async (coopId) => {
  try {
    const res = await fetch(`/api/coop-services/${encodeURIComponent(coopId)}`);
    const data = await res.json();

    if (!data?.coop?.isLive) {
      return null;
    }

    return data.coop || null;
  } catch (error) {
    console.error(`Failed to fetch cooperative with ID ${coopId}:`, error);
    return null;
  }
};

export const getCoopByIdForAudit = async (coopId) => {
  try {
    const res = await fetch(`/api/coop-services/${encodeURIComponent(coopId)}`);
    const data = await res.json();

    return data.coop || null;
  } catch (error) {
    console.error(`Failed to fetch cooperative with ID ${coopId}:`, error);
    return null;
  }
};

export const getCoopByRegNumber = async (regNumber) => {
  try {
    const res = await fetch(
      `/api/coop-services/by-reg-number?regNumber=${encodeURIComponent(regNumber)}`,
    );
    const data = await res.json();
    return data.coop || null;
  } catch (error) {
    console.error(
      `Failed to fetch cooperative with RegNumber ${regNumber}:`,
      error,
    );
    return null;
  }
};

export const getCoopAdmins = async (adminEmail) => {
  try {
    const res = await fetch(
      `/api/coop-services/admins?email=${encodeURIComponent(adminEmail)}`,
    );
    const data = await res.json();
    return data.coops || [];
  } catch (error) {
    console.error("Failed to fetch cooperatives:", error);
    return [];
  }
};

export async function fetchAuditSchemaAndStatus(coopId) {
  try {
    const response = await fetch(`/api/coop-services/audit/${coopId}`);

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch audit data");
    }

    return {
      auditSchema:
        typeof data.auditJson === "string"
          ? JSON.parse(data.auditJson)
          : data.auditJson,
      auditStatus: data.auditStatus,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}
