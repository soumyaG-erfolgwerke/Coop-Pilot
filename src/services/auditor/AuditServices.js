export const startAudit = async (formType, coopId, orgId) => {
  try {
    const res = await fetch(
      `/api/auditor/coops/startAudit/${encodeURIComponent(coopId)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType,
          coopId: coopId,
          orgId: orgId,
        }),
      },
    );

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to start audit");
    }
    return data;
  } catch (error) {
    throw error;
  }
};
