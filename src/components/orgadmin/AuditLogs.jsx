import React, { useEffect, useState } from "react";
import { getAuditOrgLogNote } from "@/lib/auditOrgLogger";
import { useAuth } from "@/hooks/useAuth";

const PAGE_SIZE = 10;

const AuditLogs = ({ auditOrgId }) => {
  const { user } = useAuth();

  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchLogs = async (pageNumber = 1, append = false) => {
    try {
      append ? setLoadingMore(true) : setLoading(true);

      const response = await getAuditOrgLogNote(
        auditOrgId,
        user?.role,
        pageNumber,
        PAGE_SIZE,
      );

      const newLogs = response?.documents || [];

      setLogs((prev) => (append ? [...prev, ...newLogs] : newLogs));

      setHasMore(response?.total > pageNumber * PAGE_SIZE);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!auditOrgId || !user?.role) return;

    setPage(1);
    setLogs([]);

    fetchLogs(1, false);
  }, [auditOrgId, user?.role]);

  const handleLoadMore = async () => {
    const nextPage = page + 1;

    await fetchLogs(nextPage, true);

    setPage(nextPage);
  };

  const formatDate = (date) =>
    new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="m-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 pt-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="border-2 border-gray-200 rounded-full w-7 h-7 animate-spin border-t-gray-600 dark:border-gray-700" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-300">
            Loading activity...
          </p>
        </div>
      ) : logs.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center px-6 py-20">
          <div className="flex items-center justify-center w-12 h-12 mb-4 text-lg bg-gray-100 rounded-full">
            📝
          </div>

          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            No activity found
          </h3>

          <p className="mt-1 text-sm text-center text-gray-500 dark:text-gray-300">
            Activity logs will appear here when there is recent activity in your
            organization.
          </p>
        </div>
      ) : (
        <>
          {/* Timeline */}
          <div className="relative px-6 py-4">
            <div className="absolute top-2 bottom-0 left-7 w-[2px] bg-gray-400 dark:bg-gray-600" />

            <div className="space-y-1">
              {logs.map((log, index) => (
                <div key={log.id || index} className="relative flex gap-4 py-2">
                  {/* Timeline Dot */}
                  <div className="relative z-10 flex-shrink-0 pt-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-400 dark:bg-gray-600 ring-4 ring-white dark:ring-gray-800" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="px-2 transition-colors duration-200 rounded-xl">
                      <p className="text-sm leading-6 text-gray-900 dark:text-white">
                        {log.logNote}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-300">
                        <span>{formatDate(log.createdAt)}</span>

                        {log.for && (
                          <>
                            <span>•</span>
                            <span>{log.for}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-3 px-6 py-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-300">
              Showing{" "}
              <span className="font-medium text-gray-700 dark:text-white">
                {logs.length}
              </span>{" "}
              activity log{logs.length !== 1 ? "s" : ""}
            </p>

            {hasMore ? (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {loadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-300 rounded-full dark:border-gray-600 animate-spin border-t-gray-700 dark:border-t-gray-300" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </button>
            ) : (
              <span className="text-sm text-gray-400 dark:text-gray-500">
                No more activity
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AuditLogs;
