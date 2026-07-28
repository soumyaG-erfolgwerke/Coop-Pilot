const buildQuery = (params) => {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null || v === "") continue;
    usp.set(k, String(v));
  }
  return usp.toString();
};

/**
 * Action 1: Fetches the entire history list (Fires once on Tab Mount)
 */
export const getCapitalSummaryHistoryList = async ({ coopId, signal }) => {
  if (!coopId) throw new Error("coopId is required");

  const qs = buildQuery({ coopId });
  const res = await fetch(`/api/reports/capital-summary?${qs}`, { method: "GET", signal });
  const data = await res.json();

  if (!res.ok || !data?.success) {
    throw new Error(data?.error || "Failed to load report registry logs.");
  }
  return data.history || [];
};

/**
 * Action 2: Commands the server to run calculations and build a brand new report (Fires on Button Click)
 */
export const generateNewCapitalSummaryReport = async ({ coopId, fiscalYear }) => {
  if (!coopId || !fiscalYear) throw new Error("Cooperative context parameters are required.");

  const res = await fetch("/api/reports/capital-summary/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ coopId, fiscalYear }),
  });

  const data = await res.json();
  if (!res.ok || !data?.success) {
    throw new Error(data?.error || "Failed to execute server-side generation sequence.");
  }

  // Returns the standardized uniform wrapped report document object (whether fresh or from the safeguard)
  return data.report;
};