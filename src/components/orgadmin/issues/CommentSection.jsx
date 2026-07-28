const formatDate = (d) =>
  new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// Generates a consistent pastel color from an email string
function avatarColor(str = "") {
  const colors = [
    "bg-sky-100 text-sky-700",
    "bg-violet-100 text-violet-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-teal-100 text-teal-700",
    "bg-indigo-100 text-indigo-700",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function initials(email = "") {
  const name = email.split("@")[0];
  const parts = name.split(/[._-]/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

export default function CommentSection({
  isOpen,
  comments,
  loading,
  commentText,
  setCommentText,
  isPosting,
  onPostComment,
}) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
          Comments
        </p>
        {comments.length > 0 && (
          <span className="text-[11px] font-semibold bg-zinc-100 text-zinc-500 dark:bg-slate-700 dark:text-slate-400 px-1.5 py-0.5 rounded-full leading-none">
            {comments.length}
          </span>
        )}
      </div>

      {/* Comment list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-[72px] bg-zinc-100 dark:bg-slate-700 animate-pulse rounded-lg"
            />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-[13px] text-zinc-400 dark:text-slate-400 italic">
            No comments yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => {
            const avatarCls = avatarColor(c.authorEmail);
            return (
              <div key={c.id} className="flex gap-3 group">
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${avatarCls}`}
                >
                  {initials(c.authorEmail)}
                </div>

                {/* Bubble */}
                <div className="flex-1 min-w-0 rounded-xl border border-zinc-200 dark:border-slate-600 overflow-hidden bg-white dark:bg-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] group-hover:border-zinc-300 dark:group-hover:border-slate-500 transition-colors">
                  {/* Meta bar */}
                  <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-50/80 border-b border-zinc-100 dark:border-slate-600 dark:bg-slate-700/50">
                    <span className="text-[12px] font-semibold text-zinc-700 dark:text-slate-300 truncate">
                      {c.authorEmail}
                    </span>
                    <span className="text-[11px] text-zinc-400 dark:text-slate-400 shrink-0 ml-2 tabular-nums">
                      {formatDate(c.createdAt)}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="px-3.5 py-2.5 text-[13px] text-zinc-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {c.message}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Composer */}
      <div className="pt-1">
        {isOpen ? (
          <div className="rounded-xl border border-zinc-300 dark:border-slate-600 bg-white dark:bg-slate-800 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)] focus-within:border-zinc-400 dark:focus-within:border-slate-500 focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.05)] transition-all">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={4}
              className="w-full p-4 text-[13px] text-zinc-800 dark:text-slate-300 placeholder:text-zinc-400 dark:placeholder:text-slate-400 resize-none outline-none bg-transparent leading-relaxed"
              placeholder="Leave a comment…"
            />
            <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-zinc-100 dark:border-slate-600 bg-zinc-50/60 dark:bg-slate-700/50">
              <span className="text-[11px] text-zinc-400 dark:text-slate-400">
                {commentText.length > 0 ? `${commentText.length} chars` : ""}
              </span>
              <button
                onClick={onPostComment}
                disabled={isPosting || !commentText.trim()}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-4 py-1.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.12)] dark:bg-white dark:text-zinc-900 dark:hover:bg-slate-300"
              >
                {isPosting ? "Posting…" : "Comment"}
              </button>
            </div>
          </div>
        ) : (
          <div className="">
            <p className="text-sm font-medium text-zinc-500 italic">
              This issue is closed. Reopen to leave a comment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
