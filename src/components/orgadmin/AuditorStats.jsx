"use client";

import React, { useEffect, useState } from "react";
import { getAuditorStats } from "@/lib/statsService";
import { ROLE_MAP } from "../shared/ProfileUpdateForm";
import { Blocks, ChevronLeft, ChevronRight, ChevronsRight, TriangleAlert } from "lucide-react";

const AuditorStats = ({ auditOrgId }) => {
  const [auditors, setAuditors] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const limit = 10;

  const fetchAuditors = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAuditorStats(auditOrgId, page, limit);

      setAuditors(data.teamMembers || []);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
      setError("Failed to load auditor stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auditOrgId) fetchAuditors();
  }, [auditOrgId, page]);

  // Helper to extract initials for premium avatar styling
  const getInitials = (name) => {
    if (!name) return "AU";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role) => {
    switch ((role || "").toLowerCase()) {
      case "auditer":
        return "bg-violet-50/60 text-violet-700 ring-violet-600/10 dark:bg-violet-950/50 dark:text-violet-400 dark:ring-violet-600/20";
      case "aud_e":
        return "bg-sky-50/60 text-sky-700 ring-sky-600/10 dark:bg-sky-950/50 dark:text-sky-400 dark:ring-sky-600/20";
      default:
        return "bg-zinc-50 text-zinc-600 ring-zinc-600/10 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-600/20";
    }
  };

  const StatPill = ({ value, color }) => (
    <span
      className={`inline-flex items-center justify-center min-w-[38px] px-2.5 py-1 rounded-md text-xs font-medium border tabular-nums transition-colors duration-150 ${color} dark:border-slate-700`}
    >
      {value ?? 0}
    </span>
  );

  return (
    <div className="mx-4 rounded-xl border border-zinc-200/80 bg-white dark:bg-slate-800 dark:border-slate-600/80 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_20px_-5px_rgba(0,0,0,0.03)] dark:shadow-sm overflow-hidden">
      {/* Premium Dashboard Header */}
      <div className="px-6 py-5 border-b border-zinc-150 dark:border-slate-700/80">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white">
              Auditor Performance
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-300">
              Monitor, track, and manage organization audit distribution
              metrics.
            </p>
          </div>

          {pagination && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-medium text-zinc-600 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
              Total Auditors:{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {pagination.total}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-24 bg-white dark:bg-transparent">
          <div className="relative flex items-center justify-center w-10 h-10">
            <div className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-indigo-400/20"></div>
            <div className="w-8 h-8 border-2 rounded-full border-zinc-200 border-t-indigo-600 animate-spin" />
          </div>
          <span className="text-xs font-medium tracking-wide text-zinc-500 animate-pulse dark:text-zinc-400">
            Loading analytics...
          </span>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-12 text-center bg-white dark:bg-transparent">
          <div className="inline-flex p-3 mb-3 rounded-full bg-rose-50 text-rose-600">
            <TriangleAlert />
          </div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{error}</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Please try refreshing or contacting systems support.
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && auditors.length === 0 && (
        <div className="p-16 text-center bg-white dark:bg-transparent">
          <div className="inline-flex p-3 mb-3 border rounded-full bg-zinc-50 text-zinc-400 border-zinc-100">
            <Blocks />
          </div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            No auditors registered
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            There are no statistics currently generated for this organization.
          </p>
        </div>
      )}

      {/* Data Table */}
      {!loading && !error && auditors.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse whitespace-nowrap">
              <thead className="sticky top-0 z-10 border-b bg-zinc-50/75 backdrop-blur-sm border-zinc-200 dark:bg-slate-800/75 dark:border-slate-600">
                <tr className="text-[11px] font-semibold tracking-wider text-left uppercase text-zinc-500/90 dark:text-zinc-400">
                  <th className="px-6 py-3.5">Auditor</th>
                  <th className="px-6 py-3.5">Emp ID</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-center">Assigned</th>
                  <th className="px-6 py-3.5 text-center">Active</th>
                  <th className="px-6 py-3.5 text-center">Overdue</th>
                  <th className="px-6 py-3.5 text-center">Pending Review</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-zinc-100 dark:bg-slate-800 dark:divide-slate-500">
                {auditors.map((a) => {
                  const activeCount = a.stats?.activeAuditsCount ?? 0;
                  const activePercentage = Math.min(
                    (activeCount / (a.stats?.totalAuditsAssigned || 1)) * 100,
                    100,
                  );

                  return (
                    <tr
                      key={a.id}
                      className="transition-colors duration-150 group hover:bg-zinc-50/60 dark:hover:bg-slate-700"
                    >
                      {/* Auditor Profile Column */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center text-xs font-semibold text-indigo-700 transition-transform duration-150 border rounded-full shadow-sm h-9 w-9 bg-gradient-to-br from-indigo-50 to-zinc-100 border-indigo-200/40 group-hover:scale-105 dark:text-indigo-400 dark:from-indigo-950 dark:to-slate-600 dark:border-slate-600">
                            {getInitials(a.name)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium transition-colors text-zinc-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-200">
                              {a.name}
                            </span>
                            <span className="text-xs font-normal text-zinc-400 dark:text-zinc-300">
                              {a.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Emp ID */}
                      <td className="px-6 py-3.5 font-mono text-xs text-zinc-600 dark:text-zinc-200">
                        {a.empId || "—"}
                      </td>

                      {/* Role Tag */}
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border tracking-wide ${getRoleColor(
                            a.role,
                          )}`}
                        >
                          {ROLE_MAP?.[a.role]?.label || a.role}
                        </span>
                      </td>

                      {/* Pulse Status Badge */}
                      <td className="px-6 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                            a.isActive
                              ? "bg-emerald-50/50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-600/60"
                              : "bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-slate-400 dark:text-zinc-700 dark:border-zinc-600"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${a.isActive ? "bg-emerald-500" : "bg-zinc-400 dark:bg-slate-600"}`}
                          />
                          {a.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Total Assigned */}
                      <td className="px-6 py-3.5 text-center">
                        <StatPill
                          value={a.stats?.totalAuditsAssigned}
                          color="bg-white text-zinc-700 border-zinc-200 group-hover:border-zinc-300 dark:bg-slate-700 dark:text-zinc-300 dark:border-zinc-600"
                        />
                      </td>

                      {/* Active — Count with visual micro progress bar line */}
                      <td className="px-6 py-3.5 text-center">
                        {a.stats?.totalAuditsAssigned && (
                          <div className="inline-flex flex-col items-center gap-1.5 w-24">
                            <span className="text-sm font-semibold text-zinc-800 tabular-nums dark:text-white">
                              {activeCount}{" "}
                              <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">
                                / {a.stats?.totalAuditsAssigned ?? 0}
                              </span>
                            </span>
                            <div className="w-full h-[6px] overflow-hidden border rounded-full bg-zinc-200 border-zinc-200/30 dark:bg-slate-600 dark:border-slate-600/30">
                              <div
                                className="h-full transition-all duration-300 bg-indigo-600 rounded-full"
                                style={{ width: `${activePercentage}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Overdue — Red if > 0 */}
                      <td className="px-6 py-3.5 text-center">
                        <StatPill
                          value={a.stats?.overdueAuditsCount}
                          color={
                            (a.stats?.overdueAuditsCount ?? 0) > 0
                              ? "bg-rose-50 text-rose-700 border-rose-200 shadow-sm shadow-rose-100"
                              : "bg-zinc-50/50 text-zinc-400 border-zinc-200/60 dark:bg-slate-700 dark:text-zinc-300  dark:border-zinc-600"
                          }
                        />
                      </td>

                      {/* Submitted Awaiting Review — Amber if > 0 */}
                      <td className="px-6 py-3.5 text-center">
                        <StatPill
                          value={a.stats?.submittedAwaitingReviewCount}
                          color={
                            (a.stats?.submittedAwaitingReviewCount ?? 0) > 0
                              ? "bg-amber-50 text-amber-700 border-amber-200 shadow-sm shadow-amber-100 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-600/60 dark:shadow-amber-600/20"
                              : "bg-zinc-50/50 text-zinc-400 border-zinc-200/60 dark:bg-slate-700 dark:text-zinc-300 dark:border-zinc-600"
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Premium Clean Pagination Footer */}
          {pagination && (
            <div className="flex flex-col items-center justify-between gap-4 px-6 py-4 border-t sm:flex-row border-zinc-200 bg-zinc-50/50 dark:bg-slate-400/10 dark:border-slate-600">
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Showing page{" "}
                <span className="text-zinc-800 dark:text-white">{pagination.page}</span> of{" "}
                <span className="text-zinc-800 dark:text-white">{pagination.totalPages}</span>{" "}
                pages
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setPage((p) => p - 1)}
                  className="inline-flex items-center justify-center p-2 transition bg-white border rounded-lg shadow-sm text-zinc-500 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-800 active:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-slate-700 dark:border-slate-600 dark:text-zinc-400 dark:hover:bg-slate-600 dark:hover:text-white dark:active:bg-slate-500" 
                  aria-label="Previous page"
                >
                  <ChevronLeft />
                </button>

                <div className="flex items-center gap-1.5">
                  {Array.from(
                    { length: pagination.totalPages },
                    (_, i) => i + 1,
                  )
                    .slice(Math.max(0, page - 2), page + 2)
                    .map((pNum) => (
                      <button
                        key={pNum}
                        onClick={() => setPage(pNum)}
                        className={`h-8 w-8 rounded-lg text-xs font-semibold transition-all ${
                          pNum === page
                            ? "bg-slate-800 text-white shadow-sm shadow-slate-900/10 dark:bg-slate-200 dark:text-slate-900 dark:shadow-slate-700/10"
                            : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:bg-slate-700 dark:border-slate-600 dark:text-zinc-400 dark:hover:bg-slate-600 dark:hover:text-white"
                        }`}
                      >
                        {pNum}
                      </button>
                    ))}
                </div>

                <button
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center justify-center p-2 transition bg-white border rounded-lg shadow-sm text-zinc-500 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-800 active:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-slate-700 dark:border-slate-600 dark:text-zinc-400 dark:hover:bg-slate-600 dark:hover:text-white dark:active:bg-slate-500"
                  aria-label="Next page"
                >
                  <ChevronRight />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuditorStats;
