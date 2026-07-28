"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FileText,
  Eye,
  Download,
  Clock,
  ShieldCheck,
  SearchX,
  Filter,
  Search,
  X,
} from "lucide-react";
import {
  getAuditData,
  getAuditHistory,
  getAuditHistoryById,
} from "@/lib/AuditService";
import AuditDataModal from "./AuditDataModal";
import { getTicketsByCoop } from "@/lib/ticketService";
import UserName from "../userComponent/UserName";

export default function AuditHistoryView({ coops = [], selectedCoop }) {
  const coop = coops.find((c) => c.id === selectedCoop);

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditData, setAuditData] = useState(null);
  const [auditDataModalOpen, setAuditDataModalOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [comments, setComments] = useState([]);
  const [error, setError] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterField, setFilterField] = useState("createdOn");
  const [filterOp, setFilterOp] = useState("equal");
  const [filterVal, setFilterVal] = useState("");
  const [appliedFilterField, setAppliedFilterField] = useState("createdOn");
  const [appliedFilterOp, setAppliedFilterOp] = useState("equal");
  const [appliedFilterVal, setAppliedFilterVal] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (!coop?.id) return;

    const loadHistory = async () => {
      try {
        const docs = await getAuditHistory(coop.id);
        setHistory(docs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [coop?.id]);

  const fetchTickets = useCallback(async () => {
    if (!coop?.id) return;
    try {
      setLoading(true);
      setError("");
      const docs = await getTicketsByCoop(coop.id, { order: "desc" });
      setTickets(docs || []);
    } catch (e) {
      console.error(e);
      setError("Failed to load tickets.");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [coop?.id]);

  // Keyboard shortcut listener (/ or Ctrl+K to search)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
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

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const applyDateFilter = (auditDate, operator, filterDate) => {
    const filterDateObj = new Date(filterDate);

    switch (operator) {
      case "equal":
        return (
          auditDate.getFullYear() === filterDateObj.getFullYear() &&
          auditDate.getMonth() === filterDateObj.getMonth() &&
          auditDate.getDate() === filterDateObj.getDate()
        );
      case "greater":
        return auditDate > filterDateObj;
      case "lesser":
        return auditDate < filterDateObj;
      default:
        return true;
    }
  };

  const getFilteredHistory = () => {
    let filtered = history;

    // Apply text search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter((audit) => {
        return (
          (audit.id || "").toLowerCase().includes(lower) ||
          (audit.status || "").toLowerCase().includes(lower) ||
          (audit.auditorName || "").toLowerCase().includes(lower) ||
          (audit.auditorEmail || "").toLowerCase().includes(lower)
        );
      });
    }

    // Apply date filters
    if (appliedFilterVal) {
      filtered = filtered.filter((audit) => {
        const dateField =
          appliedFilterField === "createdOn" ? "createdAt" : "updatedAt";
        const auditDate = new Date(audit[dateField]);

        return applyDateFilter(auditDate, appliedFilterOp, appliedFilterVal);
      });
    }

    return filtered;
  };

  const handleViewAudit = async (audit) => {
    try {
      const document = await getAuditHistoryById(audit.id);

      const parsed =
        typeof document.auditJson === "string"
          ? JSON.parse(document.auditJson)
          : document.auditJson;

      setAuditData(parsed);
      setAuditDataModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-100 rounded-full dark:border-slate-800 border-t-indigo-600 dark:border-t-indigo-500 animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
          Loading audit history...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 mx-auto space-y-8 sm:p-6 lg:p-8 animate-fadeIn max-w-7xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex items-center gap-4">
          <div className="p-3 text-indigo-600 bg-indigo-100 shadow-sm dark:bg-indigo-900/40 dark:text-indigo-400 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Audit History
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              Complete log of all submitted compliance audits.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden bg-white border shadow-sm dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl">
        <div className="relative z-20 flex items-center justify-between gap-2 px-6 py-4 bg-white border-b border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <div className="relative flex-grow">
            <Search className="absolute w-4.5 h-4.5 text-slate-400 dark:text-slate-500 -translate-y-1/2 left-3.5 top-1/2 transition-colors pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-16 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white/80 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:ring-blue-500/20 text-sm sm:text-base transition-all"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none select-none">
              {searchTerm ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm("");
                  }}
                  className="pointer-events-auto text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
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
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg shadow-sm dark:bg-slate-700 dark:text-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <Filter size={16} />
              Filters
              {appliedFilterVal && (
                <span className="flex items-center justify-center w-5 h-5 ml-1 text-xs text-white bg-gray-800 rounded-full dark:bg-gray-200 dark:text-gray-900">
                  1
                </span>
              )}
            </button>
            {isFilterOpen && (
              <div className="absolute right-0 top-full z-50 w-[400px] p-4 mt-2 text-left bg-white border border-gray-200 rounded-lg shadow-xl dark:bg-[#1a1a1a] dark:border-slate-700 text-sm">
                <div className="flex items-center gap-2 mb-4">
                  <select
                    value={filterField}
                    onChange={(e) => {
                      setFilterField(e.target.value);
                      setFilterVal("");
                    }}
                    className="w-[45%] px-3 py-1.5 bg-white dark:bg-[#1a1a1a] rounded border border-gray-300 dark:border-[#383838] text-sm focus:ring-2 focus:ring-primary h-9 outline-none dark:text-gray-200"
                  >
                    <option value="createdOn">Created On</option>
                    <option value="updatedOn">Updated On</option>
                  </select>
                  <select
                    value={filterOp}
                    onChange={(e) => setFilterOp(e.target.value)}
                    className="w-[45%] px-3 py-1.5 bg-white dark:bg-[#1a1a1a] rounded border border-gray-300 dark:border-[#383838] text-sm focus:ring-2 focus:ring-primary h-9 outline-none dark:text-gray-200"
                  >
                    <option value="equal">Equal</option>
                    <option value="greater">Greater</option>
                    <option value="lesser">Lesser</option>
                  </select>
                </div>

                <input
                  type="date"
                  value={filterVal}
                  onChange={(e) => setFilterVal(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-[#1a1a1a] rounded border border-gray-300 dark:border-[#383838] text-sm focus:ring-2 focus:ring-primary h-9 outline-none dark:text-gray-200 mb-4"
                />

                <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-gray-200 dark:border-slate-700">
                  <button
                    onClick={() => {
                      setFilterField("createdOn");
                      setFilterVal("");
                      setFilterOp("equal");
                      setAppliedFilterField("createdOn");
                      setAppliedFilterVal("");
                      setAppliedFilterOp("equal");
                      setIsFilterOpen(false);
                    }}
                    className="px-4 py-1.5 text-sm font-medium text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={() => {
                      setAppliedFilterField(filterField);
                      setAppliedFilterVal(filterVal);
                      setAppliedFilterOp(filterOp);
                      setIsFilterOpen(false);
                    }}
                    className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-white dark:text-black dark:hover:bg-gray-200 focus:outline-none"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  Audit ID
                </th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest text-center uppercase text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest text-center uppercase text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  Auditor
                </th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest text-center uppercase text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  Created
                </th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest text-center uppercase text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  Updated
                </th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest text-center uppercase text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {getFilteredHistory().map((audit) => (
                <tr
                  key={audit.id}
                  className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"
                >
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300">
                      <UserName name={audit.id} highlight={searchTerm} />
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${
                        audit.status?.toLowerCase() === "approved" ||
                        audit.status?.toLowerCase() === "active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                          : audit.status?.toLowerCase() === "rejected"
                            ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                            : "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20"
                      }`}
                    >
                      {audit.status}
                    </span>
                  </td>

                  <td className="p-4">
                    <UserName
                      name={audit.auditorName}
                      email={audit.auditorEmail}
                      allowEmailCopy={true}
                      className="flex-col items-center gap-1"
                      highlight={searchTerm}
                    />
                  </td>

                  <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 justify-center">
                      <Clock size={14} className="text-slate-400" />
                      {new Date(audit.createdAt).toLocaleDateString()}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 justify-center">
                      <Clock size={14} className="text-slate-400" />
                      {new Date(audit.updatedAt).toLocaleDateString()}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleViewAudit(audit)}
                        title="View Audit"
                        className="p-2 bg-white rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {getFilteredHistory().length === 0 && (
          <div className="flex flex-col items-center justify-center px-4 py-16 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-slate-50 dark:bg-slate-800">
              <SearchX className="w-8 h-8 text-slate-300 dark:text-slate-500" />
            </div>
            <h3 className="mb-1 text-base font-bold text-slate-900 dark:text-white">
              No Audit History Found
            </h3>
            <p className="max-w-sm text-sm text-center text-slate-500 dark:text-slate-400">
              There are no recorded audits for this cooperative yet.
            </p>
          </div>
        )}
      </div>

      <AuditDataModal
        open={auditDataModalOpen}
        onClose={() => setAuditDataModalOpen(false)}
        coop={coop}
        tickets={tickets}
        comments={comments}
        auditData={auditData}
      />
    </div>
  );
}
