"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  History,
  Eye,
  Plus,
  Edit,
  Loader2,
  AlertCircle,
  CheckCircle,
  Search,
  X,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";
import UserName from "@/components/userComponent/UserName";
import UserEmail from "@/components/userComponent/UserEmail";

export default function AuditReports({ auditOrgId, coop }) {
  const router = useRouter();
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  // Keyboard shortcut listener (/ or Ctrl+K to search, Escape to blur)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isEditable =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.isContentEditable;

      if (
        ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") &&
        !isEditable
      ) {
        if (document.activeElement !== searchInputRef.current) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
      if (e.key === "Escape") {
        if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Load audit history list
  const loadPastReports = async () => {
    if (!coop?.id) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/auditServices/auditHistory/${coop.id}`);
      const result = await res.json();
      if (result.success) {
        setHistoryList(result.documents || []);
      } else {
        toast.error("Failed to load audit reports history.");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred while loading audit reports history.");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadPastReports();
  }, [coop?.id]);

  const latestAudit = historyList.length > 0 ? historyList[0] : null;

  let headerAction = null;
  if (latestAudit) {
    const rawData = latestAudit.rawReportData;
    const url = latestAudit.auditReportUrl;
    const hasRawData =
      rawData && typeof rawData === "string" && rawData.trim() !== "";
    const hasUrl = url && typeof url === "string" && url.trim() !== "";
    const isLatestApprovedOrRejected =
      latestAudit.status === "APPROVED" || latestAudit.status === "REJECTED";

    if (hasRawData && hasUrl) {
      headerAction = (
        <button
          disabled
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold border rounded-lg cursor-default select-none bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400"
        >
          <CheckCircle size={15} />
          Report Generated
        </button>
      );
    } else if (!isLatestApprovedOrRejected) {
      const buttonText =
        !hasRawData && !hasUrl ? "Create Report" : "Edit Report";
      const ButtonIcon = !hasRawData && !hasUrl ? Plus : Edit;
      headerAction = (
        <div className="relative inline-block group">
          <button
            disabled
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all border rounded-lg shadow-sm cursor-not-allowed select-none text-slate-400 dark:text-slate-500 bg-slate-105 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          >
            <ButtonIcon size={15} />
            {buttonText}
          </button>
          <div className="absolute right-0 z-50 w-64 p-2 mb-2 text-xs text-center text-white transition-opacity rounded-lg shadow-md opacity-0 pointer-events-none bottom-full bg-slate-900 dark:bg-slate-800 dark:text-slate-200 group-hover:opacity-100">
            Audit report can only be managed for APPROVED or REJECTED audits.
          </div>
        </div>
      );
    } else if (!hasRawData && !hasUrl) {
      headerAction = (
        <button
          onClick={() =>
            router.push(`/audit/report/${coop.id}/${latestAudit.id}`)
          }
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-all bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 active:scale-95"
        >
          <Plus size={15} />
          Create Report
        </button>
      );
    } else if (hasRawData && !hasUrl) {
      headerAction = (
        <button
          onClick={() =>
            router.push(`/audit/report/${coop.id}/${latestAudit.id}`)
          }
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-all bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 active:scale-95"
        >
          <Edit size={15} />
          Edit Report
        </button>
      );
    } else {
      headerAction = (
        <button
          onClick={() =>
            router.push(`/audit/report/${coop.id}/${latestAudit.id}`)
          }
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-all rounded-lg shadow-sm bg-indigo-650 hover:bg-indigo-750 dark:bg-indigo-500 dark:hover:bg-indigo-600 active:scale-95"
        >
          <Edit size={15} />
          Edit Report
        </button>
      );
    }
  }

  const filteredReports = historyList.filter((report) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();

    // 1. Auditor Name
    const nameMatch = (report.auditorName || "").toLowerCase().includes(query);

    // 2. Auditor Email
    const emailMatch = (report.auditorEmail || "")
      .toLowerCase()
      .includes(query);

    // 3. Formatted Date
    let dateStr = "";
    if (report.createdAt) {
      dateStr = new Date(report.createdAt).toLocaleDateString("de-DE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    const dateMatch = dateStr.toLowerCase().includes(query);

    // 4. Status (badge text)
    const itemRawData =
      report.rawReportData &&
      typeof report.rawReportData === "string" &&
      report.rawReportData.trim() !== "";
    const itemUrl =
      report.auditReportUrl &&
      typeof report.auditReportUrl === "string" &&
      report.auditReportUrl.trim() !== "";

    let statusText = "not started";
    if (itemRawData && itemUrl) {
      statusText = "generated";
    } else if (itemRawData && !itemUrl) {
      statusText = "draft";
    }
    const statusMatch = statusText.includes(query);

    // 5. Audit status
    const auditStatusMatch = (report.status || "")
      .toLowerCase()
      .includes(query);

    return (
      nameMatch || emailMatch || dateMatch || statusMatch || auditStatusMatch
    );
  });

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Search and Action controls container */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Modern Search bar with Keyboard Shortcut Hint (matching member directory reference exactly) */}
        <div className="relative flex-grow max-w-md">
          <Search className="absolute w-4.5 h-4.5 text-slate-400 dark:text-slate-500 -translate-y-1/2 left-3.5 top-1/2 transition-colors pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-2 pr-16 text-sm transition-all border shadow-sm pl-11 border-slate-200 dark:border-slate-700 rounded-xl bg-white/80 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:ring-indigo-500/20"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none select-none">
            {searchQuery ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery("");
                }}
                className="pointer-events-auto text-slate-400 hover:text-slate-655 dark:hover:text-slate-300 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={14} />
              </button>
            ) : (
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
                /
              </span>
            )}
          </div>
        </div>

        {headerAction && (
          <div className="flex justify-end shrink-0">{headerAction}</div>
        )}
      </div>

      {/* Main clean table element */}
      {!loadingHistory && filteredReports.length === 0 ? (
        <div className="p-12 text-center border border-dashed shadow-sm bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl">
          <FileText className="w-10 h-10 mx-auto mb-3 text-slate-400 dark:text-slate-600" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-305">
            No reports found
          </h4>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {searchQuery
              ? "No reports match your current search parameters."
              : "There are no audit reports started or published for this cooperative yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border shadow-sm border-slate-200 dark:border-slate-800 rounded-xl dark:bg-slate-950/10">
          <table className="w-full font-sans text-sm border-collapse text-slate-700 dark:text-slate-300">
            <thead className="text-xs font-semibold uppercase border-b bg-slate-50 dark:bg-slate-950 text-slate-505 dark:text-slate-400 border-slate-202 dark:border-slate-800">
              <tr>
                <th className="p-4 font-semibold text-left">Audit Date</th>
                <th className="p-4 font-semibold text-left">
                  Auditor / Publisher
                </th>
                <th className="p-4 font-semibold text-left">Report Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {loadingHistory
                ? Array.from({ length: 3 }).map((_, rowIndex) => (
                    <tr key={rowIndex} className="animate-pulse">
                      <td className="p-4">
                        <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-28"></div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-36"></div>
                          <div className="w-24 h-3 bg-gray-200 rounded dark:bg-gray-700"></div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="w-20 h-6 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="w-24 h-8 ml-auto bg-gray-200 rounded dark:bg-gray-700"></div>
                      </td>
                    </tr>
                  ))
                : filteredReports.map((report) => {
                    const isLatest =
                      latestAudit && report.id === latestAudit.id;
                    const itemRawData =
                      report.rawReportData &&
                      typeof report.rawReportData === "string" &&
                      report.rawReportData.trim() !== "";
                    const itemUrl =
                      report.auditReportUrl &&
                      typeof report.auditReportUrl === "string" &&
                      report.auditReportUrl.trim() !== "";
                    const isReportApprovedOrRejected =
                      report.status === "APPROVED" ||
                      report.status === "REJECTED";

                    let statusBadge = null;
                    if (itemRawData && itemUrl) {
                      statusBadge = (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                          Generated
                        </span>
                      );
                    } else if (itemRawData && !itemUrl) {
                      statusBadge = (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900/30 text-yellow-750 dark:text-yellow-400">
                          Draft
                        </span>
                      );
                    } else {
                      statusBadge = (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                          Not Started
                        </span>
                      );
                    }

                    let actions = null;
                    if (isLatest) {
                      actions = (
                        <div className="flex items-center justify-end gap-2">
                          {itemUrl ? (
                            <a
                              href={report.auditReportUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs transition-all font-semibold shadow-sm"
                            >
                              <Eye size={12} />
                              View PDF
                            </a>
                          ) : !isReportApprovedOrRejected ? (
                            <div className="relative inline-block group">
                              <button
                                disabled
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-205 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 text-xs font-semibold select-none cursor-not-allowed transition-all shadow-sm"
                              >
                                <Edit size={12} />
                                {itemRawData ? "Edit Report" : "Create Report"}
                              </button>
                              <div className="pointer-events-none absolute right-0 bottom-full mb-2 w-48 p-1.5 bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-200 text-xs rounded shadow opacity-0 group-hover:opacity-100 transition-opacity z-50 text-center whitespace-normal leading-normal">
                                Audit is not approved or rejected.
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                router.push(
                                  `/audit/report/${coop.id}/${report.id}`,
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs transition-all font-semibold shadow-sm"
                            >
                              <Edit size={12} />
                              {itemRawData ? "Edit Report" : "Create Report"}
                            </button>
                          )}
                        </div>
                      );
                    } else {
                      actions = (
                        <div className="flex items-center justify-end gap-2">
                          {itemUrl ? (
                            <a
                              href={report.auditReportUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs transition-all font-semibold shadow-sm"
                            >
                              <Eye size={12} />
                              View PDF
                            </a>
                          ) : (
                            <span className="text-xs italic select-none text-slate-400 dark:text-slate-500">
                              No report generated
                            </span>
                          )}
                        </div>
                      );
                    }

                    return (
                      <tr
                        key={report.id}
                        className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-950/40"
                      >
                        <td className="p-4 font-medium text-slate-850 dark:text-slate-200">
                          {report.createdAt
                            ? new Date(report.createdAt).toLocaleDateString(
                                "de-DE",
                                {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )
                            : "—"}
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            <UserName
                              name={report.auditorName || "Auditor"}
                              highlight={searchQuery}
                            />
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            <UserEmail
                              email={report.auditorEmail}
                              highlight={searchQuery}
                            />
                          </div>
                        </td>
                        <td className="p-4">{statusBadge}</td>
                        <td className="p-4 text-right">{actions}</td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
