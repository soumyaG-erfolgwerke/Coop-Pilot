//  fetch() to get my audits from /auditor/audits

export const getMyAudits = async ({ orgId }) => {
  const response = await fetch(`/api/auditor/audits?orgId=${orgId}`);
  if (!response.ok) {
    console.error("Failed to fetch audits:", response.statusText);
    const data = await response.json();
    throw new Error(`Error: ${data?.error}`);
  }

  const data = await response.json();
  return data;
};

// fetch() to get audit details from /auditor/audits/[historyId]

export const getAuditDetails = async ({ historyId }) => {
  const response = await fetch(`/api/auditor/audits/${historyId}`);
  if (!response.ok) {
    console.error("Failed to fetch audits:", response.statusText);
    const data = await response.json();
    throw new Error(`Error: ${data?.error}`);
  }

  const data = await response.json();
  return data;
};

// fetch() PATCH to create comments at /auditor/audits/[historyId]/comment

export const createComment = async ({ historyId, comment }) => {
  const response = await fetch(`/api/auditor/audits/${historyId}/comment`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comment }),
  });

  if (!response.ok) {
    console.error("Failed to create comment:", response.statusText);
    const data = await response.json();
    throw new Error(`Error: ${data?.error}`);
  }

  const data = await response.json();
  return data;
};
