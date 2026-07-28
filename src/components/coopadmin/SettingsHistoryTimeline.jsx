"use client";

import React, { useEffect, useMemo, useState } from "react";
import { SETTINGS_LABELS } from "@/lib/cooperativeSettingsSchema";

const FIELD_LABELS = SETTINGS_LABELS.en;
const INITIAL_VISIBLE_LOGS = 3;

function formatFieldName(field) {
  return FIELD_LABELS[field] || String(field || "Field").replaceAll("_", " ");
}

function extractChangedFields(entry) {
  if (Array.isArray(entry.changed_fields) && entry.changed_fields.length > 0) {
    return entry.changed_fields;
  }

  return String(entry.changed_field || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "(empty)";
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  try {
    const parsed = JSON.parse(value);
    if (parsed === null || parsed === "") return "(empty)";
    if (typeof parsed === "number" || typeof parsed === "boolean")
      return String(parsed);
    if (typeof parsed === "string") return parsed;
    return JSON.stringify(parsed);
  } catch {
    return String(value);
  }
}

function getRelativeTime(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "unknown time";

  const diffMs = date.getTime() - Date.now();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffMs) < minute) {
    return rtf.format(0, "second");
  }

  if (Math.abs(diffMs) < hour) {
    return rtf.format(Math.round(diffMs / minute), "minute");
  }

  if (Math.abs(diffMs) < day) {
    return rtf.format(Math.round(diffMs / hour), "hour");
  }

  if (Math.abs(diffMs) < week) {
    return rtf.format(Math.round(diffMs / day), "day");
  }

  return rtf.format(Math.round(diffMs / week), "week");
}

function actorName(entry) {
  return entry.changed_by_email || entry.changed_by || "Unknown user";
}

function parseJsonSafely(value) {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function isUrl(str) {
  if (typeof str !== "string") return false;
  return str.startsWith("http://") || str.startsWith("https://");
}

function isImageUrlField(field) {
  return field === "logo" || field === "bannerUrl" || field === "logoUrl";
}

function getEntryFieldChanges(entry) {
  const fields = extractChangedFields(entry);
  const oldParsed = parseJsonSafely(entry.old_value);
  const newParsed = parseJsonSafely(entry.new_value);

  return fields.map((field) => {
    const oldValue =
      oldParsed && typeof oldParsed === "object" && !Array.isArray(oldParsed)
        ? oldParsed[field]
        : oldParsed;
    const newValue =
      newParsed && typeof newParsed === "object" && !Array.isArray(newParsed)
        ? newParsed[field]
        : newParsed;

    return {
      field,
      oldValue: oldValue ?? null,
      newValue: newValue ?? null,
    };
  });
}

export default function SettingsHistoryTimeline({
  history = [],
  isLoading = false,
  error = "",
}) {
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_LOGS);

  const historyIdList = useMemo(() => {
    return (history || []).map((entry) => entry.id).join(",");
  }, [history]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_LOGS);
  }, [historyIdList]);

  const visibleHistory = useMemo(
    () => (history || []).slice(0, visibleCount),
    [history, visibleCount]
  );

  const selectedEntryChanges = useMemo(() => {
    if (!selectedEntry) return [];
    return getEntryFieldChanges(selectedEntry);
  }, [selectedEntry]);

  return (
    <>
      <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl dark:bg-slate-800 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Activity
        </h3>

        {isLoading && (
          <div className="mt-4 space-y-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="relative pl-4 flex flex-col gap-2">
                <span className="absolute left-[3px] w-2 h-2 bg-gray-200 dark:bg-slate-700 rounded-full top-[16px]" />
                <div className="flex flex-col gap-1.5 px-3 py-2">
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/5" />
                  <div className="h-3 bg-gray-150 dark:bg-slate-700/70 rounded w-3/5 mt-1" />
                  <div className="h-3.5 bg-blue-100/50 dark:bg-blue-900/10 rounded w-16 mt-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-300">{error}</p>
        )}

        {!isLoading && !error && history.length === 0 && (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            No settings history yet.
          </p>
        )}

        {!isLoading && !error && history.length > 0 && (
          <div className="max-h-[350px] overflow-y-auto pr-2 mt-4 scrollbar-thin">
            <ul className="space-y-5">
              {visibleHistory.map((entry, index) => {
                const changedFields = extractChangedFields(entry);
                const total = changedFields.length;

                return (
                  <li key={entry.id} className="relative pl-4">
                    <span className="absolute left-0 w-2 h-2 bg-gray-400 rounded-full top-[14px] dark:bg-gray-500" />
                    {index < visibleHistory.length - 1 && (
                      <span className="absolute left-[3.4px] top-[22px] bottom-[-35px] w-px bg-gray-200 dark:bg-slate-600" />
                    )}

                    <div
                      // type="button"
                      className="flex flex-col items-start w-full gap-1 px-3 py-2 text-left rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-50 dark:hover:bg-slate-700/30"
                    >
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        <span className="font-medium">{actorName(entry)}</span>{" "}
                        updated
                        <span className="font-medium">
                          {" "}
                          {total} field{total === 1 ? "" : "s"}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {getRelativeTime(entry.changed_at)}
                        {entry.change_reason ? ` · ${entry.change_reason}` : ""}
                      </p>
                      <p
                        className="mt-1 text-xs font-medium text-blue-600 cursor-pointer dark:text-blue-300 hover:underline hover:text-blue-900 dark:hover:text-blue-500"
                        onClick={() => setSelectedEntry(entry)}
                      >
                        View details
                      </p>
                    </div>
                  </li>
                );
              })}

              <li className="flex items-center gap-2 pl-6 pb-2">
                {visibleCount < history.length && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + INITIAL_VISIBLE_LOGS)}
                    className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700"
                  >
                    Load more ({history.length - visibleCount} remaining)
                  </button>
                )}

                {visibleCount > INITIAL_VISIBLE_LOGS && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount(INITIAL_VISIBLE_LOGS)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-200 dark:border-slate-600"
                  >
                    Show less
                  </button>
                )}
              </li>
            </ul>
          </div>
        )}
      </div>

      {selectedEntry && (
        <div
          className="fixed inset-0 flex justify-end z-5000 bg-black/50 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="flex flex-col w-full h-full max-w-xl bg-white shadow-2xl dark:bg-slate-800"
            style={{ animation: "drawerSlideIn 220ms ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Change Details
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">{actorName(selectedEntry)}</span>{" "}
                updated {selectedEntryChanges.length} field
                {selectedEntryChanges.length === 1 ? "" : "s"}{" "}
                {getRelativeTime(selectedEntry.changed_at)}
              </p>
              {selectedEntry.change_reason && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Reason: {selectedEntry.change_reason}
                </p>
              )}
            </div>

            <div className="p-6 space-y-3 overflow-y-auto">
              {selectedEntryChanges.map((change) => (
                <div
                  key={`${selectedEntry.id}-${change.field}`}
                  className="p-3 border border-gray-200 rounded-lg bg-gray-50 dark:bg-slate-700/30 dark:border-slate-600"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatFieldName(change.field)}
                  </p>
                  {isImageUrlField(change.field) || isUrl(change.oldValue) || isUrl(change.newValue) ? (
                    <div className="mt-2 flex items-center gap-4 text-xs">
                      <div className="flex flex-col items-center gap-1.5 p-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 w-1/2">
                        <span className="text-[10px] text-gray-400 uppercase font-bold">Old</span>
                        {change.oldValue && change.oldValue !== "" && change.oldValue !== "(empty)" ? (
                          <img 
                            src={change.oldValue} 
                            alt="Old preview" 
                            className="h-16 w-full object-contain bg-gray-50 dark:bg-slate-900 rounded border dark:border-slate-700" 
                          />
                        ) : (
                          <span className="text-gray-400 h-16 flex items-center justify-center italic text-[11px]">(empty)</span>
                        )}
                      </div>
                      <span className="text-gray-400 font-bold shrink-0">→</span>
                      <div className="flex flex-col items-center gap-1.5 p-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 w-1/2">
                        <span className="text-[10px] text-gray-400 uppercase font-bold">New</span>
                        {change.newValue && change.newValue !== "" && change.newValue !== "(empty)" ? (
                          <img 
                            src={change.newValue} 
                            alt="New preview" 
                            className="h-16 w-full object-contain bg-gray-50 dark:bg-slate-900 rounded border dark:border-slate-700" 
                          />
                        ) : (
                          <span className="text-gray-400 h-16 flex items-center justify-center italic text-[11px]">(empty)</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 break-all">
                      {formatValue(change.oldValue)} <span className="text-gray-400 font-bold px-1">→</span> {formatValue(change.newValue)}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 p-4 mt-auto border-t border-gray-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg dark:bg-slate-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes drawerSlideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0%);
          }
        }
      `}</style>
    </>
  );
}
