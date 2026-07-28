"use client";

import { Download, FileText, Calendar, ArrowRight, Info } from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_TIMEZONE } from "@/lib/reports/constants";
import { exportShareRegisterCsv } from "@/lib/reports/shareRegister/export/csv";
import { exportShareRegisterPdf } from "@/lib/reports/shareRegister/export/pdf";
import { getShareRegisterReport } from "@/lib/reports/shareRegister/service";
import {
  displayOrDash,
  formatEUR,
  formatNumberDE,
} from "@/lib/reports/utils/formatters";
import { formatGermanDateOnly, todayBerlinIso } from "@/lib/reports/utils/time";

// --- Sub-Components ---

const ReportWarnings = ({ warnings }) => {
  if (!warnings?.length) return null;

  return (
    <div className="px-4 py-3 mt-4 text-sm border rounded-md border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
      <div className="font-medium">Warnings</div>
      <ul className="pl-5 mt-1 list-disc">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </div>
  );
};

const ReportSummaryCards = ({ totals }) => {
  return (
    <div className="grid grid-cols-1 gap-3 mt-6 sm:grid-cols-3">
      <div className="p-4 bg-white border border-gray-200 rounded-lg dark:border-slate-700 dark:bg-slate-800">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Members (Active)
        </div>
        <div className="mt-1 text-lg font-semibold">
          {formatNumberDE(totals?.totalMembers)}
        </div>
      </div>

      <div className="p-4 bg-white border border-gray-200 rounded-lg dark:border-slate-700 dark:bg-slate-800">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Total Shares
        </div>
        <div className="mt-1 text-lg font-semibold">
          {formatNumberDE(totals?.totalShares)}
        </div>
      </div>

      <div className="p-4 bg-white border border-gray-200 rounded-lg dark:border-slate-700 dark:bg-slate-800">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Total Capital
        </div>
        <div className="mt-1 text-lg font-semibold">
          {formatEUR(totals?.totalCapitalEUR)}
        </div>
      </div>
    </div>
  );
};

// --- Main Container Component ---

const ShareRegisterReport = ({ selectedCoop, coops }) => {
  const { user } = useAuth();

  const getYesterdayString = () =>
    DateTime.now().setZone(DEFAULT_TIMEZONE).minus({ days: 1 }).toISODate();

  const [stichtag, setStichtag] = useState(getYesterdayString);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);

  const rows = report?.rows ?? [];
  const warnings = report?.meta?.warnings ?? [];
  const canExport = rows.length > 0;

  const selectedCoopName =
    coops?.find((c) => c.id === selectedCoop)?.name ?? "";

  const generatedByPayload = user
    ? {
        userId: user.$id,
        name: user.name,
        email: user.email,
      }
    : null;

  useEffect(() => {
    setReport(null);
    setError(null);
  }, [selectedCoop]);

  const handleStichtagChange = (e) => {
    const value = e.target.value;
    setStichtag(value);
    setReport(null);

    if (!value) {
      setError("Please select a report date");
      return;
    }
    setError(null);
  };

  const handleGenerate = async () => {
    if (!selectedCoop) return;

    if (stichtag >= todayBerlinIso()) {
      setError("Invalid: Report Date must be in the past");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getShareRegisterReport({
        coopId: selectedCoop,
        stichtag,
      });
      setReport(data);
    } catch (e) {
      setReport(null);
      setError(e?.message || "Failed to generate report");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPdf = () => {
    if (!report) return;
    try {
      exportShareRegisterPdf({
        report,
        generatedByOverride: generatedByPayload,
      });
    } catch (e) {
      setError(e?.message || "Failed to export PDF");
    }
  };

  const handleExportCsv = () => {
    if (!report) return;
    try {
      exportShareRegisterCsv({ report });
    } catch (e) {
      setError(e?.message || "Failed to export CSV");
    }
  };

  if (!selectedCoop) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">Share Register</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Please select a cooperative to generate the report.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 mx-auto space-y-6 max-w-7xl">
      {/* 1. View Header Section */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Share Register Report
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Cooperative: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{selectedCoopName || selectedCoop}</span>
        </p>
      </div>

      {/* 2. Enhanced Control Deck Panel */}
      <div className="p-5 border shadow-sm border-slate-200 bg-slate-50/60 rounded-xl dark:border-slate-700/60 dark:bg-slate-900/40">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

          {/* Date Selector input area */}
          <div className="flex flex-col gap-1.5 min-w-[200px]">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar size={14} className="text-slate-400" />
              Stichtag (Reporting Date)
            </span>
            <input
              type="date"
              value={stichtag}
              max={getYesterdayString()}
              onChange={handleStichtagChange}
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100"
            />
          </div>

          {/* Action Trigger Buttons Stack */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200/60 lg:pt-0 lg:border-none">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading || !stichtag}
              className="px-4 py-2 text-sm font-semibold text-white transition-colors bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500"
            >
              {isLoading ? "Generating..." : "Generate"}
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isLoading || !canExport}
              title={canExport ? "Als PDF herunterladen" : "Keine Daten zum Exportieren"}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors bg-white border rounded-lg shadow-sm text-slate-700 border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <FileText size={15} className="text-red-500" />
              <span>Export PDF</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={isLoading || !canExport}
              title={canExport ? "Als CSV herunterladen" : "Keine Daten zum Exportieren"}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors bg-white border rounded-lg shadow-sm text-slate-700 border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Download size={15} className="text-emerald-600" />
              <span>Export CSV</span>
            </button>
          </div>

        </div>
      </div>

      {error && (
        <div className="px-4 py-3 text-sm text-red-800 border border-red-200 rounded-lg bg-red-50 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {/* 3. Conditional Content Renderer (Table or Informative Empty State) */}
      {report ? (
        <>
          <ReportSummaryCards totals={report.totals} />

          <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl dark:border-slate-700 dark:bg-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50 dark:bg-slate-700/50 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase dark:text-gray-300">Member #</th>
                    <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase dark:text-gray-300">Name</th>
                    <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase dark:text-gray-300">Date of Birth</th>
                    <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase dark:text-gray-300">Entry Date</th>
                    <th className="px-6 py-3 text-xs font-semibold tracking-wider text-right text-gray-600 uppercase dark:text-gray-300">Shares</th>
                    <th className="px-6 py-3 text-xs font-semibold tracking-wider text-right text-gray-600 uppercase dark:text-gray-300">Capital (EUR)</th>
                    <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase dark:text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {rows.map((row, idx) => (
                    <tr key={`${row.memberNumber || "empty"}-${idx}`} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-gray-100">{displayOrDash(row.memberNumber)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap dark:text-gray-100">{displayOrDash(row.name)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap dark:text-gray-300">{formatGermanDateOnly(row.dateOfBirth)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap dark:text-gray-300">{formatGermanDateOnly(row.entryDate)}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900 whitespace-nowrap dark:text-gray-100">{formatNumberDE(row.shares)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-right text-gray-900 whitespace-nowrap dark:text-gray-100">{formatEUR(row.totalCapitalEUR)}</td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${row.status?.toLowerCase() === 'active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-700'}`}>
                          {displayOrDash(row.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ReportWarnings warnings={warnings} />
        </>
      ) : (
        !isLoading && (
          /* INTUITIVE EMPTY STATE PLACEHOLDER BOX */
          //must change german to english
          <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-200 bg-slate-50/30 rounded-xl dark:border-slate-700/60 dark:bg-slate-900/10">
            <div className="p-3 text-indigo-600 rounded-full bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400">
              <Info size={22} />
            </div>
            <h4 className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
              No data to display yet
            </h4>
            <p className="max-w-md mt-1 text-xs leading-relaxed text-center text-slate-500 dark:text-slate-400">
              Select a historical Cutoff Date (Report Date) above and click Generate to visualize the member list and capital balances at that specific point in time.
            </p>
            <div className="flex items-center gap-1.5 mt-4 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
              <span>Select Date</span>
              <ArrowRight size={12} />
              <span>Click Generate</span>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default ShareRegisterReport;