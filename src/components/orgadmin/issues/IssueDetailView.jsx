import { ArrowLeft, GitBranch } from "lucide-react";
import CommentSection from "./CommentSection";
import { formatDate } from "./IssueListView";

export default function IssueDetailView({
  issue,
  comments,
  commentLoading,
  commentText,
  setCommentText,
  isPostingComment,
  onPostComment,
  onToggleStatus,
  onBack,
  onLoadMoreComments,
  hasMoreComments,
}) {
  const isOpen = issue.status === "open";

  return (
    <div className="min-h-screen bg-[#f4f5f7] dark:bg-slate-950 text-zinc-900 dark:text-slate-100 antialiased">
      {/* ── Top nav bar ── */}
      <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-zinc-200 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft size={14} strokeWidth={2.2} />
            Back to Issues
          </button>
        </div>
      </div>

      {/* ── Page body ── */}
      <div className="max-w-6xl mx-auto px-6 py-7 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        {/* ── MAIN COLUMN ── */}
        <div className="space-y-4 min-w-0">
          {/* Issue header */}
          <div className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.05)] overflow-hidden">
            {/* status strip */}
            <div
              className={`h-[3px] w-full ${isOpen ? "bg-emerald-500" : "bg-violet-500"}`}
            />

            <div className="px-6 py-5 flex items-start justify-between gap-4">
              {/* title */}
              <div className="min-w-0 space-y-1.5">
                <h1 className="text-[17px] font-semibold leading-snug tracking-[-0.01em] text-zinc-900 dark:text-slate-100">
                  {issue.title}
                </h1>

                <div className="flex items-center gap-2 text-[12px] font-mono text-zinc-400 dark:text-slate-400 flex-wrap">
                  <GitBranch
                    size={11}
                    className="text-zinc-400 dark:text-slate-500"
                  />
                  <span>{issue.id}</span>
                  <span className="text-zinc-300 dark:text-slate-700">·</span>
                  <span className="font-sans text-zinc-500 dark:text-slate-400">
                    opened by{" "}
                    <span className="text-zinc-700 dark:text-slate-200 font-medium">
                      {issue.createdByEmail || "unknown"}
                    </span>
                  </span>
                </div>
              </div>

              {/* actions */}
              <div className="flex items-center gap-2.5 shrink-0 pt-0.5">
                {/* status pill */}
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                    isOpen
                      ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30"
                      : "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/30"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isOpen ? "bg-emerald-400" : "bg-violet-400"
                    }`}
                  />
                  {issue.status}
                </span>

                {/* toggle */}
                <button
                  onClick={onToggleStatus}
                  className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-zinc-700 dark:text-slate-200 hover:bg-zinc-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {isOpen ? "Close issue" : "Reopen"}
                </button>
              </div>
            </div>
            <div className="px-6 pb-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-slate-500">
                Description
              </p>

              <div className="text-[14px] text-zinc-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {issue.desc || (
                  <span className="italic text-zinc-400 dark:text-slate-500">
                    No description provided.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* comments */}
          <div className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-xl px-6 py-5 space-y-5 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
            <CommentSection
                isOpen={isOpen}
              comments={comments}
              loading={commentLoading}
              commentText={commentText}
              setCommentText={setCommentText}
              isPosting={isPostingComment}
              onPostComment={onPostComment}
            />

            {comments.length > 0 && (
              <div className="flex justify-center pt-1">
                <button
                  onClick={onLoadMoreComments}
                  disabled={!hasMoreComments || commentLoading}
                  className="text-[12px] font-medium px-4 py-1.5 rounded-lg border border-zinc-200 dark:border-slate-700 bg-zinc-50 dark:bg-slate-800 text-zinc-600 dark:text-slate-300 hover:bg-zinc-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {commentLoading
                    ? "Loading…"
                    : hasMoreComments
                      ? "Load more comments"
                      : "All comments loaded"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <div className="space-y-4 hidden md:block">
          <div className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.05)] overflow-hidden">
            {/* header */}
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-slate-800 bg-zinc-50 dark:bg-slate-800/40">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-slate-400">
                Details
              </p>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-slate-800">
              {/* opened by */}
              <div className="px-4 py-3">
                <p className="text-[11px] text-zinc-400 dark:text-slate-500 mb-1">
                  Opened by
                </p>
                <p className="text-[13px] font-medium text-zinc-800 dark:text-slate-200 break-all">
                  {issue.createdByEmail || "unknown"}
                </p>

                {issue.createdByRole && (
                  <span className="inline-flex mt-1.5 px-2 py-0.5 text-[11px] font-medium rounded-md bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/30">
                    {issue.createdByRole}
                  </span>
                )}
              </div>

              {/* status */}
              <div className="px-4 py-3">
                <p className="text-[11px] text-zinc-400 dark:text-slate-500 mb-1">
                  Status
                </p>
                <p
                  className={`text-[13px] font-semibold capitalize ${
                    isOpen ? "text-emerald-400" : "text-violet-400"
                  }`}
                >
                  {issue.status}
                </p>
              </div>

              {/* created */}
              <div className="px-4 py-3">
                <p className="text-[11px] text-zinc-400 dark:text-slate-500 mb-1">
                  Created
                </p>
                <p className="text-[13px] text-zinc-800 dark:text-slate-200">
                  {formatDate(issue.createdAt)}
                </p>
              </div>

              {/* resolved */}
              {issue.resolvedAt && issue.status === "resolved" && (
                <div className="px-4 py-3">
                  <p className="text-[11px] text-zinc-400 dark:text-slate-500 mb-1">
                    Resolved
                  </p>
                  <p className="text-[13px] text-zinc-800 dark:text-slate-200">
                    {formatDate(issue.resolvedAt)}
                  </p>
                </div>
              )}

              {/* comments */}
              <div className="px-4 py-3">
                <p className="text-[11px] text-zinc-400 dark:text-slate-500 mb-1">
                  Comments
                </p>
                <p className="text-[22px] font-bold text-zinc-900 dark:text-slate-100 leading-none">
                  {comments.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
