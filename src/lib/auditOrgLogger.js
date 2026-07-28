export const auditOrgLogger = async (auditOrgId, logNote) => {
  if (!auditOrgId) throw new Error("auditOrgId is required.");
  if (!logNote) throw new Error("logNote is required.");

  try {
    const res = await fetch(`/api/auditOrgLogger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auditOrgId,
        logNote,
      }),
    });
    if (!res.ok) {
      throw new Error(`Error: ${res.statusText}`);
    }
    const data = await res.json();
    return data || [];
  } catch (err) {
    console.error("Failed to log note:", err);
    throw err;
  }
};

export const getAuditOrgLogNote = async (
  auditOrgId,
  role,
  page = 1,
  limit = 10,
) => {
  if (!auditOrgId) throw new Error("auditOrgId is required.");
  console.log(
    "Fetching log notes for auditOrgId:",
    auditOrgId,
    "and role:",
    role,
  );
  try {
    const res = await fetch(
      `/api/auditOrgLogger?auditOrgId=${encodeURIComponent(auditOrgId)}&role=${encodeURIComponent(role)}&page=${page}&limit=${limit}`,
    );
    if (!res.ok) {
      throw new Error(`Error: ${res.statusText}`);
    }
    const data = await res.json();
    // console.log("Fetched log notes:", data, data.documents);
    return data || {};
  } catch (err) {
    console.error("Failed to fetch log note:", err);
    throw err;
  }
};
