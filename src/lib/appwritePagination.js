import { Query } from "node-appwrite";

/**
 * List all Appwrite documents matching a query by paging with cursorAfter.
 *
 * Purpose: Avoid silent truncation from Appwrite listDocuments defaults/limits.
 *
 * @param {Object} args
 * @param {import('node-appwrite').Databases} args.databases
 * @param {string} args.databaseId
 * @param {string} args.collectionId
 * @param {Array<any>} [args.queries] - Appwrite Query[] (e.g., Query.equal, Query.orderDesc)
 * @param {number} [args.pageSize] - Max per page (Appwrite commonly allows up to 100/500 depending on plan)
 * @param {number} [args.maxPages] - Safety cap to prevent infinite loops
 * @param {string|null} [args.cursorAfter] - Initial cursorAfter document id
 * @returns {documents: Array<any>, truncated: boolean}
 */
export const listAllDocuments = async ({
  databases,
  databaseId,
  collectionId,
  queries = [],
  pageSize = 100,
  maxPages = 200,
  cursorAfter = null,
}) => {
  if (!databases) throw new Error("databases is required");
  if (!databaseId) throw new Error("databaseId is required");
  if (!collectionId) throw new Error("collectionId is required");

  const all = [];
  const seenCursors = new Set();
  let cursor = cursorAfter;
  let truncated = false;

  for (let page = 0; page < maxPages; page++) {
    const pageQueries = [...queries, Query.limit(pageSize)];
    if (cursor) pageQueries.push(Query.cursorAfter(cursor));

    const res = await databases.listDocuments(
      databaseId,
      collectionId,
      pageQueries,
    );

    const docs = res?.documents || [];
    all.push(...docs);

    const total = typeof res?.total === "number" ? res.total : null;

    // Case 1: we reached total → done
    if (total !== null && all.length >= total) break;

    // Case 2: last page (natural exhaustion)
    if (docs.length < pageSize) break;

    // Case 3: detect infinite loop / bad ordering
    const lastId = docs[docs.length - 1]?.$id;
    if (!lastId) break;

    if (seenCursors.has(lastId)) {
      throw new Error(
        `Pagination cursor repeated (lastId=${lastId}). Check ordering queries and indexes.`,
      );
    }

    seenCursors.add(lastId);
    cursor = lastId;

    // Case 4: hit safety cap → truncated
    if (page === maxPages - 1) {
      truncated = true;
    }
  }

  return {
    documents: all,
    truncated,
  };
};