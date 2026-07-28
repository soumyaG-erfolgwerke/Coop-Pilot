"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  X,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Tag,
  User,
  FileText,
} from "lucide-react";
import { createTicket } from "../../lib/ticketService";
import { useAuth } from "../../hooks/useAuth";
import FadePopUp from "../FadePopUp";
import { createPortal } from "react-dom";

// Self-contained component that renders a single button.
// It manages its own open/close state and creation flow.
// The ONLY prop it accepts is `coopid`.
export default function CreateTicketButton({ coopid, auditId }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [scope, setScope] = useState("");
  const [leadAuditor, setLeadAuditor] = useState("");
  const [status] = useState("Issued"); // default, hidden (kept in payload)

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { user } = useAuth();

  // Reset fields whenever modal opens
  useEffect(() => {
    if (open) {
      setSubject("");
      setScope("");
      setLeadAuditor("");
      setError("");
      setSuccess("");
    }
  }, [open]);

  // Basic validation
  const canSubmit = useMemo(
    () => subject.trim().length >= 3 && !!coopid && !submitting,
    [subject, coopid, submitting],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        subject: subject.trim(),
        scope: scope.trim(),
        status, // default 'Issued'
        leadAuditor: user.teamMemberId,
        auditId: auditId || null,
        forCoop: coopid,
        comments: [],
      };
      const created = await createTicket(payload);
      if (!created) throw new Error("Create returned empty response");

      setSuccess("Ticket created successfully.");

      // Optionally inform the app without props: fire a DOM CustomEvent the parent can listen to
      // window.dispatchEvent(new CustomEvent("ticket:created", { detail: created }));

      // Auto-close after a brief delay to show success
      setTimeout(() => setOpen(false), 500);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to create ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-all bg-blue-700 border border-transparent rounded-md shadow-sm hover:bg-blue-800 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        onClick={() => setOpen(true)}
      >
        <Plus size={16} /> Create Ticket
      </button>

      {/* Modal */}
      {typeof window !== "undefined" && createPortal(
        <FadePopUp
          isOpen={open}
          onClose={() => setOpen(false)}
          className="relative z-10 w-full max-w-2xl p-0 bg-white shadow-xl rounded-2xl dark:bg-slate-800"
          overlayClassName="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <div className="relative z-10 w-full max-w-2xl p-5 bg-white shadow-xl rounded-2xl dark:bg-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add Ticket
              </h3>
              <button
                className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-slate-700"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Alerts */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 mb-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 px-3 py-2 mb-3 text-sm text-green-700 border border-green-200 rounded-lg bg-green-50 dark:border-green-900/40 dark:bg-green-950/40 dark:text-green-200">
                <CheckCircle size={16} />
                <span>{success}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 text-xs font-medium tracking-wide text-gray-600 uppercase dark:text-gray-300">
                  Subject
                </label>
                <div className="relative">
                  <input
                    className="w-full px-3 py-2 text-sm text-gray-800 bg-white border border-gray-200 shadow-sm outline-none rounded-xl placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100"
                    placeholder="e.g., Quarterly Financial Audit"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    minLength={3}
                  />
                  <div className="absolute text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2">
                    <FileText size={16} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-xs font-medium tracking-wide text-gray-600 uppercase dark:text-gray-300">
                  Scope (optional)
                </label>
                <textarea
                  className="min-h-[96px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm outline-none placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100"
                  placeholder="Describe the scope..."
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors ${
                    canSubmit
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-blue-300 opacity-70"
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} /> Create Ticket
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </FadePopUp>,
        document.body,
      )}
    </>
  );
}
