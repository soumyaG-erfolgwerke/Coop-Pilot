import { readJsonResponse } from "./orgAdminService";

export const searchCoops = async (coop) => {
  try {
    const res = await fetch(
      `/api/coop-services/search?coop=${encodeURIComponent(coop)}`,
    );
    const data = await readJsonResponse(res, "Failed to search cooperatives");
    return data.coops || [];
  } catch (err) {
    throw err;
  }
};

export const attachCoopToAuditOrg = async (coopId) => {
  try {
    const res = await fetch("/api/orgadmin/attach-coop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coopId }),
    });

    const data = await readJsonResponse(res, "Failed to attach cooperative");
    return data;
  } catch (err) {
    throw err;
  }
};

export const getRecentInvites = async (
  auditOrgId,
  page = 1,
  limit = 10,
) => {

  try {
    const params = new URLSearchParams({
      auditOrgId,
      page: String(page),
      limit: String(limit),
    });

    const res = await fetch(`/api/orgadmin/invite-coop?${params.toString()}`);

    const data = await readJsonResponse(res, "Failed to fetch recent invites");

    return {
      invites: data.invites || [],
      pagination: data.pagination || {
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  } catch (err) {
    throw err;
  }
};

export default {
  searchCoops,
  attachCoopToAuditOrg,
};
