// fetch() call at /api/orgadmin/issues to get list of issues for the org admin dashboard, also used for fetching issues for a specific audit org in the audit team member dashboard along with pagination

export const getIssuesForAuditOrg = async (
  auditOrgId,
  page = 1,
  limit = 10,
) => {
  try {
    const response = await fetch(
      `/api/orgadmin/issues?auditOrgId=${auditOrgId}&page=${page}&limit=${limit}`,
    );
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error("Failed to fetch issues for audit org", error);
  }
};

// fetch() call at /api/orgadmin/comments to get list of comments for a specific issue in the audit team member dashboard along with pagination

export const getCommentsForIssue = async (issueId, page = 1, limit = 10) => {
  try {
    const response = await fetch(
      `/api/orgadmin/comments?issueId=${issueId}&page=${page}&limit=${limit}`,
    );
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error("Failed to fetch comments for issue", error);
  }
};

// fetch() call at /api/orgadmin/comments to create a new comment for a specific issue in the audit team member dashboard, only org_admin and audit_team_members can create comments

export const createCommentForIssue = async (issueId, message) => {
  try {
    const response = await fetch(`/api/orgadmin/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ issueId, message }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error("Failed to create comment for issue", error);
  }
};

// fetch() call at /api/orgadmin/issues to update the status of an issue to resolved or open in the audit team member dashboard, only org_admin and audit_team_members can update the status of an issue

export const updateIssueStatus = async (issueId, status) => {
  try {
    const response = await fetch(`/api/orgadmin/issues`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ issueId, status }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error("Failed to update issue status", error);
  }
};

// fetch() call to create a new issue for a specific audit organization in the org admin dashboard, only org_admin can create issues
export const createIssueForAuditOrg = async (
  auditOrgId,
  title,
  description,
) => {
  try {
    const response = await fetch(`/api/orgadmin/issues`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ auditOrgId, title, description }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error("Failed to create issue for audit org", error);
  }
};
