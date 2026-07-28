"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { getDeadlineInfo, updateDeadline } from "@/lib/deadlineService";
import DeadlineModal from "./DeadlineModal";
import DeadlineBadge from "./DeadlineBadge";
import Link from "next/link";

const getStatusStyles = (status) => {
  switch (status?.toUpperCase()) {
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "REJECTED":
      return "bg-red-50 text-red-700 ring-red-200";
    case "UNDER_REVIEW":
      return "bg-yellow-50 text-yellow-700 ring-yellow-200";
    case "SUBMITTED":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "IN_PROGRESS":
      return "bg-indigo-50 text-indigo-700 ring-indigo-200";
    case "START":
      return "bg-indigo-50 text-indigo-700 ring-indigo-200";
    case "ASKED_TO_RESUBMIT":
      return "bg-yellow-50 text-yellow-700 ring-yellow-200";
    case "NOT_STARTED":
      return "bg-slate-50 text-slate-600 ring-slate-200";
    default:
      return "bg-slate-50 text-slate-600 ring-slate-200";
  }
};

export default function Audit({ user }) {
  const [coops, setCoops] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedCoop, setSelectedCoop] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const filter = searchParams.get("audit-filter") || "all";

  const updateFilter = (value) => {
    const params = new URLSearchParams(searchParams);
    params.set("audit-filter", value);

    router.replace(`?${params.toString()}`, {
      scroll: false,
    });
  };

  // pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);
  const filteredCoops = useMemo(() => {
    const activeStatuses = [
      "START", // INITIATED
      "NOT_STARTED", // INITIATED
      "IN_PROGRESS",
      "SUBMITTED",
      "UNDER_REVIEW",
      "ASKED_TO_RESUBMIT", // CORRECTIONS_REQUESTED / RESUBMITTED
    ];

    const closedStatuses = ["APPROVED", "REJECTED", "CLOSED"];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filter) {
      case "active":
        return coops.filter((coop) =>
          activeStatuses.includes(coop.currentAuditStatus?.toUpperCase()),
        );

      case "overdue":
        return coops.filter((coop) => {
          const status = coop.currentAuditStatus?.toUpperCase();

          if (closedStatuses.includes(status)) return false;
          if (!coop.currentAuditDeadline) return false;

          const deadline = new Date(coop.currentAuditDeadline);
          deadline.setHours(0, 0, 0, 0);

          return deadline < today;
        });

      default:
        return coops;
    }
  }, [coops, filter]);

  const fetchData = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const data = await getDeadlineInfo(user?.role, pageNumber, limit);

      setCoops(data.coops || []);
      setTotal(data.total || 0);
      setPage(data.page || pageNumber);
    } catch (error) {
      console.error("Error fetching deadline info:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role) {
      fetchData(1);
    }
  }, [user?.role]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || loading) return;
    fetchData(newPage);
  };

  const handleDeadlineUpdate = async (auditId, newDeadline) => {
    try {
      setSaving(true);

      await updateDeadline(user?.role, auditId, newDeadline);

      setCoops((prev) =>
        prev.map((coop) =>
          coop.currentAuditId === auditId
            ? { ...coop, currentAuditDeadline: newDeadline }
            : coop,
        ),
      );

      setSelectedCoop(null);
    } catch (error) {
      console.error("Error updating deadline:", error);
    } finally {
      setSaving(false);
    }
  };

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const getPages = () => {
    const pages = [];
    const max = 5;

    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + max - 1);

    if (end - start < max) {
      start = Math.max(1, end - max + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="min-h-screen p-2 bg-slate-50 dark:bg-gray-900">
      <div className="space-y-6">
        {/* TABLE */}
        <div className="overflow-hidden bg-white border rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-800 border-slate-200">
          {/* TOP BAR */}
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-white via-slate-50 to-white dark:from-slate-800 dark:via-slate-800 dark:to-slate-800">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Left */}
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  Audit Management
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-gray-300">
                  Monitor audit progress, deadlines and review status.
                </p>
              </div>

              {/* Right */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-white border shadow-sm rounded-xl border-slate-200 dark:bg-slate-800 dark:border-gray-600">
                  <p className="text-xs text-slate-500">Records</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {filteredCoops.length}/{coops.length}
                  </p>
                </div>

                <div className="p-1 bg-white border shadow-sm rounded-xl border-slate-200 dark:bg-slate-800 dark:border-gray-600">
                  <div className="flex items-center gap-1">
                    {[
                      {
                        key: "active",
                        label: "Active",
                      },
                      {
                        key: "overdue",
                        label: "Overdue",
                      },
                      {
                        key: "all",
                        label: "All",
                      },
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => updateFilter(item.key)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                          filter === item.key
                            ? item.key === "overdue"
                              ? "bg-red-600 text-white shadow"
                              : "bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900 shadow"
                            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-gray-700"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full">
              {/* <thead className="bg-slate-50"> */}
              <thead className="bg-slate-50/80 backdrop-blur dark:bg-gray-700/80">
                <tr className="text-xs tracking-wider text-left uppercase text-slate-500 dark:text-gray-300">
                  <th className="px-6 py-4">Cooperative</th>
                  <th className="px-6 py-4">Lead Auditor</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Deadline</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                {loading &&
                  [...Array(6)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-6 py-4">
                        <div className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-gray-600" />
                      </td>
                    </tr>
                  ))}

                {!loading &&
                  filteredCoops.length > 0 &&
                  filteredCoops.map((coop) => (
                    <tr
                      key={coop.id}
                      className="transition hover:bg-slate-50 dark:hover:bg-gray-700"
                    >
                      {/* Coop */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center overflow-hidden border h-11 w-11 rounded-xl border-slate-200 bg-slate-50 dark:border-gray-600 dark:bg-gray-600">
                            {coop.logo ? (
                              <img
                                src={coop.logo}
                                alt={`${coop.name} logo`}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <Building2 className="w-5 h-5 text-slate-400 dark:text-gray-400" />
                            )}
                          </div>
                          <Link href={`/dashboard?tab=coops&coopId=${coop.id}`}>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-300">
                                {coop.name}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-gray-400">
                                {coop.RegNumber}
                              </p>
                            </div>
                          </Link>
                        </div>
                      </td>

                      {/* Auditor */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-300">
                              {coop.leadAuditorName ?? "Not Assigned"}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-gray-400">
                              {coop.leadAuditorEmail ?? "-"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ${getStatusStyles(
                            coop.currentAuditStatus,
                          )}`}
                        >
                          {coop.currentAuditStatus || "No Audit"}
                        </span>
                      </td>

                      {/* Deadline */}
                      <td className="p-4 text-sm text-center text-slate-700 dark:text-gray-300">
                        <DeadlineBadge date={coop.currentAuditDeadline} key={coop.currentAuditDeadline}/>
                      </td>

                      {/* Action */}
                      <td className="p-4 text-center">
                        {coop.isAllowedToEdit ? (
                          <button
                            onClick={() => setSelectedCoop(coop)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white transition shadow-sm dark:text-gray-300 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed"
                            disabled={
                              saving ||
                              !coop.currentAuditId ||
                              (coop.currentAuditStatus !== "SUBMITTED" &&
                                coop.currentAuditStatus !== "UNDER_REVIEW")
                            }
                          >
                            <Pencil className="w-4 h-4" />
                            Update
                          </button>
                        ) : (
                          <span className="text-slate-400 dark:text-gray-400">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}

                {!loading && filteredCoops.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      No audits found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-gray-700">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1 || loading}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-lg border-slate-200 disabled:opacity-40 dark:border-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>

              <div className="flex items-center gap-2">
                {getPages().map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(p)}
                    className={`h-9 w-9 rounded-lg text-sm transition ${
                      p === page
                        ? "bg-slate-900 text-white shadow dark:bg-slate-200 dark:text-slate-900"
                        : "hover:bg-slate-100 text-slate-700 dark:text-gray-300"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages || loading}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-lg border-slate-200 disabled:opacity-40 dark:border-slate-700"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      <DeadlineModal
        open={!!selectedCoop}
        coop={selectedCoop}
        loading={saving}
        onClose={() => setSelectedCoop(null)}
        onSave={(date) =>
          handleDeadlineUpdate(selectedCoop?.currentAuditId, date)
        }
      />
    </div>
  );
}
