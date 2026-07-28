"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuditDetails, createComment } from "@/lib/auditDetailService";
import { useAuth } from "@/hooks/useAuth";
import { DateTime } from "luxon";
import {
  ArrowLeft,
  ClipboardCheck,
  Hash,
  Clock,
  CalendarDays,
  RefreshCw,
  UserCheck,
  Users,
  ShieldCheck,
  MessageSquare,
  Send,
  Palette,
} from "lucide-react";
import { STATUS_STYLES } from "./MyAudits";

const AUDIT_TYPE_COLOR = {
  simple: {
    variant: "simple",
    dot: "bg-emerald-500",
    ring: "ring-emerald-100",
    label: "Simple",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  full: {
    variant: "full",
    blocks: ["bg-blue-600", "bg-indigo-500", "bg-purple-500"],
    label: "Full",
    bg: "bg-violet-50",
    text: "text-violet-700",
  },
};

const resolveAuditTypeColor = (rawType) => {
  if (!rawType) return null;
  const key = rawType.toLowerCase().trim();
  return (
    AUDIT_TYPE_COLOR[key] ?? {
      variant: "simple",
      dot: "bg-slate-500",
      ring: "ring-slate-100",
      label: rawType,
      bg: "bg-slate-50",
      text: "text-slate-700",
    }
  );
};

const fmtDateTime = (iso) =>
  iso ? DateTime.fromISO(iso).toFormat("dd MMM yyyy, hh:mm a") : "—";

const fmtRelative = (iso) => (iso ? DateTime.fromISO(iso).toRelative() : "—");

const AuditDetails = ({ onBack }) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const auditId = searchParams.get("auditId");

  const parsedAuditJson = (() => {
    try {
      return audit?.auditJson ? JSON.parse(audit.auditJson) : null;
    } catch {
      return null;
    }
  })();

  const cooperativeName = parsedAuditJson?.cooperativeName || "—";
  const auditTitle = parsedAuditJson?.title || "Untitled Audit";
  const submittedBy = parsedAuditJson?.submittedBy || "—";
  const completedAt = parsedAuditJson?.completedAt || null;

  // auditType: top-level field first, fall back to parsed json
  const rawAuditType = audit?.auditType || parsedAuditJson?.auditType || null;
  const typeColor = resolveAuditTypeColor(rawAuditType);

  const fetchAuditDetails = async () => {
    setLoading(true);
    try {
      const data = await getAuditDetails({ historyId: auditId });
      setAudit(data?.auditDetails || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auditId) fetchAuditDetails();
  }, [auditId]);

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    try {
      setSubmittingComment(true);
      await createComment({ historyId: auditId, comment });
      setComment("");
      setAudit((prev) => ({
        ...prev,
        comments: [
          ...(prev?.comments || []),
          {
            comment,
            timestamp: new Date().toISOString(),
            commenterName: "You",
            commenterEmail: user?.email,
            createdBy: user?.email,
            commenterMemberId: user?.teamMemberId,
          },
        ],
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="min-h-screen p-2 antialiased bg-slate-50/50 dark:bg-slate-700/50">
      {/* ── Top Nav ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-5 bg-white border border-slate-200/80 rounded-lg shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] mb-2 dark:bg-slate-800 dark:border-slate-600/80">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all bg-white border group text-slate-600 border-slate-200 rounded-xl hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-200 dark:text-slate-700 dark:border-slate-600/80 dark:hover:bg-slate-600 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Back to My Audits
        </button>

        <button
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-xl transition-all hover:bg-slate-800 shadow-sm hover:shadow active:scale-[0.98] dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => router.push(`/audit/${audit.coopId}/${auditId}?review=true`)}
          disabled={
            (user.role === "aud_E" && audit?.isSubApproved !== null) || !audit
          }
        >
          <ClipboardCheck className="w-4 h-4" />
          Review Now
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center w-full p-20 bg-white border border-slate-200/80 rounded-lg min-h-[400px] dark:bg-slate-800 dark:border-slate-600/80">
          <div className="w-8 h-8 mb-4 border-4 rounded-full border-slate-200 border-t-slate-900 animate-spin" />
          <p className="text-sm font-medium tracking-wide text-slate-500">
            Loading audit details...
          </p>
        </div>
      ) : (
        <div className="grid items-start grid-cols-1 gap-2 lg:grid-cols-3">
          {/* ── Left column ─────────────────────────────────────────────────── */}
          <div className="space-y-2 lg:col-span-2">
            {/* Primary Details */}
            <div className="p-6 md:p-8 bg-white border border-slate-200/80 rounded-lg shadow-[0_4px_12px_-5px_rgba(0,0,0,0.03)] dark:bg-slate-800 dark:border-slate-600/80">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-700">
                <div>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md dark:bg-blue-900/30 dark:text-blue-400">
                    {auditTitle}
                  </span>
                  <h1 className="mt-2 text-2xl font-bold tracking-tight truncate text-slate-900 dark:text-slate-200">
                    {cooperativeName}
                  </h1>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1.5 text-sm font-semibold rounded-full tracking-wide ${STATUS_STYLES[audit?.status] || "bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-300"}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 opacity-75" />
                  {audit?.status?.replace(/_/g, " ") || "UNASSIGNED"}
                </span>
              </div>

              <div className="grid grid-cols-1 mt-6 sm:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 dark:text-slate-300">
                    <Hash className="w-3 h-3" /> Audit Registry ID
                  </p>
                  <p className="mt-1 font-mono text-sm text-slate-700 dark:text-slate-300">
                    {audit?.id || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 dark:text-slate-300">
                    <Clock className="w-3 h-3" /> Deadline
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-300">
                    {audit?.deadline
                      ? fmtDateTime(audit.deadline)
                      : "No deadline set"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 dark:text-slate-300">
                    <CalendarDays className="w-3 h-3" /> Created At
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {fmtDateTime(audit?.createdAt)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 dark:text-slate-300">
                    {fmtRelative(audit?.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 dark:text-slate-300">
                    <RefreshCw className="w-3 h-3" /> Last Updated
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {fmtDateTime(audit?.updatedAt)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 dark:text-slate-300">
                    {fmtRelative(audit?.updatedAt)}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 dark:text-slate-300">
                    <UserCheck className="w-3 h-3" /> Submitted By
                  </p>
                  <p className="mt-1 font-mono text-sm text-slate-700 dark:text-slate-300">
                    {submittedBy}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 dark:text-slate-300">
                    <CalendarDays className="w-3 h-3" /> Form Completed At
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {fmtDateTime(completedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-1 dark:text-slate-300">
                    <Palette className="w-3 h-3" /> Audit Type
                  </p>
                  {typeColor ? (
                    <span
                      className={`text-sm font-bold px-2.5 py-1 rounded-md ${typeColor.bg} ${typeColor.text}`}
                    >
                      {typeColor.label}
                    </span>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="p-6 md:p-8 bg-white border border-slate-200/80 rounded-lg shadow-[0_4px_12px_-5px_rgba(0,0,0,0.03)] dark:bg-slate-800 dark:border-slate-600/80">
              <h3 className="flex items-center gap-2 pb-3 mb-6 text-sm font-bold tracking-wider uppercase border-b text-slate-900 border-slate-100 dark:text-slate-200 dark:border-slate-700">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                Comments
              </h3>

              <div className="space-y-4 mb-6 max-h-[380px] overflow-y-auto ">
                {audit?.comments?.length ? (
                  audit.comments.map((item, index) => {
                    const itemEmail =
                      item.commenterEmail || item.createdBy || "";
                    const isCurrentUser =
                      user?.email &&
                      itemEmail &&
                      itemEmail.toLowerCase() === user.email.toLowerCase();

                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-xl border transition-all ${
                          isCurrentUser
                            ? "bg-slate-50/80 border-slate-300/80 shadow-sm dark:bg-slate-700/50 dark:border-slate-600/80"
                            : "bg-white border-slate-200/70 mr-6 dark:bg-slate-800 dark:border-slate-600/80"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-bold ${isCurrentUser ? "text-blue-700 dark:text-blue-300" : "text-slate-800 dark:text-slate-300"}`}
                            >
                              {item.commenterEmail}
                            </span>
                            {isCurrentUser && (
                              <span className="text-[9px] bg-blue-100 text-blue-800 font-extrabold tracking-wide uppercase px-1.5 py-0.5 rounded">
                                You
                              </span>
                            )}
                          </div>
                          {item.timestamp && (
                            <span
                              className="text-[10px] text-slate-400"
                              title={fmtDateTime(item.timestamp)}
                            >
                              {fmtRelative(item.timestamp)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                          {item.comment || item.text}
                        </p>
                        {!isCurrentUser && (
                          <p className="text-[10px] text-slate-400 mt-2 font-mono dark:text-slate-400">
                            {item.commenterName}
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 dark:text-slate-300 dark:border-slate-600/80">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300 " />
                    <p className="text-sm font-medium">No comments yet.</p>
                  </div>
                )}
              </div>

              {/* Add comment */}
              <div className="mt-4 space-y-3">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="w-full p-4 text-sm transition-all bg-white border resize-none text-slate-800 border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 dark:bg-slate-800 dark:border-slate-600/80 dark:text-slate-300 dark:placeholder-slate-500"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleAddComment}
                    disabled={submittingComment || !comment.trim()}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white transition-all shadow-sm bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-300"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {submittingComment ? "Posting..." : "Add Comment"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right column ────────────────────────────────────────────────── */}
          <div className="space-y-2">
            {/* Lead Auditor */}
            <div className="p-6 bg-white border border-slate-200/80 rounded-lg shadow-[0_4px_12px_-5px_rgba(0,0,0,0.03)] dark:bg-slate-800 dark:border-slate-600/80">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" /> Lead Auditor
              </h3>
              {audit?.leadAuditor ? (
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center text-sm font-bold text-white rounded-full shadow-sm w-9 h-9 bg-slate-900 shrink-0 dark:bg-slate-200 dark:text-slate-900">
                    {audit.leadAuditor.name?.charAt(0) || "A"}
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex gap-1">
                      <p className="text-sm font-semibold truncate text-slate-900 dark:text-slate-300">
                        {audit.leadAuditor.name}
                      </p>
                      {audit.leadAuditor?.email === user.email && (
                        <span className="text-[9px] bg-blue-100 text-blue-800 font-extrabold tracking-wide uppercase px-1.5 py-0.5 rounded h-fit dark:bg-blue-900/30 dark:text-blue-300">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 truncate font-mono mt-0.5 dark:text-slate-400">
                      {audit.leadAuditor.email}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm italic font-medium text-slate-400 dark:text-slate-400">
                  No lead auditor assigned.
                </p>
              )}
            </div>

            {/* Sub Auditors */}
            <div className="p-6 bg-white border border-slate-200/80 rounded-lg shadow-[0_4px_12px_-5px_rgba(0,0,0,0.03)] dark:bg-slate-800 dark:border-slate-600/80 ">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Sub-Auditors
              </h3>
              {audit?.subAuditors?.length ? (
                <div className="space-y-2">
                  {audit.subAuditors.map((auditor) => (
                    <div
                      key={auditor.id}
                      className="flex items-center gap-3 py-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all dark:hover:bg-slate-700 dark:hover:border-slate-600/80"
                    >
                      <div className="flex items-center justify-center w-8 h-8 text-base font-bold border rounded-full bg-slate-100 text-slate-700 shrink-0 border-slate-200">
                        {auditor.name?.charAt(0) || "U"}
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex gap-1">
                          <p className="font-semibold truncate text- text-slate-900 dark:text-slate-300">
                            {auditor.name}
                          </p>
                          {auditor.email === user.email && (
                            <span className="text-[9px] bg-blue-100 text-blue-800 font-extrabold tracking-wide uppercase px-1.5 py-0.5 rounded h-fit dark:bg-blue-900/30 dark:text-blue-300">
                              You
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-xs truncate text-slate-500 dark:text-slate-400">
                          {auditor.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm italic font-medium text-slate-400 dark:text-slate-400">
                  No sub auditors assigned.
                </p>
              )}
            </div>

            {/* Approval Status */}
            <div className="p-6 bg-white border border-slate-200/80 rounded-lg shadow-[0_4px_12px_-5px_rgba(0,0,0,0.03)] dark:bg-slate-800 dark:border-slate-600/80">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Approval Status
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-300">
                      Sub-Auditor Approval
                    </p>
                  </div>
                  <span
                    className={`text-sm font-bold px-2.5 py-1 rounded-md ${
                      audit?.isSubApproved === null
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                        : audit?.isSubApproved
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                    }`}
                  >
                    {audit?.isSubApproved === null
                      ? "Pending"
                      : audit?.isSubApproved
                        ? "Approved"
                        : "Rejected"}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-300">
                    Reviewed By
                  </p>
                  <p className="p-2 mt-1 font-mono text-sm truncate border rounded-lg text-slate-600 bg-slate-50 border-slate-200/60 dark:text-slate-400 dark:bg-slate-700 dark:border-slate-600/80">
                    {audit?.subReviewedBy || "Awaiting review"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditDetails;
