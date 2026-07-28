"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  FileText,
  MessageSquare,
  Search,
  X,
  Clock,
  User,
  Tag,
  Send,
} from "lucide-react";
import {
  getTicketComments,
  addTicketComment,
  getTicketsByAuditor,
  markTicketInProgress,
  markTicketCompleted,
  markTicketCancelled,
  getTicketsByCoop,
} from "../../lib/ticketService";

import { AuditStatusColors, AuditStatusEnum } from "../../lib/AuditStatus";
import useCoopCache from "../../hooks/useCoopCache";
import Coopname from "../coopComponent/Coopname";
import UserName from "../userComponent/UserName";
import { useAuth } from "../../hooks/useAuth";

// Helper: format ISO to readable date/time
const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : "-");

// Helper: get initials from a name/email
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
  const STATUS_COLORS = {
    Issued: "bg-tint text-blue-primary dark:bg-primary-dark-900 dark:text-blue-200",
    InProgress:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    InReview:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    Completed:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    Cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  const STATUS_LABELS = {
    Issued: "Issued",
    InProgress: "In Progress",
    InReview: "In Review",
    Completed: "Completed",
    Cancelled: "Cancelled",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STATUS_COLORS[status] ||
        "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      }`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
};

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-800 flex flex-col">
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
        <div className="flex-1 p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

// 👉 auditorId required to scope tickets
export default function TicketsAuditView() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null); // ticket document
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // new comment state
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  const { getCoopNameById } = useCoopCache();
  const { user } = useAuth();

  const auditorId = user?.teamMemberId;

  // fetch tickets for this auditor
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        if (!auditorId) throw new Error("Missing auditorId");
        const docs = await getTicketsByAuditor(auditorId, { order: "desc" });
        if (!mounted) return;
        setTickets(docs || []);
      } catch (e) {
        console.error(e);
        setError("Failed to load tickets.");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [auditorId]);

  // Filtered via subject / coop / auditor (still useful client-side)
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return tickets;
    return tickets.filter((t) => {
      const subject = String(t.subject || "").toLowerCase();
      const forCoop = String(t.forCoop || "").toLowerCase();
      const auditor = String(t.leadAuditor || "").toLowerCase();
      return (
        subject.includes(query) ||
        forCoop.includes(query) ||
        auditor.includes(query)
      );
    });
  }, [tickets, q]);

  const openTicket = async (t) => {
    setSelected(t);
    setComments([]);
    setNewComment("");
    setPostError("");
    setCommentsLoading(true);
    try {
      const list = await getTicketComments(t.id, "asc");
      setComments(list || []);
    } catch (e) {
      console.error(e);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const submitComment = useCallback(async () => {
    if (!selected || !newComment.trim()) return;
    setPosting(true);
    setPostError("");

    const creatorEmail = user?.email || user?.name || user?.$id || "Unknown";

    // optimistic comment
    const optimistic = {
      creator: creatorEmail,
      text: newComment.trim(),
      timestamp: new Date().toISOString(),
    };
    setComments((prev) => [...prev, optimistic]);

    try {
      await addTicketComment(selected.id, optimistic);
      setNewComment("");
    } catch (err) {
      console.error(err);
      setPostError("Failed to add comment.");
      // rollback optimistic append
      setComments((prev) => prev.filter((c) => c !== optimistic));
    } finally {
      setPosting(false);
    }
  }, [selected, newComment, user]);

  const onTextareaKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submitComment();
    }
  };

  // Change status via provided helpers
  const changeStatus = useCallback(async (ticketId, newStatus) => {
    try {
      if (newStatus === "InProgress") await markTicketInProgress(ticketId);
      else if (newStatus === "Completed") await markTicketCompleted(ticketId);
      else if (newStatus === "Cancelled") await markTicketCancelled(ticketId);
      // Update local table list
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
      );
      // Update currently open modal ticket
      setSelected((prev) =>
        prev && prev.id === ticketId ? { ...prev, status: newStatus } : prev
      );
    } catch (err) {
      console.error("Failed to update status", err);
    }
  }, []);

  return (
    <div className="min-h-screen p-6 animate-fadeIn bg-gray-50 dark:bg-slate-900">
      <div className="flex flex-col items-start justify-between gap-3 mb-6 sm:flex-row sm:items-center">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Audited Tickets
        </h2>
        <div className="relative w-full sm:w-80">
          <Search
            className="absolute text-gray-400 -translate-y-1/2 pointer-events-none left-3 top-1/2"
            size={18}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by subject, coop, or auditor"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-700 shadow-sm outline-none placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 dark:placeholder:text-gray-500"
          />
        </div>
      </div>

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
                <th className="p-4">Coop</th>
                <th className="p-4">Lead Auditor</th>
                <th className="p-4">Status</th>
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
                      <div className="flex items-center justify-center text-blue-600 bg-tint rounded-lg h-9 w-9 dark:bg-primary-dark-900/40 dark:text-blue-300">
                        <FileText size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {t.subject || "(No subject)"}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {t.id}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Coopname id={t.forCoop} />
                  </td>

                  <td className="p-4">
                    <UserName name={t.leadAuditorName} email={t.leadAuditorEmail} allowEmailCopy={true} />
                  </td>

                  <td className="p-4 text-gray-600 whitespace-nowrap dark:text-gray-300">
                    {t.status && <StatusBadge status={t.status} />}
                  </td>

                  <td className="p-4 text-gray-600 whitespace-nowrap dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span title={fmt(t.updatedAt)}>{fmt(t.updatedAt)}</span>
                    </div>
                  </td>

                  <td className="p-4">
                    <button
                      className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-slate-700"
                      title="View details"
                      onClick={() => openTicket(t)}
                    >
                      <MessageSquare size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Ticket Details */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={
          selected ? selected.subject || "Ticket Details" : "Ticket Details"
        }
      >
        {selected && (
          <div className="space-y-6">
            {/* Key fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="p-4 border border-gray-100 rounded-xl dark:border-slate-700">
                <div className="mb-1 text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Ticket ID
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {selected.id}
                </div>
              </div>

              {/* Editable Status */}
              <div className="p-4 border border-gray-100 rounded-xl dark:border-slate-700">
                <div className="mb-1 text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Status
                </div>
                <div className="flex items-center gap-2">
                  {selected.status && <StatusBadge status={selected.status} />}
                  <select
                    value={selected.status || "InProgress"}
                    onChange={(e) => changeStatus(selected.id, e.target.value)}
                    className="w-full p-2 text-sm text-gray-800 bg-white border border-gray-200 rounded-lg dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100"
                  >
                    <option value="InProgress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
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
                  <User size={16} /> <UserName name={selected.leadAuditorName} />
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

              {/* Scrollable comments box */}
              <div className="p-2 pr-2 overflow-y-auto border border-gray-200 rounded-lg max-h-64 dark:border-slate-700">
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
                          {initials(c.creator)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {c.creator || "Unknown"}
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

              {/* Add Comment box */}
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
                    <Send size={16} />
                    {posting ? "Posting…" : "Post comment"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
}

