export const getDeadlineInfo = async (role, page = 1, limit = 3) => {
  if (role !== "org_admin" && role !== "auditer") {
    throw new Error("Invalid role");
  }
  const endpoint =
    role === "org_admin"
      ? "/api/orgadmin/coops/deadline"
      : "/api/auditor/coops/deadline";
  const response = await fetch(endpoint + `?page=${page}&limit=${limit}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch deadline info");
  }

  const data = await response.json();
  return data;
};

export const updateDeadline = async (role, auditId, newDeadline) => {
  if (role !== "org_admin" && role !== "auditer") {
    throw new Error("Invalid role");
  }

  const endpoint =
    role === "org_admin"
      ? "/api/orgadmin/coops/deadline"
      : "/api/auditor/coops/deadline";
  const response = await fetch(endpoint, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ auditId, deadline: newDeadline }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update deadline");
  }

  const data = await response.json();
  return data;
};
