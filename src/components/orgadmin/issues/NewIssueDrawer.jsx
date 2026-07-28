import ResponsiveDrawer from "@/components/shared/ResponsiveDrawer";

export default function NewIssueDrawer({
  isOpen,
  onClose,
  form,
  setForm,
  creating,
  onSubmit,
}) {
  return (
    <ResponsiveDrawer isOpen={isOpen} onClose={onClose} title="Create New Issue">
      <div className="space-y-5 p-4 text-zinc-900">
        <div>
          <label className="block text-xs font-semibold text-zinc-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Issue Title
          </label>
          <input
            type="text"
            className="w-full border border-zinc-200 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 rounded-xl p-3 text-sm transition-all focus:outline-hidden placeholder-zinc-400 bg-zinc-50/50 dark:bg-slate-800/50"
            placeholder="Summarize the primary concern"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Detailed Description
          </label>
          <textarea
            className="w-full border border-zinc-200 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 rounded-xl p-3 text-sm h-36 resize-none transition-all focus:outline-hidden placeholder-zinc-400 bg-zinc-50/50 dark:bg-slate-800/50"
            placeholder="Provide architectural background, error tracking, or actionable audit findings..."
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </div>

        <div className="pt-2">
          <button
            onClick={onSubmit}
            disabled={creating || !form.title.trim()}
            className="w-full inline-flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white font-medium text-sm py-3 rounded-xl transition-colors shadow-sm dark:bg-slate-300 dark:hover:bg-slate-200/90 disabled:cursor-not-allowed dark:text-slate-900"
          >
            {creating ? "Creating Issue..." : "Publish Issue"}
          </button>
        </div>
      </div>
    </ResponsiveDrawer>
  );
}