import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
  memo,
} from "react";
import {
  FileText,
  MessageSquare,
  Search,
  X,
  Clock,
  User,
  Tag,
  Send,
  ExternalLink,
  ShieldCheck,
  Eye,
  Download,
  Check,
  Copy,
  Filter,
  Loader2,
} from "lucide-react";
import {
  getTicketsByCoop,
  getTicketComments,
  addTicketComment,
  markTicketInProgress,
  markTicketInReview,
  markTicketCompleted,
  markTicketCancelled,
  // markTicketInReview, // if available
} from "../../lib/ticketService";
import Coopname from "../coopComponent/Coopname";
import UserName from "../userComponent/UserName";
import highlightText from "../ui/highlightText";
import { useAuth } from "../../hooks/useAuth";
import AuditDataModal from "./AuditDataModal";
import { getAuditData } from "@/lib/AuditService";
import FadePopUp from "../FadePopUp";

/* ---------- Hoisted & memoized Modal (stable across renders) ---------- */
const Modal = memo(function Modal({ open, onClose, title, children }) {
  // if (!open) return null;
  return (
    <FadePopUp
      isOpen={open}
      onClose={onClose}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      className="relative z-10 w-full max-w-5xl max-h-[80vh] rounded-md bg-white shadow-xl dark:bg-slate-800 flex flex-col overflow-hidden border border-gray-200 dark:border-slate-700"
    >
      {/* <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      /> */}
      <div className="relative z-10 w-full max-w-5xl max-h-[80vh] rounded-md bg-white shadow-xl dark:bg-slate-800 flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <button
            className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-slate-700"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        {/* Keep scroll INSIDE modal body so it doesn't reset page scroll */}
        <div className="flex-1 px-5 py-4 overflow-y-auto">{children}</div>
      </div>
    </FadePopUp>
  );
});

/**
 * AuditView
 * ---------
 * @params :
 *  - coops: Array<{ id: string, name: string }>
 *  - selectedCoop: string (coop id)
 */
export default function AuditView({ coops = [], selectedCoop }) {
  const coop = coops.find((c) => c.id === selectedCoop);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const [auditDataModalOpen, setAuditDataModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterDuration, setFilterDuration] = useState("ALL");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [appliedStatus, setAppliedStatus] = useState("ALL");
  const [appliedDuration, setAppliedDuration] = useState("ALL");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const commentsRef = useRef(null);
  const searchInputRef = useRef(null);
  const filterRef = useRef(null);

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
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    let list = tickets || [];

    // 1. Text Search
    if (q) {
      const pattern = q.toLowerCase().trim();
      list = list.filter((t) => {
        const s = (t.subject || "").toLowerCase();
        const a = (t.leadAuditorName || "").toLowerCase();
        const st = (t.status || "").toLowerCase();
        const id = (t.$id || t.id || "").toLowerCase();
        return (
          s.includes(pattern) ||
          a.includes(pattern) ||
          st.includes(pattern) ||
          id.includes(pattern)
        );
      });
    }

    // 2. Status Filter
    if (appliedStatus && appliedStatus !== "ALL") {
      list = list.filter((t) => t.status === appliedStatus);
    }

    // 3. Duration Filter
    if (appliedDuration && appliedDuration !== "ALL") {
      const now = new Date();
      list = list.filter((t) => {
        if (!t.createdAt) return false;
        const createdDate = new Date(t.createdAt);

        switch (appliedDuration) {
          case "24h":
            return now - createdDate <= 24 * 60 * 60 * 1000;
          case "7d":
            return now - createdDate <= 7 * 24 * 60 * 60 * 1000;
          case "30d":
            return now - createdDate <= 30 * 24 * 60 * 60 * 1000;
          case "90d":
            return now - createdDate <= 90 * 24 * 60 * 60 * 1000;
          case "custom": {
            let matches = true;
            if (appliedStartDate) {
              const start = new Date(appliedStartDate);
              start.setHours(0, 0, 0, 0);
              matches = matches && createdDate >= start;
            }
            if (appliedEndDate) {
              const end = new Date(appliedEndDate);
              end.setHours(23, 59, 59, 999);
              matches = matches && createdDate <= end;
            }
            return matches;
          }
          default:
            return true;
        }
      });
    }

    // 4. Sorting
    if (sortConfig.key) {
      list.sort((a, b) => {
        const va = (a[sortConfig.key] ?? "").toString().toLowerCase();
        const vb = (b[sortConfig.key] ?? "").toString().toLowerCase();
        if (va < vb) return sortConfig.direction === "ascending" ? -1 : 1;
        if (va > vb) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [
    tickets,
    q,
    appliedStatus,
    appliedDuration,
    appliedStartDate,
    appliedEndDate,
    sortConfig,
  ]);

  const handleViewAuditData = async () => {
    if (!coop?.id) return;
    try {
      setAuditLoading(true);
      const data = await getAuditData(coop.id);

      let parsedAuditData = data[0];

      if (data?.auditData) {
        parsedAuditData =
          typeof data.auditData === "string"
            ? JSON.parse(data.auditData)
            : data.auditData;
      }
      // console.log("Audit data: ", parsedAuditData);
      setAuditData(parsedAuditData);
      setAuditDataModalOpen(true);
    } catch (err) {
      console.error(err);
    } finally {
      setAuditLoading(false);
    }
  };

  // useEffect(()=>console.log("Coopdata: ", coop),[coop])

  const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : "-");
  const initials = (str = "?") => {
    try {
      const clean = String(str).trim();
      if (!clean) return "?";
      const parts = clean.split(/\s+|\./).filter(Boolean);
      const take = (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
      return take.toUpperCase() || clean[0]?.toUpperCase() || "?";
    } catch {
      return "?";
    }
  };
  const StatusBadge = ({ status }) => {
    const COLORS = {
      Issued:
        "bg-tint text-blue-primary dark:bg-primary-dark-900 dark:text-blue-200",
      InProgress:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      InReview:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      Completed:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      Cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          COLORS[status] ||
          "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
        }`}
      >
        {status || "-"}
      </span>
    );
  };
  const AuditStatusPill = ({ value }) => (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200">
      <ShieldCheck size={12} /> {value || "-"}
    </span>
  );

  // Data
  const fetchTickets = useCallback(async () => {
    if (!coop?.id) return;
    try {
      setLoading(true);
      setAuditLoading(true);
      setError("");
      const docs = await getTicketsByCoop(coop.id, { order: "desc" });
      // console.log(docs);
      setTickets(docs || []);
    } catch (e) {
      console.error(e);
      setError("Failed to load tickets.");
      setTickets([]);
    } finally {
      setLoading(false);
      setAuditLoading(false);
    }
  }, [coop?.id]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(text);

      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const viewEdit = async (t) => {
    setSelected(t);
    setOpen(true);
    setComments([]);
    setNewComment("");
    setPostError("");
    setCommentsLoading(true);
    try {
      const list = await getTicketComments(t.$id, "asc");
      setComments(list || []);
    } catch (e) {
      console.error(e);
      setComments([]);
    } finally {
      setCommentsLoading(false);
      // keep at bottom after load
      requestAnimationFrame(() => {
        if (commentsRef.current) {
          commentsRef.current.scrollTop = commentsRef.current.scrollHeight;
        }
      });
    }
  };

  // Status change — only allow InReview action via single button
  const changeStatus = useCallback(async (ticketId, newStatus) => {
    try {
      if (newStatus === "InReview") {
        await markTicketInReview(ticketId); // if API exists
      } else if (newStatus === "InProgress")
        await markTicketInProgress(ticketId);
      else if (newStatus === "Completed") await markTicketCompleted(ticketId);
      else if (newStatus === "Cancelled") await markTicketCancelled(ticketId);

      setTickets((prev) =>
        prev.map((t) => (t.$id === ticketId ? { ...t, status: newStatus } : t)),
      );
      setSelected((prev) =>
        prev && prev.$id === ticketId ? { ...prev, status: newStatus } : prev,
      );
    } catch (err) {
      console.error("Failed to update status", err);
    }
  }, []);

  // Add comment — store/display coop name as the author
  const submitComment = useCallback(async () => {
    if (!selected || !newComment.trim()) return;
    setPosting(true);
    setPostError("");

    const creator = coop?.name || "Unknown Coop";
    const optimistic = {
      creator,
      text: newComment.trim(),
      timestamp: new Date().toISOString(),
    };

    setComments((p) => [...p, optimistic]);
    try {
      await addTicketComment(selected.$id, optimistic);
      setNewComment("");
      requestAnimationFrame(() => {
        if (commentsRef.current) {
          commentsRef.current.scrollTop = commentsRef.current.scrollHeight;
        }
      });
    } catch (e) {
      console.error(e);
      setPostError("Failed to add comment.");
      setComments((p) => p.filter((c) => c !== optimistic));
    } finally {
      setPosting(false);
    }
  }, [selected, newComment, coop?.name]);

  const onTextareaKeyDown = (e) => {
    // keep if you want Ctrl/Cmd+Enter submit:
    // if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    //   e.preventDefault();
    //   submitComment();
    // }
  };

  const canOpenAuditPage =
    coop &&
    (coop.auditStatus === "START" ||
      coop.auditStatus === "IN_PROGRESS" ||
      coop.auditStatus === "ASKED_TO_RESUBMIT");

  const hasAppliedFilters =
    appliedStatus !== "ALL" || appliedDuration !== "ALL";

  if (!coop) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-600 dark:text-gray-300">
        Select a cooperative to view tickets.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur dark:bg-slate-900/70">
        <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 text-white bg-blue-600 shadow rounded-xl">
              <FileText size={18} />
            </div>
            <div>
              <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white">
                {coop.name}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tickets & Audit Overview
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleViewAuditData}
              disabled={auditLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition bg-white border border-gray-300 shadow rounded-xl hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="View all audit data"
            >
              {auditLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                </>
              ) : (
                <>
                  <Eye size={16} /> View Current Audit Data
                </>
              )}
            </button>
            <a
              href={canOpenAuditPage ? `/coopaudit/${coop.id}` : "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium shadow transition ${
                canOpenAuditPage
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed"
              }`}
              onClick={(e) => !canOpenAuditPage && e.preventDefault()}
              title={
                canOpenAuditPage
                  ? "Open audit page"
                  : `Cannot access audit page while status is ${coop?.auditStatus}`
              }
            >
              <ExternalLink size={16} />
              Go to Audit Page
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 mx-auto max-w-7xl">
        {/* Search */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="relative flex-grow">
            <Search className="absolute w-4.5 h-4.5 text-slate-400 dark:text-slate-500 -translate-y-1/2 left-3.5 top-1/2 transition-colors pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by subject, auditor, or status..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full pl-11 pr-16 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white/80 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:ring-blue-500/20 text-sm sm:text-base transition-all"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none select-none">
              {q ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setQ("");
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
          {/* Add filter */}
          <div className="relative inline-block text-left" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition rounded-xl border shadow-sm ${
                hasAppliedFilters
                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-900"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <Filter
                size={16}
                className={
                  hasAppliedFilters ? "text-blue-500" : "text-slate-400"
                }
              />
              <span>Filter</span>
              {hasAppliedFilters && (
                <span className="w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>
            {isFilterOpen && (
              <div className="absolute right-0 z-20 p-5 mt-2 transition-all duration-200 origin-top-right transform border shadow-xl w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-slate-200 dark:border-slate-800 rounded-2xl">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Filter Tickets
                  </h3>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="p-1 transition-colors rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-450">
                      Status
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-3 py-2 text-sm transition-all border outline-none cursor-pointer bg-slate-50 dark:bg-slate-955 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-slate-200"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="Issued">Issued</option>
                      <option value="InProgress">InProgress</option>
                      <option value="InReview">InReview</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Duration Filter */}
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-450">
                      Duration
                    </label>
                    <select
                      value={filterDuration}
                      onChange={(e) => setFilterDuration(e.target.value)}
                      className="w-full px-3 py-2 text-sm transition-all border outline-none cursor-pointer bg-slate-50 dark:bg-slate-955 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-slate-200"
                    >
                      <option value="ALL">All Time</option>
                      <option value="24h">Last 24 Hours</option>
                      <option value="7d">Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                      <option value="90d">Last 90 Days</option>
                      <option value="custom">Custom Date Range</option>
                    </select>
                  </div>

                  {/* Custom Date Inputs */}
                  {filterDuration === "custom" && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="block mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full px-2 py-1 text-xs transition-all border rounded-lg outline-none bg-slate-50 dark:bg-slate-955 border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full px-2 py-1 text-xs transition-all border rounded-lg outline-none bg-slate-50 dark:bg-slate-955 border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setFilterStatus("ALL");
                        setFilterDuration("ALL");
                        setCustomStartDate("");
                        setCustomEndDate("");

                        setAppliedStatus("ALL");
                        setAppliedDuration("ALL");
                        setAppliedStartDate("");
                        setAppliedEndDate("");
                        setIsFilterOpen(false);
                      }}
                      className="flex-1 px-3 py-2 text-xs font-semibold transition-all text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => {
                        setAppliedStatus(filterStatus);
                        setAppliedDuration(filterDuration);
                        setAppliedStartDate(customStartDate);
                        setAppliedEndDate(customEndDate);
                        setIsFilterOpen(false);
                      }}
                      className="flex-1 px-3 py-2 text-xs font-semibold text-white transition-all bg-blue-600 shadow-sm hover:bg-blue-700 rounded-xl"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Filters list */}
        {hasAppliedFilters && (
          <div className="flex flex-wrap items-center gap-2 px-1 mb-4">
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
              Active Filters:
            </span>

            {/* Status Pill */}
            {appliedStatus !== "ALL" && (
              <div className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50/80 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50 rounded-xl">
                <span className="uppercase text-[10px] tracking-wider text-blue-500 font-bold">
                  Status:
                </span>
                <span>{appliedStatus}</span>
                <button
                  onClick={() => {
                    setAppliedStatus("ALL");
                    setFilterStatus("ALL");
                  }}
                  className="p-0.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors text-blue-400 hover:text-blue-650 dark:hover:text-blue-200"
                  title="Clear Status Filter"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Duration Pill */}
            {appliedDuration !== "ALL" && (
              <div className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50/80 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50 rounded-xl">
                <span className="uppercase text-[10px] tracking-wider text-blue-500 font-bold">
                  Duration:
                </span>
                <span>
                  {appliedDuration === "custom"
                    ? `${appliedStartDate || "Start"} to ${appliedEndDate || "End"}`
                    : appliedDuration === "24h"
                      ? "Last 24 Hours"
                      : appliedDuration === "7d"
                        ? "Last 7 Days"
                        : appliedDuration === "30d"
                          ? "Last 30 Days"
                          : "Last 90 Days"}
                </span>
                <button
                  onClick={() => {
                    setAppliedDuration("ALL");
                    setFilterDuration("ALL");
                    setAppliedStartDate("");
                    setAppliedEndDate("");
                    setCustomStartDate("");
                    setCustomEndDate("");
                  }}
                  className="p-0.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors text-blue-400 hover:text-blue-650 dark:hover:text-blue-200"
                  title="Clear Duration Filter"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Clear All Button */}
            <button
              onClick={() => {
                setFilterStatus("ALL");
                setFilterDuration("ALL");
                setCustomStartDate("");
                setCustomEndDate("");
                setAppliedStatus("ALL");
                setAppliedDuration("ALL");
                setAppliedStartDate("");
                setAppliedEndDate("");
              }}
              className="pl-1 text-xs font-medium transition-colors text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden bg-white shadow-md rounded-xl dark:bg-slate-800">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-gray-500 dark:text-gray-400">
              Loading tickets...
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-red-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center p-12 text-gray-500 dark:text-gray-400">
              No tickets found.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-left text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-gray-300">
                <tr>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Lead Auditor</th>
                  <th className="p-4">Status</th>
                  {/* <th className="p-4">Audit Status</th> */}
                  <th className="p-4">Last Updated</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="transition-colors border-b hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-700/40"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center text-blue-600 rounded-lg bg-tint h-9 w-9 dark:bg-primary-dark-900/40 dark:text-blue-300">
                          <FileText size={18} />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {highlightText(t.subject || "(No subject)", q)}
                            </span>

                            {/* <button
                              type="button"
                              onClick={() => copyToClipboard(t.$id)}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                              title="Copy Ticket ID"
                            >
                              {copiedId === t.$id ? (
                                <Check size={14} className="text-green-600" />
                              ) : (
                                <Copy size={14} className="text-slate-500" />
                              )}
                            </button> */}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {highlightText(t.id || "--", q)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <UserName name={t.leadAuditorName} highlight={q} />
                    </td>
                    <td className="p-4 text-gray-600 whitespace-nowrap dark:text-gray-300">
                      {t.status && <StatusBadge status={t.status} />}
                    </td>
                    {/* <td className="p-4 text-gray-600 whitespace-nowrap dark:text-gray-300">
                      <AuditStatusPill
                        value={t.auditStatus || t.audit?.status}
                      />
                    </td> */}
                    <td className="p-4 text-gray-600 whitespace-nowrap dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span title={fmt(t.updatedAt)}>{fmt(t.updatedAt)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-slate-700"
                          title="View / Edit"
                          onClick={() => viewEdit(t)}
                        >
                          <MessageSquare size={18} />
                        </button>
                        {/* <a
                          href={`/coopaudit/${coop.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 rounded-full hover:bg-blue-50"
                          onClick={(e) => {
                            e.preventDefault();
                          }}
                          title="Open audit page"
                        >
                          <ExternalLink size={18} />
                        </a> */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        open={open}
        onClose={() => {
          // setSelected(null);
          // setComments([]);
          // setNewComment("");
          // setPostError("");
          setOpen(false);
        }}
        title={
          selected ? selected.subject || "Ticket Details" : "Ticket Details"
        }
      >
        {selected && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="p-4 border border-gray-100 rounded-xl dark:border-slate-700">
                <div className="mb-1 text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Ticket ID
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {selected.id}
                </div>
              </div>
              <div className="p-4 border border-gray-100 rounded-xl dark:border-slate-700">
                <div className="mb-1 text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Status
                </div>
                <div className="flex items-center gap-3">
                  {selected.status && <StatusBadge status={selected.status} />}
                  <button
                    type="button"
                    onClick={() => changeStatus(selected.$id, "InReview")}
                    disabled={selected.status === "InReview"}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg disabled:opacity-60 hover:bg-purple-700"
                    title="Mark ticket as In Review"
                  >
                    <ShieldCheck size={16} /> Mark In Review
                  </button>
                </div>
              </div>
              <div className="p-4 border border-gray-100 rounded-xl dark:border-slate-700">
                <div className="mb-1 text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Cooperative
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                  <Tag size={16} /> <Coopname id={selected.forCoop} />
                </div>
              </div>
              <div className="p-4 border border-gray-100 rounded-xl dark:border-slate-700">
                <div className="mb-1 text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Lead Auditor
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                  <User size={16} />{" "}
                  <UserName name={selected.leadAuditorName} />
                </div>
              </div>
              <div className="p-4 border border-gray-100 rounded-xl dark:border-slate-700 sm:col-span-2">
                <div className="mb-1 text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Scope
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-200">
                  {selected.scope || "-"}
                </div>
              </div>
              <div className="p-4 border border-gray-100 rounded-xl dark:border-slate-700">
                <div className="mb-1 text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Created
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-200">
                  {fmt(selected.createdAt)}
                </div>
              </div>
              <div className="p-4 border border-gray-100 rounded-xl dark:border-slate-700">
                <div className="mb-1 text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Last Updated
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-200">
                  {fmt(selected.updatedAt)}
                </div>
              </div>
            </div>

            {/* Comments */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={18} className="text-gray-500" />
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Comments
                </h4>
                {commentsLoading && (
                  <span className="text-xs text-gray-500">loading...</span>
                )}
              </div>
              <div
                ref={commentsRef}
                className="p-2 pr-2 overflow-y-auto border border-gray-200 rounded-lg max-h-64 dark:border-slate-700"
              >
                {(!comments || comments.length === 0) && !commentsLoading ? (
                  <div className="p-4 text-sm text-center text-gray-500 dark:text-gray-400">
                    No comments yet.
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {comments.map((c, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 p-3 border border-gray-100 rounded-xl dark:border-slate-700"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          {initials(coop?.name || c.creator)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {coop?.name || c.creator || "Unknown Coop"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {fmt(c.timestamp)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">
                            {c.text}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="p-3 mt-4 border border-gray-200 rounded-xl dark:border-slate-700">
                <label
                  htmlFor="new-comment"
                  className="block mb-2 text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400"
                >
                  Add a comment
                </label>
                <textarea
                  id="new-comment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={onTextareaKeyDown}
                  placeholder="Write your comment… (Ctrl/Cmd + Enter to submit)"
                  className="w-full p-3 text-sm text-gray-800 bg-white border border-gray-200 rounded-lg outline-none resize-y placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                  rows={3}
                />
                <div className="flex items-center justify-between mt-2">
                  {postError ? (
                    <span className="text-xs text-red-600">{postError}</span>
                  ) : (
                    <span className="text-xs text-gray-500">
                      Press Ctrl/Cmd + Enter to submit
                    </span>
                  )}
                  <button
                    onClick={submitComment}
                    disabled={posting || !newComment.trim()}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg disabled:opacity-60 hover:bg-blue-700"
                  >
                    <Send size={16} /> {posting ? "Posting…" : "Post comment"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Audit Data Modal */}
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
