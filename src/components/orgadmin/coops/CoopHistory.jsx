"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import SimpleSelect from "../../orgadminSignup/SimpleSelect";
import { AuditHistoryRow } from "./AuditHistoryRow";
import Settings from "./Settings";
import { useAuth } from "@/hooks/useAuth";
import Discrepancy from "./Discrepancy";
import { startAudit } from "@/services/auditor/AuditServices";
import { getCoopById } from "@/lib/getCoopsService";
import toast from "react-hot-toast";
import { getCoopDataById } from "@/lib/helpers/_orgHelpers";
import { setAuditStatusStart } from "@/lib/AuditService";
import AuditReports from "./AuditReports";

export const StatusBadge = ({ status }) => {
  const map = {
    SUBMITTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200",
    COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
    REJECTED: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
        map[status] || "bg-gray-50 text-gray-700 border-gray-200"
      }`}
    >
      {status || "-"}
    </span>
  );
};

export const HistoryPage = ({ coop, auditOrg, history, isLoading, onBack }) => {
  const [formType, setFormType] = useState("");
  const [currentCoop, setCurrentCoop] = useState(coop);
  const [startAuditIsLoading, setStartAuditIsLoading] = useState(false);
  const [coopAuditData, setCoopAuditData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isSubAuditor = user?.role === "aud_E" || user?.role === "aud_T";

  const activeTab = searchParams.get("subtab") || "history";

  const setTab = (tab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("subtab", tab);

    router.replace(`${pathname}?${params.toString()}`, {
      scroll: false,
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === "/" &&
        activeTab === "history" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        const input = document.getElementById("history-search-input");
        input?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab]);

  const filteredHistory = (history || []).filter((e) => {
    if (!searchQuery) return true;
    const name = e.auditJson?.submittedBy || e.submittedBy || e.auditorName || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const lastAuditStatus = history?.[0]?.status;

  const isLastAuditCompleted =
    lastAuditStatus === "SUBMITTED" ||
    lastAuditStatus === "REJECTED" ||
    lastAuditStatus === "APPROVED" ||
    !lastAuditStatus;

  const formOptions = [
    { value: "simple", label: "Simple Audit" },
    { value: "full", label: "Full Audit" },
  ];

  const fetchCoop = async (id) => {
    try {
      const coopData = await getCoopDataById(id);
      setCoopAuditData(coopData.coop.auditJson || null);
      setCurrentCoop(coopData.coop);
    } catch (err) {
      toast.error(err?.message || "Failed to load cooperative data");
    }
  };

  useEffect(() => {
    if (coop?.id) {
      fetchCoop(coop?.id);
    }
  }, [coop?.id]);

  const startAuditForCoop = async (formType, coop) => {
    try {
      setStartAuditIsLoading(true);
      const res = await setAuditStatusStart(formType, coop.id, auditOrg.id);
      setCurrentCoop(res.result);
      toast.success(res.message);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setStartAuditIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <button
        onClick={onBack}
        className="flex items-center gap-1 mb-4 text-indigo-600 hover:underline"
      >
        <ArrowLeft size={18} />
        Back to Cooperatives
      </button>

      {currentCoop && (
        <div className="items-center justify-between p-5 mb-6 bg-white border dark:bg-gray-800 dark:border-gray-600 rounded-xl md:flex">
          <div className="flex items-center gap-4">
            <img
              src={currentCoop.logo}
              alt={currentCoop.name}
              className="object-cover border h-14 w-14 rounded-xl"
            />

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{currentCoop.name}</h2>

                <span
                  className={`inline-flex items-center rounded-full ${
                    currentCoop.isLive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  } px-2 py-0.5 text-xs font-medium`}
                >
                  {currentCoop.isLive ? "Live" : "Inactive"}
                </span>
              </div>

              <p className="text-sm text-gray-500">
                {currentCoop.state}, {currentCoop.country}
              </p>
            </div>
          </div>

          {!currentCoop?.auditStatus ||
          currentCoop?.auditStatus === "NOT_STARTED" ||
          currentCoop?.auditStatus === "REJECTED" ||
          currentCoop?.auditStatus === "APPROVED" ? (
            !isSubAuditor && (
              <div className="flex items-center gap-3">
                <SimpleSelect
                  placeholder="Select Form Type"
                  options={formOptions}
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                />

                <button
                  disabled={
                    !formType || !isLastAuditCompleted || startAuditIsLoading
                  }
                  className="px-4 py-2 text-white rounded-md bg-primary hover:bg-primary disabled:opacity-50 whitespace-nowrap disabled:cursor-not-allowed disabled:bg-primary/70"
                  onClick={() => startAuditForCoop(formType, currentCoop)}
                >
                  {startAuditIsLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Initializing...
                    </div>
                  ) : (
                    "Start Audit"
                  )}
                </button>
              </div>
            )
          ) : (
            <div className="flex items-center gap-3 px-4 py-2 font-semibold text-gray-700 capitalize rounded-md text-md bg-slate-100/80">
              {currentCoop?.auditStatus === "IN_PROGRESS" ||
              currentCoop?.auditStatus === "STARTED" ||
              currentCoop?.auditStatus === "START"
                ? "Audit Started"
                : currentCoop?.auditStatus === "SUBMITTED"
                  ? "Audit Submitted"
                  : currentCoop?.auditStatus === "REJECTED"
                    ? "Audit Rejected"
                    : currentCoop?.auditStatus === "APPROVED"
                      ? "Audit Approved"
                      : currentCoop?.auditStatus === "NOT_STARTED"
                        ? "Audit Not Started"
                        : currentCoop?.auditStatus === "PENDING"
                          ? "Audit Pending"
                          : "Audit Not Started"}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-8">
          <button
            onClick={() => setTab("history")}
            className={`pb-3 border-b-2 text-sm font-medium transition-colors ${
              activeTab === "history"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            History
          </button>

          {!isSubAuditor && (
            <button
              onClick={() => setTab("settings")}
              className={`pb-3 border-b-2 text-sm font-medium transition-colors ${
                activeTab === "settings"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Settings
            </button>
          )}

          <button
            onClick={() => setTab("discrepancy")}
            className={`pb-3 border-b-2 text-sm font-medium transition-colors ${
              activeTab === "discrepancy"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Discrepancy
          </button>

          <button
            onClick={() => setTab("reports")}
            className={`pb-3 border-b-2 text-sm font-medium transition-colors ${
              activeTab === "reports"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Reports
          </button>
        </div>
      </div>

      {/* HISTORY */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {!isLoading && history?.length > 0 && (
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-xs">
                <input
                  id="history-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by username..."
                  className="w-full pl-3 pr-10 py-1.5 bg-white border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none select-none">
                  <kbd className="inline-flex items-center px-1.5 py-0.5 border border-gray-200 dark:border-gray-700 text-[10px] font-sans font-medium text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-900 rounded shadow-sm">
                    /
                  </kbd>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto bg-white border dark:bg-gray-800 dark:border-gray-600 rounded-xl">
            <table className="w-full text-sm">
              <thead className="text-xs text-center uppercase bg-gray-100 dark:bg-gray-600">
                <tr>
                  <th className="py-3">Date</th>
                  <th>Status</th>
                  <th>Submitted By</th>
                  <th>Deadline</th>
                  <th>Submission Date</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, rowIndex) => (
                    <tr key={rowIndex} className="animate-pulse border-b dark:border-gray-700">
                      <td className="p-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 mx-auto"></div></td>
                      <td className="p-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 mx-auto"></div></td>
                      <td className="p-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mx-auto"></div></td>
                      <td className="p-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mx-auto"></div></td>
                      <td className="p-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mx-auto"></div></td>
                      <td className="p-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto"></div></td>
                    </tr>
                  ))
                ) : !filteredHistory?.length ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-400">
                      No history found
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((e) => (
                    <AuditHistoryRow
                      key={e.id}
                      entry={e}
                      coopId={currentCoop?.id}
                      searchQuery={searchQuery}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SETTINGS */}
      {activeTab === "settings" && !isSubAuditor && (
        <div className="">
          {currentCoop?.auditOrgId && (
            <Settings auditOrgId={currentCoop.auditOrgId} />
          )}
        </div>
      )}

      {/* DISCREPANCY */}
      {activeTab === "discrepancy" && (
        <Discrepancy auditOrgId={currentCoop?.auditOrgId} />
      )}

      {/* REPORTS */}
      {activeTab === "reports" && (
        <AuditReports auditOrgId={currentCoop?.auditOrgId} coop={currentCoop} />
      )}
    </div>
  );
};
