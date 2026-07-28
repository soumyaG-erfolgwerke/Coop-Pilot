import { readJsonResponse } from "./orgAdminService";

export const fetchCoopsForOrgAdmin = async (orgId) => {
  try {
    const res = await fetch(
      `/api/orgadmin/coops?orgId=${encodeURIComponent(orgId)}`,
    );
    const data = await readJsonResponse(res, "Failed to fetch cooperatives");
    return data;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const fetchCoopHistoryForOrgAdmin = async (orgId, coopId) => {
  try {
    const res = await fetch(
      `/api/orgadmin/coops/history?orgId=${encodeURIComponent(orgId)}&coopId=${encodeURIComponent(coopId)}`,
    );
    const data = await readJsonResponse(
      res,
      "Failed to fetch cooperative history",
    );
    return data;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const fetchCoopsForAuditor = async (orgId) => {
  try {
    const res = await fetch(
      `/api/auditor/coops?orgId=${encodeURIComponent(orgId)}`,
    );
    const data = await readJsonResponse(res, "Failed to fetch cooperatives");
    return data;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const fetchCoopHistoryForAuditor = async (orgId, coopId) => {
  try {
    const res = await fetch(
      `/api/auditor/coops/history?orgId=${encodeURIComponent(orgId)}&coopId=${encodeURIComponent(coopId)}`,
    );
    const data = await readJsonResponse(
      res,
      "Failed to fetch cooperative history",
    );
    return data;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export default {
  fetchCoopsForOrgAdmin,
  fetchCoopHistoryForOrgAdmin,
  fetchCoopsForAuditor,
  fetchCoopHistoryForAuditor,
};
