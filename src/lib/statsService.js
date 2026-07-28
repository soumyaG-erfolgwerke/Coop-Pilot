export const getStats = async (role, auditOrgId) => {
  if (role !== "org_admin" && role !== "auditer" && role !== "aud_E") {
    throw new Error("Invalid role");
  }
  const endpoint =
    role === "org_admin"
      ? `/api/orgadmin/coops/stats`
      : `/api/auditor/coops/stats?auditOrgId=${auditOrgId}`;
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch stats");
  }

  const data = await response.json();
  return data;
};


export const getAuditorStats = async (auditOrgId, page = 1, limit = 10) => {
  const response = await fetch(`/api/orgadmin/team-member/stats?orgId=${auditOrgId}&page=${page}&limit=${limit}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch stats");
  }
  const data = await response.json();
  return data;
};