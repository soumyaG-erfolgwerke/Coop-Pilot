const buildQuery = (params) => {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null || v === "") continue;
    usp.set(k, String(v));
  }
  return usp.toString();
};

/**
 * Fetch the M2.3 share register report.
 *
 * @param {Object} args
 * @param {string} args.coopId
 * @param {string} args.stichtag - YYYY-MM-DD
 * @param {AbortSignal} [args.signal]
 */
export const getShareRegisterReport = async ({ coopId, stichtag, signal }) => {
  if (!coopId) throw new Error("coopId is required");
  if (!stichtag) throw new Error("stichtag is required");

  const qs = buildQuery({ coopId, stichtag });
  const res = await fetch(`/api/reports/share-register?${qs}`, {
    method: "GET",
    signal,
    cache: "no-store",
  });

  let data = null;
  data = await res.json();

  if (!res.ok || !data?.success || !data?.report) {
    const message =
      data?.error ||
      data?.message ||
      `Failed to fetch share register report (${res.status})`;
    throw new Error(message);
  }

  return data.report;
};
