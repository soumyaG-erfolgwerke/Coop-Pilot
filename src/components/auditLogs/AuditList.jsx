"use client";

import { formatAuditMessage, formatTimeAgo } from "./auditFormatter";
import { Activity } from "lucide-react";

export default function AuditList({
  logs = [],
  currentUserId,
  title = "Activity",
  actionsFilter = [],
}) {
  const filteredLogs =
    actionsFilter.length > 0
      ? logs.filter((log) => actionsFilter.includes(log.action))
      : logs;

  const sortedLogs = [...filteredLogs].sort(
    (a, b) => new Date(b.performedAt) - new Date(a.performedAt),
  );

  return (
    <section className="flex flex-col gap-4 pt-6 border-t border-gray-200 dark:border-slate-800">
      {title && (
        <div className="flex items-center gap-2 px-1">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            {title}
          </h3>
        </div>
      )}

      {sortedLogs.length === 0 ? (
        <div className="p-6 bg-gray-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-gray-200 dark:border-slate-700 text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            No activity yet
          </p>
        </div>
      ) : (
        <div className="relative max-h-40 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-slate-500">
          <div className="relative pl-2 py-1">
            <div className="absolute top-4 bottom-4 left-[11px] w-px bg-gray-200 dark:bg-slate-700/60"></div>

            <div className="space-y-1 relative">
              {sortedLogs.map((log) => (
                <div
                  key={log.$id}
                  className="flex items-center gap-3.5 group -mx-2 px-2 py-2 rounded-xl transition-all duration-200 cursor-default"
                >
                  <div className="relative z-10 w-1.5 h-1.5 bg-gray-300 dark:bg-slate-600 rounded-full group-hover:bg-indigo-500 group-hover:scale-150 transition-all duration-300 shrink-0 shadow-sm"></div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate transition-colors">
                      {formatAuditMessage(log, currentUserId)}
                      <span className="text-slate-400 dark:text-slate-500 ml-1.5 font-normal group-hover:text-indigo-400 dark:group-hover:text-indigo-500/70 transition-colors">
                        · {formatTimeAgo(log.performedAt)}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
