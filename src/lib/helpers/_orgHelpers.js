export const getCoopDataById = async (coopId) => {
  try {
    const response = await fetch(
      `/api/orgadmin/fetchCoop/${encodeURIComponent(coopId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    if (!response.ok) {
      throw new Error("Failed to load cooperative data");
    }
    const data = await response.json();
    // console.log("Coop Data", data);
    return data;
  } catch (error) {
    console.error("Failed to load cooperative data:", error);
    return null;
  }
};

//hasAuditAccess(auditId)
//getAuditById(auditId)
export const getAuditById = async (auditId) => {
  try {
    const response = await fetch(
      `/api/orgadmin/fetchAudit/${encodeURIComponent(auditId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    if (!response.ok) {
      throw new Error("Failed to load audit data");
    }
    const data = await response.json();
    // console.log("Audit Data", data);
    return data;
  } catch (error) {
    console.error("Failed to load audit data:", error);
    return null;
  }
};
