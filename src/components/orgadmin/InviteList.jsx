"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getRecentInvites } from "@/lib/gengService";
import { toast } from "react-hot-toast";

const PAGE_SIZE = 10;

function getRelativeTime(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "unknown time";

  const diffMs = date.getTime() - Date.now();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  const rtf = new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
  });

  if (Math.abs(diffMs) < minute) return rtf.format(0, "second");
  if (Math.abs(diffMs) < hour)
    return rtf.format(Math.round(diffMs / minute), "minute");
  if (Math.abs(diffMs) < day)
    return rtf.format(Math.round(diffMs / hour), "hour");
  if (Math.abs(diffMs) < week)
    return rtf.format(Math.round(diffMs / day), "day");

  return rtf.format(Math.round(diffMs / week), "week");
}

export default function InviteList({
  auditOrgId,
  refreshKey,
}) {
  const [invites, setInvites] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInvites = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getRecentInvites(
        auditOrgId,
        page,
        PAGE_SIZE
      );

      setInvites(data.invites || []);
      setPagination(data.pagination);
    } catch (err) {
      toast.error("Failed to load recent invites");
      setError(err.message || "Failed to load recent invites");
    } finally {
      setLoading(false);
    }
  }, [auditOrgId, page]);

  useEffect(() => {
    if (auditOrgId) {
      fetchInvites();
    }
  }, [fetchInvites, refreshKey]);

  useEffect(() => {
    setPage(1);
  }, [auditOrgId]);

  return (
    <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl dark:bg-slate-800 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Recent Invites
      </h3>

      {loading && (
        <p className="mt-3 text-sm text-gray-500">Loading invites...</p>
      )}

      {!loading && error && (
        <p className="mt-3 text-sm text-red-500">{error}</p>
      )}

      {!loading && !error && invites.length === 0 && (
        <p className="mt-3 text-sm text-gray-500">No invites sent yet.</p>
      )}

      {!loading && !error && invites.length > 0 && (
        <>
          <ul className="mt-4 space-y-5">
            {invites.map((invite, index) => (
              <li key={invite.id || invite.$id} className="relative pl-4">
                <span className="absolute left-0 w-2 h-2 bg-gray-400 rounded-full top-[14px]" />

                {index < invites.length - 1 && (
                  <span className="absolute left-[3.4px] top-[22px] bottom-[-35px] w-px bg-gray-200" />
                )}

                <div className="flex flex-col gap-1 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    <span className="font-medium">{invite.auditOrgName}</span>{" "}
                    invited{" "}
                    <span className="font-medium">{invite.directorName}</span>{", Director of"}
                    {" "}
                    <span className="font-medium">{invite.coopName}</span>
                    <span className="text-sm text-gray-500">&nbsp;to join.</span>
                  </p>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {getRelativeTime(invite.createdAt)} ·{" "}
                    <span
                      className={`font-medium ${
                        invite.status === "accepted"
                          ? "text-green-600"
                          : invite.status === "rejected"
                            ? "text-red-600"
                            : "text-amber-600"
                      }`}
                    >
                      {invite.status}
                    </span>
                  </p>

                  <p className="text-xs text-gray-400">
                    {invite.directorEmail?.trim()}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-xs text-gray-500">
              Page {pagination.page} of {pagination.totalPages || 1}
              {pagination.total > 0 && <> · {pagination.total} total invites</>}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={loading || !pagination.hasPrevPage}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={loading || !pagination.hasNextPage}
                onClick={() => setPage((prev) => prev + 1)}
                className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}