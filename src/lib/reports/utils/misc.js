/**
 **[HELPER] Basic utility functions for Reports API routes, including:
 * - `isQueryCapabilityError`: Detects if an error is related to missing query capabilities in Appwrite (e.g., missing indexes).
 * - `filterByCutoff`: Filters documents based on a cutoff ISO date string, comparing it to the document's `time` field.
 * - `chunkArray`: Splits an array into smaller chunks of a specified size.
 */

const isQueryCapabilityError = (e) => {
  const msg = String(e?.message || "").toLowerCase();
  return (
    msg.includes("index") || msg.includes("query") || msg.includes("attribute")
  );
};

const filterByCutoff = (docs, cutoffIso) => {
  return docs.filter((tx) => {
    const t = tx?.time;
    if (!t) return false;

    const d = new Date(t);
    if (Number.isNaN(d.getTime())) return false;

    return d.toISOString() <= cutoffIso;
  });
};

const chunkArray = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
};

export { chunkArray, filterByCutoff, isQueryCapabilityError };
