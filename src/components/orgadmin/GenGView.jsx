"use client";

import React, { useState } from "react";
import { Building2, Loader2, Plus } from "lucide-react";
import { searchCoops, attachCoopToAuditOrg } from "@/lib/gengService";
import InviteCoopDrawer from "./InviteCoopDrawer";
import InviteList from "./InviteList";
import { toast } from "react-hot-toast";

export default function GenGView({ auditOrgName, auditOrgId }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [attachingId, setAttachingId] = useState(null);
  const [error, setError] = useState("");
  const [inviteDrawerOpen, setInviteDrawerOpen] = useState(false);

  // NEW
  const [inviteRefreshKey, setInviteRefreshKey] = useState(0);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await searchCoops(query.trim());
      setResults(response || []);
    } catch (err) {
      toast.error("Search failed. Please try again.");
      setError(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAttach = async (coop) => {
    try {
      setAttachingId(coop.id);

      await attachCoopToAuditOrg(coop.id);
      toast.success("Cooperative attached successfully");

      setResults((current) =>
        current.filter((item) => item.id !== coop.id)
      );
    } catch (err) {
      toast.error("Failed to attach cooperative");
      setError(err.message || "Failed to attach cooperative");
    } finally {
      setAttachingId(null);
    }
  };

  const handleInviteCoop = () => {
    setInviteDrawerOpen(true);
  };

  const handleCloseInviteDrawer = () => {
    setInviteDrawerOpen(false);
  };

  // NEW
  const handleInviteSuccess = () => {
    setInviteRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="px-2 py-2 space-y-2">
      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                Cooperative Management
              </div>
            </div>

            <button
              onClick={handleInviteCoop}
              className="
                inline-flex items-center gap-2
                rounded-lg border border-primary
                bg-primary/10 px-4 py-2.5
                text-sm font-medium text-primary
                transition
                hover:bg-primary/20
                active:scale-[0.98]
              "
            >
              <Plus className="h-4 w-4" />
              Invite new cooperative to Coop-Pilot
            </button>
          </div>

          <div className="mt-5 text-sm dark:text-slate-400">
            Attach an existing cooperative to {auditOrgName}
          </div>

          <div className="mt-2 flex w-full gap-2 md:w-[50%]">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by cooperative name or registry number"
              className="
                flex-1 rounded-lg border border-gray-300
                bg-white px-4 py-2.5 text-sm
                outline-none transition
                focus:border-primary focus:ring-2 focus:ring-primary/20
                dark:border-slate-600
                dark:bg-slate-700
                dark:text-white
              "
            />

            <button
              onClick={handleSearch}
              disabled={!query.trim() || loading}
              className="
                inline-flex min-w-[100px]
                items-center justify-center
                rounded-lg bg-primary
                px-4 py-2.5
                text-sm font-medium text-white
                transition hover:bg-primary/90
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Search"
              )}
            </button>
          </div>

          {error && (
            <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-slate-700">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-sm text-gray-500">
              Searching cooperatives...
            </div>
          ) : results.length > 0 ? (
            results.map((coop, index) => (
              <div
                key={coop.id}
                className={`
                  flex items-center justify-between
                  px-5 py-4 transition
                  hover:bg-gray-50
                  dark:hover:bg-slate-700/30
                  ${
                    index !== results.length - 1
                      ? "border-b border-gray-100 dark:border-slate-700"
                      : ""
                  }
                `}
              >
                <div className="flex min-w-0 items-center gap-3">
                  {coop.logo ? (
                    <img
                      src={coop.logo}
                      alt={coop.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900 dark:text-white">
                      {coop.name}
                    </p>

                    <p className="truncate text-sm text-gray-500 dark:text-slate-400">
                      {coop.regNumber ||
                        coop.CourtName ||
                        "No registry number"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleAttach(coop)}
                  disabled={attachingId === coop.id}
                  className="
                    ml-4 rounded-md
                    bg-primary/10
                    px-3 py-1.5
                    text-sm font-medium
                    text-primary
                    transition
                    hover:bg-primary/20
                    disabled:opacity-50
                  "
                >
                  {attachingId === coop.id ? "Attaching..." : "Attach"}
                </button>
              </div>
            ))
          ) : (
            <div className="py-10 text-center">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {query
                  ? "No cooperatives found."
                  : "Search for a cooperative to get started."}
              </p>
            </div>
          )}
        </div>
      </section>

      <InviteList
        auditOrgId={auditOrgId}
        refreshKey={inviteRefreshKey}
      />

      <InviteCoopDrawer
        isOpen={inviteDrawerOpen}
        onClose={handleCloseInviteDrawer}
        auditOrgId={auditOrgId}
        onInviteSuccess={handleInviteSuccess}
      />
    </div>
  );
}