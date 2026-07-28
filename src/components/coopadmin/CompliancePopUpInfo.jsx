import { AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export const CompliancePopUpInfo = (detailsOrProps) => {
  // Support both direct function call (details) and JSX component (<CompliancePopUpInfo details={...} />)
  const details = Array.isArray(detailsOrProps)
    ? detailsOrProps
    : detailsOrProps?.details;

  if (!details || details.length === 0) {
    return (
      <div className="p-4 text-xs text-center text-gray-500 dark:text-gray-400">
        No compliance details available.
      </div>
    );
  }

  const passedCount = details.filter((item) => item.result).length;

  const sortedDetails = [...details].sort((a, b) => {
    const aPassed = !!a.result;
    const bPassed = !!b.result;
    if (aPassed === bPassed) return 0;
    return aPassed ? 1 : -1;
  });

  return (
    <div className="p-4">
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100 rounded-lg dark:bg-slate-900 dark:border-slate-800">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
          Compliance Checklist
        </h4>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${passedCount === details.length ? "bg-emerald-100 dark:bg-emerald-950/10 text-emerald-950 dark:text-emerald-100" : "bg-amber-50/30 dark:bg-amber-950/10 text-amber-950 dark:text-amber-100"}`}
        >
          {passedCount} / {details.length} Passed
        </span>
      </div>
      <div className="p-2 space-y-3 max-h-[380px] overflow-y-auto custom-scrollbar">
        <div className="space-y-2">
          {sortedDetails.map((item, index) => {
            const isPassed = item.result;
            return (
              <div
                key={index}
                className={`p-3 rounded-xl border text-left flex items-start justify-between gap-3 transition-all duration-200 ${
                  isPassed
                    ? "bg-emerald-50/30 border-emerald-100/60 text-emerald-950 dark:bg-emerald-950/10 dark:border-emerald-900/20 dark:text-emerald-100"
                    : "bg-amber-50/30 border-amber-100/60 text-amber-950 dark:bg-amber-950/10 dark:border-amber-900/20 dark:text-amber-100"
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {isPassed ? (
                      <CheckCircle2
                        size={15}
                        className="text-emerald-600 dark:text-emerald-400"
                      />
                    ) : (
                      <AlertTriangle
                        size={15}
                        className="text-amber-600 dark:text-amber-400"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold leading-snug capitalize truncate">
                      {item?.text || item?.name}
                    </p>
                    {/* <p className="text-[10px] mt-0.5 text-gray-500 dark:text-gray-400 normal-case leading-normal">
                      {isPassed
                        ? "Requirement met successfully"
                        : "Requires attention or update"}
                    </p> */}
                  </div>
                </div>

                {!isPassed && item.actionUrl && (
                  <div className="self-center shrink-0">
                    <Link
                      href={item.actionUrl}
                      rel="noopener noreferrer"
                      className="group inline-flex px-1.5 items-center gap-1 text-[11px] font-semibold hover:bg-amber-200/80 dark:hover:bg-amber-500/30 text-amber-900 dark:text-amber-300 rounded-lg transition-all"
                    >
                      <span>Fix</span>
                      <ArrowRight
                        size={10}
                        className="transition-all duration-300 ease-in-out group-hover:translate-x-0.5"
                      />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
