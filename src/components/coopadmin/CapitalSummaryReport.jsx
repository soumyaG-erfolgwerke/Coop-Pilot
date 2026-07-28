"use client";

import React, { useState, useEffect } from "react";
import { FileText, Download, AlertCircle, Loader2, Clock, User } from "lucide-react";
import { formatGermanDateTime } from "@/lib/reports/utils/time";

import { getCapitalSummaryHistoryList, generateNewCapitalSummaryReport } from "@/lib/reports/capitalSummary/service";

const getForceDownloadUrl = (url) => {
  if (!url) return "";
  return url.replace("/view?", "/download?");
};

const CapitalSummaryDashboard = ({ selectedCoop, coops }) => {
  const currentYear = new Date().getFullYear();

  const [fiscalYear, setFiscalYear] = useState(String(currentYear));
  const [isLoading, setIsLoading] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [activeReport, setActiveReport] = useState(null);
  const [error, setError] = useState(null);

  const selectedCoopName = coops?.find((c) => c.id === selectedCoop)?.name ?? "";

  // Local Client Cache Lookup: Instantly find out if selected year is already archived
  const matchedCachedRecord = historyList.find(
    (item) => String(item.fiscalYear) === String(fiscalYear)
  );

  // Hook: Keep active report block in sync with chosen year dropdown
  useEffect(() => {
    if (matchedCachedRecord) {
      setActiveReport(matchedCachedRecord);
    } else {
      setActiveReport(null);
    }
  }, [fiscalYear, historyList]);

  // 2. CONNECT LAZY INITIAL LOAD (Fetches history registry on mount or tenant switch)
  useEffect(() => {
    if (!selectedCoop) return;

    let isMounted = true;
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    setActiveReport(null);
    setFiscalYear(String(currentYear));

    getCapitalSummaryHistoryList({ coopId: selectedCoop })
      .then((data) => {
        if (isMounted) {
          setHistoryList(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to load report history.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [selectedCoop, currentYear]);

  const handleYearChange = (e) => {
    setFiscalYear(e.target.value);
    setError(null);
  };

  // 3. CONNECT LIVE GENERATION PIPELINE (Hits POST endpoint route)
  const handleExecuteGenerationPipeline = async () => {
    if (!selectedCoop || !fiscalYear) return;

    setIsLoading(true);
    setError(null);

    try {
      const unifiedReportDoc = await generateNewCapitalSummaryReport({
        coopId: selectedCoop,
        fiscalYear: String(fiscalYear),
      });

      // Update states using the clean standardized document contract
      setActiveReport(unifiedReportDoc);

      // Add item to history log instantly so tracking list updates without page reloads
      setHistoryList((prev) => [unifiedReportDoc, ...prev]);
    } catch (err) {
      setError(err.message || "An error occurred during report generation.");
      setActiveReport(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Guard Clause: Block display layout mechanics if tenant focus is undefined
  if (!selectedCoop) {
    return (
      <div className="max-w-5xl p-6 mx-auto mt-10 text-center border rounded-xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Capital Summary Report</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Please select a cooperative from the main overview to view or generate reports.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl p-6 mx-auto space-y-6">
      {/* 1. Header Title Block Section */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Financial Year Overview and Capital Summary Report
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Cooperative: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{selectedCoopName || selectedCoop}</span>
        </p>
      </div>

      {/* 2. Control Input Settings Interface */}
      <ReportControlPanel
        currentYear={currentYear}
        selectedYear={fiscalYear}
        onYearChange={handleYearChange}
        onGenerate={handleExecuteGenerationPipeline}
        isLoading={isLoading}
        reportExists={!!matchedCachedRecord}
      />

      {error && (
        <div className="px-4 py-3 text-sm text-red-800 border border-red-200 rounded-lg bg-red-50 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {/* 3. Primary Focused Action Status Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
          Selected Fiscal Year
        </h3>
        <ActiveReportDisplay
          report={activeReport}
          isLoading={isLoading}
          selectedYear={fiscalYear}
        />
      </div>

      {/* 4. Complete Continuous History Log Component */}
      <ReportHistorySection
        history={historyList}
        onSelectRow={(clickedRecord) => setFiscalYear(clickedRecord.fiscalYear)}
        activeReportId={activeReport?.$id}
      />
    </div>
  );
};

export const ActiveReportDisplay = ({ report, isLoading, selectedYear }) => {
  // State 1: Active Generation Network Execution
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 border border-indigo-200 border-dashed bg-indigo-50/30 rounded-xl dark:border-indigo-500/20 dark:bg-indigo-950/10">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin dark:text-indigo-400" />
        <h4 className="mt-4 text-sm font-medium text-indigo-900 dark:text-indigo-200">
          Report Generation in Progress
        </h4>
        <p className="max-w-xs mt-1 text-xs text-center text-indigo-600/80 dark:text-indigo-400/70">
          The calculation of ledger balances takes some time. Please do not close this tab.
        </p>
      </div>
    );
  }

  // State 2: Valid Compiled Document Map Found
  if (report) {
    return (
      <div className="p-6 border border-emerald-200 bg-emerald-50/20 rounded-xl dark:border-emerald-500/20 dark:bg-emerald-950/10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-700 rounded-lg dark:text-emerald-400">
              <FileText size={24} />
            </div>
            <div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                Report Loaded
              </span>
              <h4 className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                {report.reportName}
              </h4>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Created by: <span className="font-medium">{report.generatedBy}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-emerald-100 md:pt-0 md:border-none dark:border-emerald-900/40">
            <a
              href={report.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium bg-white border rounded-lg shadow-sm text-slate-700 border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <FileText size={14} className="text-red-500" />
              <span>PDF Document</span>
            </a>
            <a
              href={getForceDownloadUrl(report.csvUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium bg-white border rounded-lg shadow-sm text-slate-700 border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Download size={14} className="text-emerald-600" />
              <span>CSV Data Sheet</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // State 3: Cache Miss Fallback (Year selected but data record does not exist)
  return (
    <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-200 bg-slate-50/50 rounded-xl dark:border-slate-700/60 dark:bg-slate-900/10">
      <AlertCircle className="w-6 h-6 text-slate-400 dark:text-slate-500" />
      <h4 className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        No archived report found
      </h4>
      <p className="mt-0.5 text-xs text-center text-slate-500 dark:text-slate-400 max-w-xs">
        For the fiscal year {selectedYear}, no closing report has been generated yet. Click "Generate Report" above.
      </p>
    </div>
  );
};

export const ReportControlPanel = ({
  currentYear,
  selectedYear,
  onYearChange,
  onGenerate,
  isLoading,
  reportExists,
}) => {
  // Build a range list of available reporting windows starting from 2025
  const yearOptions = Array.from(
    { length: currentYear - 2025 + 1 },
    (_, i) => 2025 + i
  );

  return (
    <div className="p-5 border border-slate-200 bg-slate-50 rounded-xl dark:border-slate-700/60 dark:bg-slate-900/40">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Report Period
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select the fiscal year to review.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={selectedYear}
            onChange={onYearChange}
            disabled={isLoading}
            className="w-full px-3 py-2 text-sm bg-white border rounded-lg shadow-sm sm:w-40 border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {yearOptions.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onGenerate}
            // Button is safely disabled if loading OR if a valid match already exists in history logs
            disabled={isLoading || reportExists}
            className="px-4 py-2 text-sm font-medium text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400"
          >
            {isLoading ? "Generating..." : "Generate Report"}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ReportHistorySection = ({ history, onSelectRow, activeReportId }) => {
  return (
    <div className="mt-8">
      <div className="pb-2 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Report History
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          All previously generated annual reports for this cooperative.
        </p>
      </div>

      {history.length === 0 ? (
        <p className="mt-4 text-xs italic text-center text-slate-400">
          No reports have been generated for this cooperative yet.
        </p>
      ) : (
        // Max height boundary turns the card deck into an isolated scrollable zone
        <div className="mt-4 space-y-2 max-h-[380px] overflow-y-auto pr-2 divide-y divide-slate-100 dark:divide-slate-800">
          {history.map((item) => {
            const isSelected = item.$id === activeReportId;

            return (
              <div
                key={item.$id}
                onClick={() => onSelectRow(item)}
                className={`group flex flex-col gap-3 p-4 transition-all rounded-lg cursor-pointer sm:flex-row sm:items-center sm:justify-between ${
                  isSelected
                    ? "bg-indigo-50/60 border border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-500/30"
                    : "bg-white border border-transparent hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {item.reportName}
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      Generated
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center text-xs gap-x-4 gap-y-1 text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-slate-400" />
                      {formatGermanDateTime(item.$createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={12} className="text-slate-400" />
                      {item.generatedBy}
                    </span>
                  </div>
                </div>

                {/* Quick actions direct download triggers inside the history card deck row */}
                <div className="flex items-center self-end gap-2 sm:self-center">
                  <a
                    href={item.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()} // Prevents toggling row highlights
                    className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:text-red-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 shadow-sm"
                    title="PDF öffnen"
                  >
                    <FileText size={14} />
                  </a>
                  <a
                    href={getForceDownloadUrl(item.csvUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:text-emerald-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 shadow-sm"
                    title="CSV herunterladen"
                  >
                    <Download size={14} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CapitalSummaryDashboard;