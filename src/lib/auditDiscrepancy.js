export const getAuditDiscrepancyForCoopAdmin = async (coopId) => {
  if (!coopId) throw new Error("coopId is required.");

  try {
    const res = await fetch(
      `/api/audit-discrepancy/coop?coopId=${encodeURIComponent(coopId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    if (!res.ok) {
      throw new Error(`Error: ${res.error}`);
    }
    const data = await res.json();
    return data.discrepancyList || [];
  } catch (err) {
    console.error("Failed to fetch discrepancy:", err);
    throw err;
  }
};

// create discrepancy for a org & coop

export const createDiscrepancyForCoopOrg = async ({
  auditOrgId,
  coopId,
  title,
  description,
  type,
}) => {
  try {
    const res = await fetch(`/api/audit-discrepancy/audit-org`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ auditOrgId, coopId, title, description, type }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Error: ${data.error}`);
    }
    return data;
  } catch (err) {
    throw err;
  }
};

export const getDiscrepanciesForAuditOrg = async (auditOrgId, coopId) => {
  if (!auditOrgId || !coopId)
    throw new Error("auditOrgId and coopId are required.");
  try {
    const res = await fetch(
      `/api/audit-discrepancy/audit-org?auditOrgId=${encodeURIComponent(auditOrgId)}&coopId=${encodeURIComponent(coopId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!res.ok) {
      const data = await res.json();
      throw new Error(`Error: ${data.error}`);
    }

    const data = await res.json();
    return data.data || [];
  } catch (err) {
    throw err;
  }
};

export const updateDiscrepancyStatus = async (
  discrepancyId,
  status,
  auditOrgId,
  coopId,
) => {
  if (!discrepancyId || !status)
    throw new Error("discrepancyId and status are required.");

  console.log("Updating discrepancy status with data:", {
    discrepancyId,
    status,
    auditOrgId,
    coopId,
  });
  try {
    const res = await fetch(`/api/audit-discrepancy/audit-org`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status, discrepancyId, auditOrgId, coopId }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(`Error: ${data.error}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    throw err;
  }
};
