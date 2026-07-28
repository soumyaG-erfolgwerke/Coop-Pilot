"use client";
// components/audit/AuditStatusButtons.jsx
import React, { useState } from "react";
import { CheckCircle, RefreshCw, XCircle } from "lucide-react";
// adjust import path if needed:
import {
  setAuditStatusAskedToResubmit,
  setAuditStatusApproved,
  setAuditStatusRejected,
} from "../../lib/AuditService";

const ACTIONS = {
  ASKED_TO_RESUBMIT: {
    label: "Ask to Resubmit",
    fn: setAuditStatusAskedToResubmit,
    Icon: RefreshCw,
    classes: "bg-amber-600 hover:bg-amber-700",
  },
  APPROVED: {
    label: "Approve",
    fn: setAuditStatusApproved,
    Icon: CheckCircle,
    classes: "bg-emerald-600 hover:bg-emerald-700",
  },
  REJECTED: {
    label: "Reject",
    fn: setAuditStatusRejected,
    Icon: XCircle,
    classes: "bg-rose-600 hover:bg-rose-700",
  },
};

export default function AuditStatusButtons({
  coopId,
  currentStatus,
  onUpdated,
}) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");

  const update = async (next) => {
    if (!coopId || loading) return;
    setError("");
    setLoading(next);
    try {
      await ACTIONS[next].fn(coopId);
      onUpdated?.(next); // let parent update UI optimistically
    } catch (e) {
      console.error(e);
      setError("Failed to update audit status.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {Object.entries(ACTIONS).map(([key, { label, Icon, classes }]) => (
        <button
          key={key}
          type="button"
          onClick={() => update(key)}
          disabled={loading === key || currentStatus === key}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition focus:outline-none disabled:opacity-50 ${classes}`}
          title={label}
        >
          <Icon size={14} />
          {loading === key ? "Updating…" : label}
        </button>
      ))}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
