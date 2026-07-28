export default function IssueSkeleton({ type = "list" }) {
  if (type === "detail") {
    return (
      <div className="min-h-screen bg-[#f4f5f7] dark:bg-slate-800 animate-pulse">
        {/* Nav bar */}
        <div className="bg-white dark:bg-slate-700 dark:border-zinc-600 border-b border-zinc-200 h-12" />

        <div className="max-w-6xl mx-auto px-6 py-7 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
          {/* Main */}
          <div className="space-y-4">
            <div className="bg-white border border-zinc-200 dark:border-zinc-600 dark:bg-slate-700 rounded-xl overflow-hidden">
              <div className="h-[3px] bg-zinc-200 dark:bg-zinc-600" />
              <div className="px-6 py-5 space-y-3">
                <div className="h-5 w-2/5 bg-zinc-200 dark:bg-zinc-600 rounded" />
                <div className="h-3 w-1/3 bg-zinc-100 dark:bg-zinc-500 rounded" />
              </div>
            </div>
            <div className="bg-white border border-zinc-200 dark:border-zinc-600 dark:bg-slate-700 rounded-xl px-6 py-5 space-y-3">
              <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-600 rounded" />
              <div className="h-20 bg-zinc-100 dark:bg-zinc-500 rounded-lg" />
            </div>
            <div className="bg-white border border-zinc-200 dark:border-zinc-600 dark:bg-slate-700 rounded-xl px-6 py-5 space-y-4">
              <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-600 rounded" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-600 shrink-0" />
                  <div className="flex-1 h-16 bg-zinc-100 dark:bg-zinc-500 rounded-xl" />
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="bg-white border border-zinc-200 dark:border-zinc-600 dark:bg-slate-700 rounded-xl overflow-hidden">
              <div className="h-10 bg-zinc-50 border-b border-zinc-100" />
              <div className="divide-y divide-zinc-100">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="px-4 py-3 space-y-1.5">
                    <div className="h-2.5 w-16 bg-zinc-100 dark:bg-zinc-500 rounded" />
                    <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-600 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List skeleton
  return (
    <div className="min-h-screen bg-[#f4f5f7] dark:bg-slate-800 animate-pulse">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex justify-between items-end mb-7">
          <div className="space-y-2">
            <div className="h-6 w-28 bg-zinc-300 rounded" />
            <div className="h-3 w-40 bg-zinc-200 dark:bg-zinc-600 rounded" />
          </div>
          <div className="h-9 w-28 bg-zinc-300 rounded-lg" />
        </div>

        <div className="bg-white border border-zinc-200 dark:border-zinc-600 dark:bg-slate-700 rounded-xl overflow-hidden">
          <div className="h-10 bg-zinc-50 dark:bg-slate-600 border-b border-zinc-100 dark:border-zinc-500" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-start gap-4 px-5 py-4 border-b border-zinc-100 dark:border-zinc-500">
              <div className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-600 mt-0.5 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/5 bg-zinc-200 dark:bg-zinc-600 rounded" />
                <div className="h-3 w-1/3 bg-zinc-100 dark:bg-zinc-500 rounded" />
              </div>
              <div className="h-4 w-8 bg-zinc-100 dark:bg-zinc-500 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}