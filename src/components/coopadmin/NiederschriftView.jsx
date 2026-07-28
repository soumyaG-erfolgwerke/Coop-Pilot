"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  FileStack,
  Landmark,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  FileText,
  ShieldCheck,
  Users,
  RefreshCw,
  Upload,
  CircleCheck,
  Search,
  Filter,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactDOM from "react-dom";
import { generateNiederschriftPDF } from "../pdf/GenerateNiederschrift";
import toast from "react-hot-toast";
import { getViewUrl } from "@/lib/fileUrlService";
import { getCoopById } from "@/lib/getCoopsService";
import { normalizeStatus } from "./assembly/AssemblyDashboardView";
import { getPollsByCoopId } from "@/lib/votingService";
import UserName from "../userComponent/UserName";

const formatLabels = {
  praesenz: "Physical",
  virtuell: "Virtual",
  hybrid: "Hybrid",
  gestreckt: "Stretched Procedure",
};

const SkeletonCard = () => (
  <div className="flex flex-col h-[280px] overflow-hidden bg-white border border-slate-200 dark:border-slate-800 rounded-2xl dark:bg-slate-900 animate-pulse">
    <div className="flex flex-col flex-1 gap-3 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col flex-1 space-y-2">
          <div className="w-3/4 h-5 rounded bg-slate-200 dark:bg-slate-800"></div>
          <div className="w-1/2 h-5 rounded bg-slate-200 dark:bg-slate-800"></div>
          <div className="w-1/4 h-3 mt-2 rounded bg-slate-100 dark:bg-slate-800/60"></div>
        </div>
        <div className="w-16 h-6 rounded bg-slate-200 dark:bg-slate-800 shrink-0"></div>
      </div>

      <div className="flex flex-col gap-2 mt-4 space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0"></div>
          <div className="w-2/5 h-3 rounded bg-slate-200 dark:bg-slate-800"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0"></div>
          <div className="w-1/3 h-3 rounded bg-slate-200 dark:bg-slate-800"></div>
        </div>
      </div>

      <div className="flex justify-between pt-4 mt-auto border-t border-slate-100 dark:border-slate-800">
        <div className="w-1/4 h-3 rounded bg-slate-200 dark:bg-slate-800"></div>
        <div className="w-1/4 h-3 rounded bg-slate-200 dark:bg-slate-800"></div>
      </div>
    </div>

    <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
      <div className="w-full h-9 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
    </div>
  </div>
);

const NiederschriftPage = ({ selectedCoop }) => {
  const [assemblies, setAssemblies] = useState([]);
  const [loadingAssemblies, setLoadingAssemblies] = useState(true);
  const [loadingPolls, setLoadingPolls] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [coopData, setCoopData] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [pollsByAssembly, setPollsByAssembly] = useState({});

  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter selection states
  const [tempStatus, setTempStatus] = useState("");
  const [tempFormat, setTempFormat] = useState("");
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");

  const [appliedStatus, setAppliedStatus] = useState("");
  const [appliedFormat, setAppliedFormat] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");

  const filterRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close filter popover on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    }
    if (isFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterOpen]);

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

  const clearFilters = () => {
    setTempStatus("");
    setTempFormat("");
    setTempStartDate("");
    setTempEndDate("");
    setAppliedStatus("");
    setAppliedFormat("");
    setAppliedStartDate("");
    setAppliedEndDate("");
    setIsFilterOpen(false);
  };

  const clearAll = () => {
    clearFilters();
    setSearchTerm("");
  };

  const filteredAssemblies = useMemo(() => {
    let result = [...assemblies];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (a) =>
          (a.titleAssembly || "").toLowerCase().includes(lowerSearch) ||
          (a.assemblyId || "").toLowerCase().includes(lowerSearch),
      );
    }

    if (appliedStatus) {
      result = result.filter((a) => normalizeStatus(a) === appliedStatus);
    }

    if (appliedFormat) {
      result = result.filter((a) => a.format === appliedFormat);
    }

    if (appliedStartDate) {
      const start = new Date(appliedStartDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter((a) => {
        const date = a.startDateTime ? new Date(a.startDateTime) : null;
        return date && date >= start;
      });
    }

    if (appliedEndDate) {
      const end = new Date(appliedEndDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter((a) => {
        const date = a.startDateTime ? new Date(a.startDateTime) : null;
        return date && date <= end;
      });
    }

    return result;
  }, [
    assemblies,
    searchTerm,
    appliedStatus,
    appliedFormat,
    appliedStartDate,
    appliedEndDate,
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadAssemblyPolls = async () => {
      if (assemblies.length === 0) {
        setPollsByAssembly({});
        return;
      }

      const coopIds = [
        ...new Set(assemblies.map((a) => a.coopId).filter(Boolean)),
      ];
      if (coopIds.length !== 1) {
        setPollsByAssembly({});
        return;
      }
      try {
        setLoadingPolls(true);
        const polls = await getPollsByCoopId(coopIds[0]);
        const grouped = polls.reduce((acc, poll) => {
          if (!poll?.assemblyId) return acc;
          if (!acc[poll.assemblyId]) {
            acc[poll.assemblyId] = [];
          }
          acc[poll.assemblyId].push(poll);
          return acc;
        }, {});
        // console.log(grouped);

        setPollsByAssembly(grouped);
      } catch (err) {
        console.error(err);
        setPollsByAssembly({});
      } finally {
        setLoadingPolls(false);
      }
    };

    loadAssemblyPolls();
  }, [assemblies]);

  useEffect(() => {
    const fetchCoop = async () => {
      try {
        const res = await getCoopById(selectedCoop);
        setCoopData(res);
      } catch (err) {
        console.error(err);
      }
    };

    if (selectedCoop) {
      fetchCoop();
    }
  }, [selectedCoop]);

  const fetchAssemblies = useCallback(async () => {
    try {
      setLoadingAssemblies(true);
      // console.log(selectedCoop)
      const res = await fetch(`/api/assembly/votes?coopId=${selectedCoop}`);
      const data = await res.json();
      // console.log("assembly from nie: ", data);

      if (!data.success) {
        throw new Error(data.error);
      }
      // console.log("Assemblies: ", data);
      setAssemblies(data.assemblies || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAssemblies(false);
    }
  }, [selectedCoop]);

  useEffect(() => {
    if (selectedCoop) fetchAssemblies();
  }, [selectedCoop, fetchAssemblies]);

  return (
    <div className="p-4 mx-auto space-y-6 max-w-7xl sm:p-6 lg:p-8 animate-fadeIn">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="p-3 text-indigo-600 bg-indigo-100 shadow-sm dark:bg-indigo-900/40 dark:text-indigo-400 rounded-xl shrink-0">
          <Landmark className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-slate-900 dark:text-white">
            Niederschrift
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Official Meeting Minutes generation for completed general
            assemblies.
          </p>
        </div>
      </div>

      {assemblies.length > 0 && (
        <>
          {/* Search and Filters panel */}
          <div className="relative z-30 flex flex-col justify-between gap-3 p-0 font-sans sm:flex-row sm:items-center">
            {/* Modern Search bar with Keyboard Shortcut Hint */}
            <div className="relative flex-grow">
              <Search className="absolute w-4.5 h-4.5 text-slate-400 dark:text-slate-500 -translate-y-1/2 left-3.5 top-1/2 transition-colors pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search assemblies by title or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-16 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white/80 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:ring-indigo-500/20 text-sm transition-all"
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
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-505 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
                    /
                  </span>
                )}
              </div>
            </div>

            {/* Filter Popover Container */}
            <div className="relative z-20 w-auto" ref={filterRef}>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold border rounded-xl shadow-sm h-[44px] w-full sm:w-auto transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                  isFilterOpen ||
                  appliedStatus ||
                  appliedFormat ||
                  appliedStartDate ||
                  appliedEndDate
                    ? "bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-300"
                    : "bg-white border-slate-200 text-slate-750 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Filter size={16} />
                <span>Filters</span>
                {(appliedStatus ||
                  appliedFormat ||
                  appliedStartDate ||
                  appliedEndDate) && (
                  <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-indigo-600 rounded-full dark:bg-indigo-500 animate-scaleIn">
                    {(appliedStatus ? 1 : 0) +
                      (appliedFormat ? 1 : 0) +
                      (appliedStartDate || appliedEndDate ? 1 : 0)}
                  </span>
                )}
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 z-50 w-[300px] sm:w-[420px] p-5 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl animate-fadeIn text-sm">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-150 dark:border-slate-800">
                    <h4 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                      <Filter size={16} className="text-slate-404" />
                      <span>Filter Assemblies</span>
                    </h4>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="p-1 transition-colors rounded-lg text-slate-405 hover:text-slate-650 dark:hover:text-slate-202 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-505 mb-1.5">
                        State
                      </label>
                      <select
                        value={tempStatus}
                        onChange={(e) => setTempStatus(e.target.value)}
                        className="w-full px-3 py-2 text-sm border bg-slate-50 dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:text-gray-200"
                      >
                        <option value="">All States</option>
                        <option value="draft">Draft</option>
                        <option value="live">Live</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-505 mb-1.5">
                        Format
                      </label>
                      <select
                        value={tempFormat}
                        onChange={(e) => setTempFormat(e.target.value)}
                        className="w-full px-3 py-2 text-sm border bg-slate-50 dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:text-gray-200"
                      >
                        <option value="">All Formats</option>
                        <option value="praesenz">Physical</option>
                        <option value="virtuell">Virtual</option>
                        <option value="hybrid">Hybrid</option>
                        <option value="gestreckt">Stretched Procedure</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-505 mb-1.5">
                        Date Duration
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="block text-[10px] text-slate-400 dark:text-slate-500 mb-1">
                            Start Date
                          </span>
                          <input
                            type="date"
                            value={tempStartDate}
                            onChange={(e) => setTempStartDate(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border bg-slate-50 dark:bg-slate-900 rounded-lg border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:text-gray-200"
                          />
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 dark:text-slate-500 mb-1">
                            End Date
                          </span>
                          <input
                            type="date"
                            value={tempEndDate}
                            onChange={(e) => setTempEndDate(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border bg-slate-50 dark:bg-slate-900 rounded-lg border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:text-gray-200"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 mt-5 border-t border-slate-150 dark:border-slate-800">
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 text-sm font-semibold transition-colors text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-300 focus:outline-none hover:bg-gray-100/50 dark:hover:bg-gray-900/50 rounded-xl"
                    >
                      Clear Filters
                    </button>
                    <button
                      onClick={() => {
                        setAppliedStatus(tempStatus);
                        setAppliedFormat(tempFormat);
                        setAppliedStartDate(tempStartDate);
                        setAppliedEndDate(tempEndDate);
                        setIsFilterOpen(false);
                      }}
                      className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 dark:bg-indigo-650 hover:bg-indigo-700 dark:hover:bg-indigo-600 rounded-xl transition-all shadow-sm active:scale-[0.98] focus:outline-none"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active Filter Chips Row */}
          {(appliedStatus ||
            appliedFormat ||
            appliedStartDate ||
            appliedEndDate) && (
            <div className="flex flex-wrap gap-2 p-3 border shadow-inner bg-indigo-50/20 dark:bg-slate-800/10 border-slate-200/60 dark:border-slate-808/60 rounded-2xl animate-fadeIn">
              {appliedStatus && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 rounded-xl border border-indigo-150 dark:border-indigo-900/40 shadow-sm animate-scaleIn">
                  <Filter size={12} className="opacity-70 shrink-0" />
                  <span>
                    State: <strong>{appliedStatus.toUpperCase()}</strong>
                  </span>
                  <button
                    onClick={() => {
                      setTempStatus("");
                      setAppliedStatus("");
                    }}
                    className="p-0.5 hover:bg-indigo-150 dark:hover:bg-indigo-900/50 rounded-full transition-colors ml-1 shrink-0"
                    title="Remove filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              {appliedFormat && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 rounded-xl border border-indigo-150 dark:border-indigo-900/40 shadow-sm animate-scaleIn">
                  <Filter size={12} className="opacity-70 shrink-0" />
                  <span>
                    Format:{" "}
                    <strong>
                      {formatLabels[appliedFormat] || appliedFormat}
                    </strong>
                  </span>
                  <button
                    onClick={() => {
                      setTempFormat("");
                      setAppliedFormat("");
                    }}
                    className="p-0.5 hover:bg-indigo-150 dark:hover:bg-indigo-900/50 rounded-full transition-colors ml-1 shrink-0"
                    title="Remove filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              {(appliedStartDate || appliedEndDate) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 rounded-xl border border-indigo-150 dark:border-indigo-900/40 shadow-sm animate-scaleIn">
                  <Calendar size={12} className="opacity-70 shrink-0" />
                  <span>
                    Duration:{" "}
                    <strong>
                      {appliedStartDate
                        ? new Date(appliedStartDate).toLocaleDateString("de-DE")
                        : "Any"}
                      {" - "}
                      {appliedEndDate
                        ? new Date(appliedEndDate).toLocaleDateString("de-DE")
                        : "Any"}
                    </strong>
                  </span>
                  <button
                    onClick={() => {
                      setTempStartDate("");
                      setTempEndDate("");
                      setAppliedStartDate("");
                      setAppliedEndDate("");
                    }}
                    className="p-0.5 hover:bg-indigo-150 dark:hover:bg-indigo-900/50 rounded-full transition-colors ml-1 shrink-0"
                    title="Remove filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>
          )}
        </>
      )}

      {loadingAssemblies ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : assemblies.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-20 border border-dashed bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="flex items-center justify-center w-16 h-16 mb-4 bg-white border shadow-sm dark:bg-slate-800 rounded-2xl border-slate-100 dark:border-slate-700">
            <FileStack className="w-8 h-8 text-slate-300 dark:text-slate-500" />
          </div>
          <h3 className="mb-1 text-base font-bold text-slate-900 dark:text-white">
            No Assemblies Found
          </h3>
          <p className="max-w-sm text-sm text-center text-slate-500 dark:text-slate-400">
            There are currently no general assemblies to generate minutes for.
          </p>
        </div>
      ) : filteredAssemblies.length === 0 ? (
        <div className="flex flex-col items-center justify-center w-full px-4 py-20 border border-dashed bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="flex items-center justify-center w-16 h-16 mb-4 bg-white border shadow-sm dark:bg-slate-800 rounded-2xl border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500">
            <Search size={28} />
          </div>
          <h3 className="mb-1 text-base font-bold text-slate-900 dark:text-white">
            No Matching Assemblies Found
          </h3>
          <p className="max-w-xs mb-6 text-sm text-center text-slate-500 dark:text-slate-400">
            We couldn't find any assemblies matching your search criteria.
          </p>
          <button
            onClick={clearAll}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl shadow-sm hover:shadow active:scale-[0.98] transition-all"
          >
            Reset Search & Filters
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 animate-fadeIn">
          {filteredAssemblies.map((assembly) => (
            <AssemblyCard
              key={assembly.$id}
              assembly={assembly}
              assemblyPolls={pollsByAssembly[assembly.$id] || []}
              setViewingDoc={setViewingDoc}
              coopData={coopData}
              afterAction={fetchAssemblies}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}

      {mounted &&
        ReactDOM.createPortal(
          <AnimatePresence>
            {viewingDoc && (
              <div className="fixed inset-0 left-0 top-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
                  onClick={() => setViewingDoc(null)}
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-[95vw] max-w-7xl h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-slate-800"
                >
                  <div className="z-20 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-900/80 shrink-0">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2.5 bg-primary/10 dark:bg-primary-dark/20 text-primary dark:text-primary-dark rounded-xl shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>

                      <div className="truncate">
                        <h3 className="text-base font-bold text-gray-900 truncate dark:text-white">
                          {viewingDoc.fileName}
                        </h3>
                      </div>
                    </div>

                    <button
                      onClick={() => setViewingDoc(null)}
                      className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-200 dark:hover:bg-slate-800 dark:hover:text-white rounded-xl transition-colors bg-gray-100 dark:bg-slate-800/50"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="relative flex-1 w-full h-full min-h-0 overflow-hidden bg-gray-100 dark:bg-slate-950">
                    <iframe
                      src={viewingDoc.fileUrl}
                      className="w-full h-full bg-white border-0"
                      title={viewingDoc.fileName}
                      allow="fullscreen"
                    />
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
};

export default NiederschriftPage;

const AssemblyCard = ({
  assembly,
  setViewingDoc,
  coopData,
  assemblyPolls = [],
  afterAction,
  searchTerm = "",
}) => {
  const [open, setOpen] = useState(false);

  const agendaItems = assembly.agendaItems || [];

  const results = assemblyPolls.map((poll, index) => ({
    title: agendaItems[index]?.title || poll.title,
    type: agendaItems[index]?.type || "report",
    description: agendaItems[index]?.description || poll.description,
    yes: poll.yesCount || 0,
    no: poll.noCount || 0,
    abstain: poll.abstainCount || 0,
    pollTitle: poll.title,
    pollDescription: poll.description,
    pollId: poll.$id,
    isCritical: poll.isCritical,
  }));
  const isClosed = assembly.status === "closed";

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden transition-all duration-300 bg-white border shadow-sm dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800/50 group">
        <div className="flex flex-col flex-1 gap-3 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2">
                <UserName
                  name={assembly.titleAssembly || "General Assembly"}
                  highlight={searchTerm}
                  className="inline"
                />
              </h3>
              <div className="mt-1.5">
                <span className="inline-flex px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-medium text-slate-500 dark:text-slate-400 font-mono tracking-tight">
                  ID:{" "}
                  <UserName
                    name={assembly.assemblyId}
                    highlight={searchTerm}
                    className="inline font-mono"
                  />
                </span>
              </div>
            </div>
            <div className="shrink-0 pt-0.5">
              {!isClosed ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                  <Activity className="w-3 h-3" />{" "}
                  {normalizeStatus(assembly).toUpperCase()}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                  <CheckCircle2 className="w-3 h-3" /> Closed
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>
                {new Date(
                  assembly.startDateTime || assembly.$createdAt,
                ).toLocaleString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">
              <Users className="w-4 h-4 text-slate-400" />
              Format: {assembly.format || "Unknown"}
            </div>
          </div>

          <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span>Agenda Items: {results.length}</span>
              <span>
                Votes Cast:{" "}
                {assembly.votes[0]?.yesCount !== undefined
                  ? assembly.votes[0].yesCount +
                    assembly.votes[0].noCount +
                    assembly.votes[0].abstainCount
                  : 0}
              </span>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          {!isClosed ? (
            <div className="w-full px-4 py-2.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
              Available after assembly closes
            </div>
          ) : assembly.hasNiederschrift ? (
            <div className="flex flex-col gap-2">
              <div className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl py-2">
                <CheckCircle2 className="w-4 h-4" /> Niederschrift Submitted
              </div>
              <button
                onClick={() => {
                  setViewingDoc({
                    fileUrl: getViewUrl(assembly.niederschriftFileId),
                    fileName: `Niederschrift_${assembly.$id}.pdf`,
                    mimeType: "application/pdf",
                  });
                }}
                className="w-full flex justify-center items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl"
              >
                <FileText className="w-4 h-4" />
                View PDF
              </button>
            </div>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="w-full flex justify-center items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <FileText className="w-4 h-4" /> Finalise Niederschrift
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <NiederschriftModal
            assembly={assembly}
            coopData={coopData}
            results={results}
            onClose={() => setOpen(false)}
            afterAction={async () => {
              await afterAction();
              setOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export const NiederschriftModal = ({
  assembly = [],
  results = [],
  onClose,
  coopData = {},
  setPdfGenerated = () => {},
  afterAction = () => {},
}) => {
  const [chair, setChair] = useState("");
  const [secretary, setSecretary] = useState("");
  const [finalized, setFinalized] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [agendaData, setAgendaData] = useState(
    results.map((item) => ({
      ...item,
      discussion: "",
      resolution: "",
    })),
  );
  let attendance = { presentMembers: 0, presentShares: 0, totalShares: 0 };
  try {
    if (assembly.attendanceSummaryJson) {
      attendance = JSON.parse(assembly.attendanceSummaryJson);
    }
  } catch (e) {
    console.error("Failed to parse attendance", e);
  }

  const membersPresent = attendance.presentMembers || 0;
  const shares = attendance.totalShares || 0;

  const generateAndUploadPDF = async () => {
    setIsGenerating(true);
    try {
      const pdfBlob = await generateNiederschriftPDF({
        assembly,
        agendaData,
        chair,
        secretary,
        cooperativeName: coopData?.name || "",
        coopData,
      });

      const assemblyId =
        assembly?.$id || assembly?.id || assembly?.assemblyId || "";

      const file = new File([pdfBlob], `Niederschrift_${assemblyId}.pdf`, {
        type: "application/pdf",
      });

      if (!assemblyId) {
        throw new Error("Assembly ID missing");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("assemblyId", assemblyId);
      formData.append("coopId", assembly.coopId);
      formData.append("chair", chair);
      formData.append("secretary", secretary);

      const res = await fetch("/api/assembly/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      toast.success("Niederschrift successfully finalised & stored");

      setFinalized(true);
      setPdfGenerated(true);
      await afterAction();
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload Niederschrift");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateAgenda = (index, field, value) => {
    const updated = [...agendaData];
    updated[index][field] = value;
    setAgendaData(updated);
  };

  const formattedDate = assembly.startDateTime
    ? new Date(assembly.startDateTime).toLocaleString("de-DE", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "-";

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center w-full h-full p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => {
          onClose();
          setPdfGenerated(false);
        }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10, rotateX: -15 }}
        animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10, rotateX: -15 }}
        className="relative w-full max-w-6xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Niederschrift Finalisation
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Mandatory official record pursuant to §47 GenG.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 transition-colors rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-2 lg:p-8">
            <div className="space-y-8">
              <section className="p-5 border bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 rounded-xl">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="w-4 h-4" /> System Data
                  </h3>
                  {assembly.quorumMet ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Quorum Confirmed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50">
                      <XCircle className="w-3.5 h-3.5" /> No Quorum
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 p-3 bg-white border rounded-lg shadow-sm sm:col-span-1 dark:bg-slate-900 border-slate-100 dark:border-slate-700/50">
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                      Cooperative Name
                    </span>
                    <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                      {coopData?.name || "-"}
                    </span>
                  </div>

                  <div className="col-span-2 p-3 bg-white border rounded-lg shadow-sm sm:col-span-1 dark:bg-slate-900 border-slate-100 dark:border-slate-700/50">
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                      Location & Date
                    </span>
                    <span
                      className="block text-sm font-medium truncate text-slate-800 dark:text-slate-200"
                      title={`${assembly.location} — ${assembly.startDateTime}`}
                    >
                      {assembly.location || "Unknown"} — {formattedDate}
                    </span>
                  </div>

                  <div className="col-span-2 p-3 bg-white border rounded-lg shadow-sm sm:col-span-1 dark:bg-slate-900 border-slate-100 dark:border-slate-700/50">
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                      Format
                    </span>
                    <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                      {assembly.format}
                    </span>
                  </div>

                  <div className="col-span-2 p-3 bg-white border rounded-lg shadow-sm sm:col-span-1 dark:bg-slate-900 border-slate-100 dark:border-slate-700/50">
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                      Quorum Present
                    </span>
                    <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                      {assembly.quorum}%
                    </span>
                  </div>
                </div>
              </section>

              <section className="space-y-5">
                <div>
                  <label className="block mb-2 text-xs font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300">
                    Versammlungsleiter{" "}
                    <span className="font-medium tracking-normal lowercase text-slate-400">
                      (Meeting Chair)
                    </span>{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    placeholder="Enter Chair's Name"
                    value={chair}
                    onChange={(e) => setChair(e.target.value)}
                    disabled={finalized}
                    className="w-full px-4 py-3 text-sm transition-all bg-white border outline-none dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder:text-slate-400 disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-xs font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300">
                    Protokollführer{" "}
                    <span className="font-medium tracking-normal lowercase text-slate-400">
                      (Minutes Secretary)
                    </span>{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    placeholder="Enter Secretary's Name"
                    value={secretary}
                    onChange={(e) => setSecretary(e.target.value)}
                    disabled={finalized}
                    className="w-full px-4 py-3 text-sm transition-all bg-white border outline-none dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder:text-slate-400 disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-800"
                  />
                </div>
              </section>

              <section className="p-5 border bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30 rounded-xl">
                <h3 className="flex items-center gap-2 mb-4 text-xs font-bold tracking-widest uppercase text-amber-800 dark:text-amber-500">
                  <FileText className="w-4 h-4" /> Digital Signatures
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-amber-900 dark:text-amber-400 mb-1.5">
                      Chair Signature (Type Name){" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      placeholder="Type chair name to sign"
                      value={chair}
                      onChange={(e) => setChair(e.target.value)}
                      disabled={finalized}
                      className="w-full px-3 py-2 font-serif text-sm transition-all bg-white border rounded-lg outline-none dark:bg-slate-900 border-amber-300 dark:border-amber-700/50 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 placeholder:text-slate-400 disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-900 dark:text-amber-400 mb-1.5">
                      Secretary Signature (Type Name){" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      placeholder="Type secretary name to sign"
                      value={secretary}
                      onChange={(e) => setSecretary(e.target.value)}
                      disabled={finalized}
                      className="w-full px-3 py-2 font-serif text-sm transition-all bg-white border rounded-lg outline-none dark:bg-slate-900 border-amber-300 dark:border-amber-700/50 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 placeholder:text-slate-400 disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-800"
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              {agendaData.map((item, index) => {
                const passed = item.yes >= item.no;

                return (
                  <section
                    key={index}
                    className="flex flex-col overflow-hidden bg-white border shadow-sm border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between px-5 py-4 border-b bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 shrink-0">
                      <h3 className="font-bold text-slate-800 dark:text-slate-200">
                        TOP {index + 1}: {item.title}
                      </h3>
                      <span
                        className={`shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          passed
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400"
                        }`}
                      >
                        {passed ? "Passed" : "Rejected"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-5 p-5">
                      <div className="flex flex-col">
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                          Summary of Discussion
                        </label>
                        <textarea
                          placeholder="Briefly summarize key points discussed..."
                          value={item.discussion}
                          onChange={(e) =>
                            updateAgenda(index, "discussion", e.target.value)
                          }
                          disabled={finalized}
                          className="w-full min-h-[80px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all resize-y placeholder:text-slate-400 disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-800"
                        />
                      </div>

                      {item.type === "BESCHLUSSFASSUNG" && (
                        <div className="flex flex-col">
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                            Resolution Text (Beschlussfassung) *
                          </label>

                          <textarea
                            placeholder="Exact text of the proposed resolution..."
                            value={item.resolution}
                            onChange={(e) =>
                              updateAgenda(index, "resolution", e.target.value)
                            }
                            disabled={finalized}
                            className="w-full min-h-[100px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all resize-y placeholder:text-slate-400 disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-800"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-around gap-4 p-4 border bg-slate-50 dark:bg-slate-800/40 rounded-xl border-slate-100 dark:border-slate-700/50 shrink-0">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            Yes
                          </span>
                          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                            {item.yes}
                          </span>
                        </div>
                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            No
                          </span>
                          <span className="text-xl font-black text-rose-600 dark:text-rose-400">
                            {item.no}
                          </span>
                        </div>
                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            Abs
                          </span>
                          <span className="text-xl font-black text-slate-600 dark:text-slate-300">
                            {item.abstain}
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 shrink-0">
          <button
            onClick={() => {
              onClose();
              setPdfGenerated(false);
            }}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700"
          >
            {finalized ? "Close" : "Cancel"}
          </button>

          <button
            onClick={generateAndUploadPDF}
            disabled={
              finalized ||
              isGenerating ||
              !chair ||
              !secretary ||
              agendaData.some(
                (a) =>
                  !a.discussion?.trim() ||
                  (a.type === "BESCHLUSSFASSUNG" && !a.resolution?.trim()),
              )
            }
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl transition-all shadow-sm shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          >
            {finalized ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Submitted
              </>
            ) : isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <CircleCheck className="w-4 h-4" />
                Finalise & Generate PDF
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
};
