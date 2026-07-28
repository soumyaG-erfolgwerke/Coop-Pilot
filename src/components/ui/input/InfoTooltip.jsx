import React from "react";
import { Info } from "lucide-react";

export default function InfoTooltip({
  message,
  isDisabled = false,
  className = "",
  align = "right",
}) {
  if (!message || isDisabled) return null;

  const alignClasses =
    align === "right"
      ? "right-0 origin-bottom-right"
      : "left-0 origin-bottom-left";

  return (
    <div className={`items-center z-20 ${className}`}>
      <span className="relative inline-flex group">
        <button
          type="button"
          aria-label="Show field information"
          className="inline-flex items-center justify-center w-5 h-5 transition-colors rounded-full pointer-events-auto hover:bg-gray-100 dark:hover:bg-slate-800"
        >
          <Info className="w-4 h-4 text-gray-400 transition-colors duration-200 group-hover:text-blue-500 dark:text-gray-500 dark:group-hover:text-blue-400" />
        </button>
        <span
          className={`pointer-events-none absolute bottom-6 z-50 w-fit min-w-[300px] max-w-sm rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 border-l-4 border-l-blue-500 px-4 py-3 text-xs font-normal text-slate-700 dark:text-slate-300 shadow-xl transition-all duration-200 transform scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:scale-100 group-focus-within:pointer-events-auto whitespace-pre-wrap ${alignClasses}`}
        >
          {message}
        </span>
      </span>
    </div>
  );
}
