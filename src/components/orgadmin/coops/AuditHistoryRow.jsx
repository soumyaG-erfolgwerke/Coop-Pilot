import React, { useState } from "react";
import { ExternalLink } from "lucide-react";
import { StatusBadge } from "./CoopHistory";
import Link from "next/link";

const EXCLUDED_KEYS = new Set([
  "fieldId",
  "phaseId",
  "validation",
  "options",
  "settings",
  "helperText",
  "required",
  "allowOther",
  "wasVisible",
]);

const isUrl = (value) =>
  typeof value === "string" && /^https?:\/\/.+/i.test(value);

const isDateString = (value) => {
  if (typeof value !== "string") return false;

  if (value === "0001-01-01") return false;

  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return false;

  const d = new Date(value);

  return !Number.isNaN(d.getTime());
};

const formatLabel = (str = "") =>
  str
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

export const renderValue = (val) => {
  if (val === undefined || val === null || val === "") {
    return "-";
  }

  if (isUrl(val)) {
    return (
      <a
        href={val}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline"
      >
        Open File <ExternalLink size={12} />
      </a>
    );
  }

  if (isDateString(val)) {
    return new Date(val).toLocaleString();
  }

  if (typeof val === "boolean") {
    return val ? "Yes" : "No";
  }

  if (
    typeof val === "string" &&
    ["yes", "no", "true", "false"].includes(val.toLowerCase())
  ) {
    return val.charAt(0).toUpperCase() + val.slice(1);
  }

  return String(val);
};

const getFieldPriority = (value, label = "") => {
  const key = label.toLowerCase();

  if (isUrl(value)) return 100;

  if (
    key.includes("file") ||
    key.includes("document") ||
    key.includes("attachment") ||
    key.includes("link") ||
    key.includes("url")
  ) {
    return 95;
  }

  if (isDateString(value)) return 90;

  if (
    typeof value === "boolean" ||
    (typeof value === "string" &&
      ["yes", "no", "true", "false"].includes(value.toLowerCase()))
  ) {
    return 80;
  }

  if (typeof value === "string" && value.length > 0) {
    return 50;
  }

  return 10;
};

export const collectSummaryFields = (obj, path = "", results = []) => {
  if (obj === null || obj === undefined) {
    return results;
  }

  if (Array.isArray(obj)) {
    if (obj.length && obj.every((v) => typeof v !== "object" || v === null)) {
      results.push({
        path,
        label: formatLabel(path.split(".").pop()) || "Items",
        value: obj.join(", "),
      });
    }

    obj.forEach((item, i) =>
      collectSummaryFields(item, `${path}[${i}]`, results),
    );

    return results;
  }

  if (typeof obj !== "object") {
    return results;
  }

  Object.entries(obj).forEach(([key, value]) => {
    if (EXCLUDED_KEYS.has(key) || key === "phases") {
      return;
    }

    if (value === null || value === undefined || value === "") {
      return;
    }

    const currentPath = path ? `${path}.${key}` : key;

    if (typeof value !== "object") {
      results.push({
        path: currentPath,
        label: formatLabel(key),
        value,
        priority: getFieldPriority(value, key),
      });

      return;
    }

    collectSummaryFields(value, currentPath, results);
  });

  return results;
};

export const getAuditSummary = (audit) => {
  const fields = collectSummaryFields(audit);

  const unique = new Map();

  fields.forEach((field) => {
    const id = `${field.label}-${field.value}`;

    if (!unique.has(id)) {
      unique.set(id, field);
    }
  });

  const allFields = Array.from(unique.values()).sort(
    (a, b) => (b.priority || 0) - (a.priority || 0),
  );

  return {
    fileFields: allFields.filter((f) => isUrl(f.value)),

    dateFields: allFields.filter((f) => isDateString(f.value)),

    normalFields: allFields.filter(
      (f) => !isUrl(f.value) && !isDateString(f.value),
    ),

    allFields,
  };
};

const highlightText = (text, query) => {
  if (!query || !text || text === "-") return text;
  const parts = text.split(new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, "gi"));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-250 font-semibold px-0.5 rounded animate-pulse">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

export const AuditHistoryRow = ({ entry, coopId, searchQuery }) => {
  const [open, setOpen] = useState(false);
  const [showAllExtra, setShowAllExtra] = useState(false);

  const audit = entry?.auditJson || {};

  const phases = audit?.phases || [];
  const totalPhases = phases.length;

  const phaseStats = phases.map((phase) => {
    const fields = phase?.fields || [];

    const answeredFields = fields.filter((field) => {
      const value = field?.answer;

      if (value === undefined || value === null || value === "") {
        return false;
      }

      if (Array.isArray(value) && value.length === 0) {
        return false;
      }

      return true;
    }).length;

    return {
      title: phase.title || "Untitled Phase",
      totalFields: fields.length,
      answeredFields,
      completion:
        fields.length > 0
          ? Math.round((answeredFields / fields.length) * 100)
          : 0,
    };
  });

  const totalFields = phaseStats.reduce((sum, p) => sum + p.totalFields, 0);

  const completedFields = phaseStats.reduce(
    (sum, p) => sum + p.answeredFields,
    0,
  );

  const overallCompletion =
    totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

  return (
    <>
      <tr
        className={`px-3 text-center transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/60 dark:border-slate-800 ${open ? "" : "border-b"}`}
      >
        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
          {new Date(entry.createdAt).toLocaleString()}
        </td>

        <td className="text-center">
          <StatusBadge status={entry.status} />
        </td>

        <td className="text-sm text-slate-700 dark:text-slate-300">
          {highlightText(audit?.submittedBy || "-", searchQuery)}
        </td>
        <td className="text-sm text-slate-600 dark:text-slate-400">
          {entry.deadline ? new Date(entry.deadline).toLocaleDateString() : "-"}
        </td>
        <td className="text-sm text-slate-600 dark:text-slate-400">
          {entry.createdAt
            ? new Date(entry.createdAt).toLocaleDateString()
            : "-"}
        </td>

        <td className="text-center">
          <button
            onClick={() => setOpen(!open)}
            className="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline"
          >
            {open ? "Hide Details" : "View Details"}
          </button>
        </td>
      </tr>

      {open && (
        <tr className="">
          <td colSpan={8} className="p-2 text-sm">
            {(() => {
              const { fileFields, allFields } = getAuditSummary(audit);

              // Keys that are manually addressed within the layout to avoid duplicates
              const handledKeys = new Set([
                "cooperativeName",
                "cooperativeId",
                "submittedBy",
                "lastModified",
                "completedAt",
                "title",
                "description",
                "checklist",
                "documentChecks",
                "phases",
              ]);

              // Filter out handled keys, file endpoints, and values that are too long (> 140 chars)
              const extraFields = allFields.filter((f) => {
                const topKey = f.path ? f.path.split(".")[0] : "";
                if (
                  handledKeys.has(topKey) ||
                  handledKeys.has(f.label) ||
                  isUrl(f.value)
                ) {
                  return false;
                }
                return String(f.value).length <= 140;
              });

              const visibleFields = showAllExtra
                ? extraFields
                : extraFields.slice(0, 10);

              // Combine default static details with the remaining dynamically caught fields
              const sidebarItems = [
                { label: "Cooperative", val: audit?.cooperativeName },
                { label: "Cooperative ID", val: audit?.cooperativeId },
                { label: "Submitted By", val: audit?.submittedBy },
                { label: "Last Modified", val: audit?.lastModified },
                { label: "Completed At", val: audit?.completedAt },
              ];

              return (
                <div className="p-6 space-y-6 bg-white border shadow-sm border-slate-200/70 rounded-xl dark:bg-slate-950 dark:border-slate-800/80">
                  {/* ================= HEADER ACTION PANEL ================= */}
                  <div className="flex flex-col items-start justify-between gap-4 pb-5 border-b sm:flex-row border-slate-100 dark:border-slate-800/60">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold tracking-wider text-indigo-600 uppercase dark:text-indigo-400">
                          {entry?.auditType || "Audit Overview"}
                        </span>
                      </div>
                      <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                        {audit?.title || "Untitled Report"}
                      </h3>
                      {audit?.description && (
                        <p className="max-w-3xl mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                          {audit.description}
                        </p>
                      )}
                    </div>

                    <Link
                      href={`/audit/${coopId}/${entry.id}?review=false`}
                      className="w-full sm:w-auto shrink-0"
                    >
                      <button className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 active:scale-[0.98] shadow-sm dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200">
                        <ExternalLink size={15} />
                        Go to Audit
                      </button>
                    </Link>
                  </div>

                  {/* ================= MAIN METRIC & INFO GRID ================= */}
                  <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left & Middle: Trackers & Summary */}
                    <div className="space-y-6 lg:col-span-2">
                      {/* Metric Blocks */}
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="p-3.5 border border-slate-100 rounded-xl bg-slate-50/50 dark:border-slate-800/40 dark:bg-slate-900/30">
                          <div className="text-xs font-medium text-slate-400 dark:text-slate-500">
                            Total Phases
                          </div>
                          <div className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {totalPhases}
                          </div>
                        </div>

                        <div className="p-3.5 border border-slate-100 rounded-xl bg-slate-50/50 dark:border-slate-800/40 dark:bg-slate-900/30">
                          <div className="text-xs font-medium text-slate-400 dark:text-slate-500">
                            Total Fields
                          </div>
                          <div className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {totalFields}
                          </div>
                        </div>

                        <div className="p-3.5 border border-slate-100 rounded-xl bg-slate-50/50 dark:border-slate-800/40 dark:bg-slate-900/30">
                          <div className="text-xs font-medium text-slate-400 dark:text-slate-500">
                            Completed
                          </div>
                          <div className="mt-1 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                            {completedFields}
                          </div>
                        </div>

                        <div className="p-3.5 border border-slate-100 rounded-xl bg-slate-50/50 dark:border-slate-800/40 dark:bg-slate-900/30">
                          <div className="text-xs font-medium text-slate-400 dark:text-slate-500">
                            Completion
                          </div>
                          <div className="mt-1 text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
                            {overallCompletion}%
                          </div>
                        </div>
                      </div>

                      {/* Unified Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                          <span>Overall Progress</span>
                          <span>
                            {completedFields} / {totalFields} Fields
                          </span>
                        </div>
                        <div className="w-full h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full transition-all duration-300 bg-indigo-600 dark:bg-indigo-500"
                            style={{ width: `${overallCompletion}%` }}
                          />
                        </div>
                      </div>

                      {/* Phase Summary list */}
                      <div>
                        <h4 className="mb-3 text-xs font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                          Phase Breakdown
                        </h4>
                        <div className="">
                          {phaseStats.length === 0 && (
                            <div className="p-3.5 text-sm text-slate-500 dark:text-slate-400">
                              No phases available.
                            </div>
                          )}
                        </div>
                        {phaseStats.length > 0 && (
                          <div className="bg-white border divide-y divide-slate-100 rounded-xl border-slate-100 dark:divide-slate-800/40 dark:border-slate-800/60 dark:bg-transparent">
                            {phaseStats.map((phase, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-3.5 transition-colors hover:bg-slate-50/40 dark:hover:bg-slate-900/20"
                              >
                                <div>
                                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                                    {phase.title}
                                  </div>
                                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                    {phase.answeredFields} of{" "}
                                    {phase.totalFields} elements completed
                                  </div>
                                </div>
                                <div
                                  className={`text-sm font-bold ${
                                    phase.completion === 100
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-indigo-600 dark:text-indigo-400"
                                  }`}
                                >
                                  {phase.completion}%
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Extra Fields */}
                      {extraFields.length > 0 && (
                        <h4 className="mb-3 text-xs font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                          More Information
                        </h4>
                      )}
                      <div className="grid grid-cols-4">
                        {visibleFields.map((field, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 border border-slate-100 rounded-lg bg-slate-50/50 dark:border-slate-800/40 dark:bg-slate-900/30"
                          >
                            <div className="text-xs font-medium text-slate-400 dark:text-slate-500">
                              {field.label}
                            </div>
                            <div
                              className="mt-1 text-sm font-semibold truncate text-slate-800 dark:text-slate-200"
                              title={String(field.value)}
                            >
                              {renderValue(field.value)}
                            </div>
                          </div>
                        ))}
                        {!showAllExtra && extraFields.length > 10 && (
                          <button
                            onClick={() => setShowAllExtra(true)}
                            className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
                          >
                            See More ({extraFields.length - 10} more)
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right Block: Audit Information Sidebar */}
                    <div className="h-full p-5 border rounded-xl border-slate-100 bg-slate-50/30 dark:border-slate-800/50 dark:bg-slate-900/20">
                      <h4 className="mb-4 text-xs font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                        Audit Information
                      </h4>

                      <div className="space-y-3.5">
                        {sidebarItems.map((item, i) => (
                          <div
                            key={i}
                            className="flex flex-col pb-2 border-b border-slate-100 dark:border-slate-800/40 last:border-0 last:pb-0"
                          >
                            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                              {item.label}
                            </span>
                            <span
                              className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200 truncate"
                              title={
                                typeof item.val === "string"
                                  ? item.val
                                  : undefined
                              }
                            >
                              {renderValue(item.val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ================= COMPLEMENTARY METADATA BLOCK (FILES & CHECKS) ================= */}
                  {(fileFields.length > 0 ||
                    audit?.checklist?.length > 0 ||
                    audit?.documentChecks?.length > 0) && (
                    <div className="grid gap-4 pt-5 border-t border-slate-100 dark:border-slate-800/60 md:grid-cols-3">
                      {/* Files & Links */}
                      {fileFields.length > 0 && (
                        <div className="p-4 bg-white border rounded-xl border-slate-100 dark:border-slate-800/60 dark:bg-transparent">
                          <h4 className="mb-3 text-xs font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                            Attached Files & Links
                          </h4>
                          <div className="space-y-2.5">
                            {fileFields.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between py-1 text-sm border-b border-slate-50 dark:border-slate-900 last:border-0"
                              >
                                <span className="font-medium text-slate-500 dark:text-slate-400">
                                  {file.label}:
                                </span>
                                <span className="font-semibold">
                                  {renderValue(file.value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Checklist */}
                      {audit?.checklist?.length > 0 && (
                        <div className="p-4 bg-white border rounded-xl border-slate-100 dark:border-slate-800/60 dark:bg-transparent">
                          <h4 className="mb-3 text-xs font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                            Checklist Logs
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {audit.checklist.map((item, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Document Checks */}
                      {audit?.documentChecks?.length > 0 && (
                        <div className="p-4 bg-white border rounded-xl border-slate-100 dark:border-slate-800/60 dark:bg-transparent">
                          <h4 className="mb-3 text-xs font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                            Verified Document Checks
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {audit.documentChecks.map((item, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-700 rounded-md bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </td>
        </tr>
      )}
    </>
  );
};
