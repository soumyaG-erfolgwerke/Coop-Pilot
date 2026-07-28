import { Plus, MessageCircle, CheckCircle2, Circle } from "lucide-react";
import NewIssueDrawer from "./NewIssueDrawer";

export const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default function IssueListView({
  auditOrgName,
  issues,
  page,
  totalPages,
  setPage,
  drawerOpen,
  setDrawerOpen,
  form,
  setForm,
  creating,
  onCreateIssue,
  onOpenIssue,
  loading = false,
}) {
  const openCount = issues.filter((i) => i.status === "open").length;
  const closedCount = issues.filter((i) => i.status !== "open").length;

  return (
    <div className="min-h-screen w-full bg-[#f4f5f7] dark:bg-slate-950 dark:text-slate-100 text-zinc-900 antialiased">
      <div className="w-full max-w-5xl mx-auto px-6 py-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
          <div>
            <h1 className="text-[22px] font-bold tracking-[-0.02em] text-zinc-900 dark:text-slate-100 leading-tight">
              Issues
            </h1>
            {auditOrgName && (
              <p className="text-[13px] text-zinc-500 dark:text-slate-400 mt-0.5">
                {auditOrgName}
              </p>
            )}
          </div>

          <button
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-[13px] font-semibold px-4 py-2 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.18)] transition-colors"
          >
            <Plus size={14} strokeWidth={2.5} />
            New Issue
          </button>
        </div>

        {/* ── Issue list card ── */}
        <div className="bg-white border border-zinc-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">

          {/* Sub-header: open/closed counts */}
          {!loading && issues.length > 0 && (
            <div className="flex items-center gap-5 px-5 py-3 border-b border-zinc-100 dark:border-slate-800 bg-zinc-50 dark:bg-slate-800/40">
              <button className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-zinc-800 dark:text-slate-200">
                <Circle size={13} className="text-emerald-500" />
                {openCount} Open
              </button>
              <button className="inline-flex items-center gap-1.5 text-[12px] font-medium text-zinc-500 dark:text-slate-400">
                <CheckCircle2 size={13} className="text-violet-400" />
                {closedCount} Closed
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && issues.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-slate-800 flex items-center justify-center">
                <Circle size={20} className="text-zinc-400 dark:text-slate-400" />
              </div>
              <div className="text-center">
                <p className="text-[14px] font-semibold text-zinc-700 dark:text-slate-200">
                  No issues found
                </p>
                <p className="text-[13px] text-zinc-400 dark:text-slate-400 mt-0.5">
                  Create your first issue to get started.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-slate-800">
              {issues.map((issue) => {
                const isOpen = issue.status === "open";

                return (
                  <div
                    key={issue.id}
                    onClick={() => onOpenIssue(issue.id)}
                    className="group flex items-start justify-between gap-4 px-5 py-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    {/* Status icon */}
                    <div className="mt-0.5 shrink-0">
                      {isOpen ? (
                        <Circle size={16} className="text-emerald-500" strokeWidth={2} />
                      ) : (
                        <CheckCircle2 size={16} className="text-violet-400" strokeWidth={2} />
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-[14px] font-semibold text-zinc-900 dark:text-slate-100 group-hover:text-black dark:group-hover:text-white leading-snug truncate">
                        {issue.title}
                      </p>

                      <div className="flex items-center gap-1.5 text-[12px] text-zinc-400 dark:text-slate-400 flex-wrap">
                        <span className="font-mono text-zinc-500 dark:text-slate-500">
                          #{issue.id.slice(0, 8)}
                        </span>
                        <span>·</span>
                        <span>
                          by{" "}
                          <span className="text-zinc-600 dark:text-slate-300 font-medium">
                            {issue.createdByEmail}
                          </span>
                        </span>
                        <span>·</span>
                        <span>
                          {isOpen
                            ? `opened ${formatDate(issue.createdAt)}`
                            : `closed ${formatDate(
                                issue.resolvedAt || issue.updatedAt
                              )}`}
                        </span>
                      </div>
                    </div>

                    {/* Comment count */}
                    <div className="flex items-center gap-1.5 text-zinc-400 dark:text-slate-400 group-hover:text-zinc-600 dark:group-hover:text-slate-200 transition-colors shrink-0">
                      <MessageCircle size={14} strokeWidth={1.8} />
                      <span className="text-[12px] font-medium tabular-nums">
                        {issue.commentCount ?? 0}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="text-[12px] font-medium text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-slate-200 disabled:opacity-40 transition-colors"
            >
              ← Previous
            </button>

            <span className="text-[12px] text-zinc-400 dark:text-slate-400">
              Page{" "}
              <span className="font-semibold text-zinc-600 dark:text-slate-200">
                {page}
              </span>{" "}
              of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="text-[12px] font-medium text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-slate-200 disabled:opacity-40 transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Drawer */}
      <NewIssueDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        form={form}
        setForm={setForm}
        creating={creating}
        onSubmit={onCreateIssue}
      />
    </div>
  );
}