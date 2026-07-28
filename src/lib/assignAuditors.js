export const assignMembersToCoop = async ({ coopId, members, role}) => {
  let endpoint;
  if(role === "auditer" || role === "aud_E" || role === "aud_T") {
    endpoint = "/api/auditor/assign-coop";
  } else if(role === "org_admin") {
    endpoint = "/api/orgadmin/assign-coop";
  }

  if(!endpoint) {
    throw new Error("Invalid role for assigning members to cooperative");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      coopId,
      members,
    }),
  });

  if (!response.ok) {
    throw await response.json();
  }

  return response.json();
};

export const fetchAssignedMembersForCoop = async (coopId, role) => {
  let endpoint;
  if(role === "auditer" || role === "aud_E" || role === "aud_T") {
    endpoint = `/api/auditor/assign-coop?coopId=${coopId}`;
  } else if(role === "org_admin") {
    endpoint = `/api/orgadmin/assign-coop?coopId=${coopId}`;
  }

  if(!endpoint) {
    throw new Error("Invalid role for fetching assigned members");
  }

  const response = await fetch(endpoint);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch assigned members");
  }

  return data;
};

export const removeMemberFromCoop = async (assignmentId, role) => {
  let endpoint;
  if(role === "auditer" || role === "aud_E" || role === "aud_T") {
    endpoint = `/api/auditor/assign-coop?assignmentId=${assignmentId}`;
  } else if(role === "org_admin") {
    endpoint = `/api/orgadmin/assign-coop?assignmentId=${assignmentId}`;
  }

  if(!endpoint) {
    throw new Error("Invalid role for removing member from cooperative");
  }

  const response = await fetch(endpoint, {
    method: "DELETE",
  });
  
    const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Failed to remove member from cooperative");
  }
  return data;
  return response.json();
};

