"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";

import { getAllEmployeeAuditersService } from "../../lib/allUsersService";
import {
  assignAuditorsToCoop,
  getCoopAuditerIds,
} from "../../lib/addCoopService";

import { notifyNewAuditorAuditAssigned } from "@/lib/customNotificationTemplates";

/** Human-friendly label from an auditor object */
function auditorLabel(a) {
  return (
    a?.name ||
    a?.fullName ||
    a?.displayName ||
    (a?.email ? `${a.email}` : null) ||
    a?.id ||
    "Unknown"
  );
}

/** Click-outside hook */
function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

/**
 * Button + Modal to select multiple auditors and assign them to a Coop.
 * Props:
 *   - coopId: string (required)
 *  - coopName: string (required)
 */
export default function AssignAuditorsButton({ coopId, coopName }) {
  // console.log("AssignAuditorsButton coopName:", coopName);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [auditors, setAuditors] = useState([]);
  /** selected is an ARRAY of auditor ID strings */
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [currentAudId, setCurrentAudId] = useState([]);

  const modalRef = useRef(null);
  useOnClickOutside(modalRef, () => setOpen(false));

  // Prefetch currently assigned auditors for the coop and the master list
  useEffect(() => {
    if (!open) return; // lazy-load when modal opens

    let cancelled = false;
    async function init() {
      setLoading(true);
      setError("");
      try {
        // Fetch master list of auditors
        const list = await getAllEmployeeAuditersService();
        if (!cancelled) setAuditors(Array.isArray(list) ? list : []);

        // Fetch already-assigned auditor IDs for this coop
        const current = await getCoopAuditerIds(coopId);
        setCurrentAudId(current);
        // Normalize to array of strings and de-dup
        const normalized = Array.isArray(current)
          ? Array.from(new Set(current.map((x) => String(x))))
          : [];
        if (!cancelled) setSelected(normalized);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(e?.message || "Failed to load auditors.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [open, coopId]);

  // Filtered auditors by query
  const filtered = useMemo(() => {
    const q = (query || "").toLowerCase();
    if (!q) return auditors;
    return auditors.filter((a) => {
      const label = String(auditorLabel(a) || "").toLowerCase();
      const email = String(a?.email || "").toLowerCase();
      return label.includes(q) || email.includes(q);
    });
  }, [auditors, query]);

  // Toggle selection (array version)
  function toggle(id) {
    const idStr = String(id);
    setSelected((prev) =>
      prev.includes(idStr) ? prev.filter((x) => x !== idStr) : [...prev, idStr]
    );
  }

  // Save changes
  async function onSave(currentAudId, coopName) {
    setSaving(true);
    setError("");
    try {
      await assignAuditorsToCoop(coopId, selected);
      notifyNewAuditorAuditAssigned(coopName, selected, currentAudId);
      setOpen(false);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to assign auditors.");
    } finally {
      setSaving(false);
    }
  }

  // Keyboard: close on ESC
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="inline-block">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 text-white transition-all bg-blue-600 shadow-sm rounded-2xl hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        Assign Auditors
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          role="dialog"
          aria-modal="true"
        >
          <div
            ref={modalRef}
            className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl dark:bg-slate-900"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Select auditors for Coop{" "}
                <span className="font-mono text-blue-600">{coopId}</span>
              </h2>
              <button
                className="px-3 py-1 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-4">
              {error && (
                <div className="px-4 py-2 mb-3 text-sm text-red-700 border border-red-200 rounded-xl bg-red-50">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Search auditors by name or email"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full px-3 py-2 border outline-none rounded-xl focus:ring-2 focus:ring-primary/80 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
                <span className="px-3 py-2 text-sm shrink-0 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {selected.length} selected
                </span>
              </div>

              <div className="overflow-auto border h-72 rounded-xl dark:border-slate-800">
                {loading ? (
                  <div className="flex items-center justify-center h-72 text-slate-500">
                    Loading auditors…
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex items-center justify-center h-72 text-slate-500">
                    No auditors found.
                  </div>
                ) : (
                  <ul className="divide-y dark:divide-slate-800">
                    {filtered.map((a) => {
                      const rawId = a?.id || a?.$id;
                      const id = String(rawId);
                      const label = auditorLabel(a);
                      const email = a?.email;
                      const checked = selected.includes(id);
                      return (
                        <li
                          key={id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <input
                            id={`aud-${id}`}
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(id)}
                            className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-primary"
                          />
                          <label
                            htmlFor={`aud-${id}`}
                            className="flex items-center justify-between w-full cursor-pointer"
                          >
                            <div className="min-w-0">
                              <div className="font-medium truncate text-slate-800 dark:text-slate-100">
                                {label}
                              </div>
                              {email && (
                                <div className="text-sm truncate text-slate-500">
                                  {email}
                                </div>
                              )}
                            </div>
                            {checked && (
                              <span className="px-2 py-1 text-xs font-medium text-blue-700 rounded-lg bg-blue-50">
                                selected
                              </span>
                            )}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t dark:border-slate-800">
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onSave(currentAudId, coopName)}
                disabled={saving}
                className="px-5 py-2 font-medium text-white bg-blue-600 rounded-2xl hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

AssignAuditorsButton.propTypes = {
  coopId: PropTypes.string.isRequired,
};
