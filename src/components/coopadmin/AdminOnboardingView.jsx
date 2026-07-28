"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Shield, Mail, Loader2, RefreshCw, Plus, X } from "lucide-react";
import InviteAdminView from "./coopadminInvitation/InviteAdminView";
import AdminInviteHistory from "./coopadminInvitation/AdminInviteHistory";
import FadePopUp from "../FadePopUp";

export default function AdminOnboardingView({ selectedCoop }) {
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [invitePopUp, setInvitePopUp] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [showRefreshSuccess, setShowRefreshSuccess] = useState(false);

  const fetchCoopDetails = useCallback(async () => {
    if (!selectedCoop) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/coop-services/${selectedCoop}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load cooperative data");
      }
      setAdmins(data.coop?.adminEmails || []);

      // Show success feedback
      setShowRefreshSuccess(true);
      setTimeout(() => setShowRefreshSuccess(false), 2000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to fetch administrators list");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCoop]);

  useEffect(() => {
    fetchCoopDetails();
  }, [fetchCoopDetails, refresh]);

  const handleRefresh = useCallback(() => {
    if (isLoading) return;
    setRefresh((prev) => !prev);
  }, [isLoading]);

  const handleInviteSuccess = useCallback(() => {
    // Auto-refresh the admin list after successful invite
    setRefresh((prev) => !prev);
    setInvitePopUp(false);
  }, []);

  return (
    <>
      <div className="p-4 space-y-6 sm:p-6 animate-fadeIn">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Admin Onboarding
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View active cooperative administrators authorized to manage
              settings.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <div className="relative">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                aria-label="Refresh administrators list"
                aria-busy={isLoading}
                title="Refresh administrators list"
                className="flex items-center self-start gap-2 p-2 text-gray-500 transition bg-white border border-gray-200 rounded-lg sm:self-center hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  size={16}
                  className={isLoading ? "animate-spin" : ""}
                />
                <div className="whitespace-nowrap">
                  {isLoading ? "Loading..." : "Refresh"}
                </div>
              </button>

              {/* Success Toast */}
              {/* {showRefreshSuccess && !isLoading && (
                <div className="absolute left-0 px-2 py-1 mt-2 text-xs text-green-600 bg-green-100 rounded top-full dark:bg-green-900/30 dark:text-green-400 whitespace-nowrap animate-fadeIn">
                  ✓ List refreshed
                </div>
              )} */}
            </div>

            {/* Invite Button */}
            <button
              onClick={() => setInvitePopUp(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-400"
            >
              <Plus size={16} /> Invite Admin
            </button>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          // <div className="flex flex-col items-center justify-center p-12 bg-white border border-gray-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl">
          //   <Loader2 className="w-8 h-8 text-blue-600 animate-spin dark:text-blue-400" />
          //   <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          //     Loading administrators...
          //   </p>
          // </div>
          <div className="p-6 bg-white border border-gray-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 rounded-xl">
            <h3 className="flex items-center gap-2 mb-4 text-lg font-bold text-gray-900 dark:text-white">
              Authorized Administrators{" "}
              <span className="inline-block w-4 h-4 bg-gray-200 rounded-full animate-pulse" />
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="flex items-center flex-1 gap-3 p-4 transition-colors border border-gray-100 bg-gray-50 dark:bg-slate-900/50 dark:border-slate-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-900 group"
                >
                  <div className="w-10 h-10 text-blue-600 bg-blue-100 rounded-lg dark:bg-blue-900/30 dark:text-blue-400" />
                  <div className="flex-1 min-w-0">
                    <p className="w-20 h-4 mb-1 text-sm font-semibold text-gray-800 bg-gray-300 rounded-lg dark:text-gray-200 animate-pulse" />
                    <div className="w-32 h-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Mail size={12} className="shrink-0" />
                      <div className="w-32 h-3 rounded-lg bg-gray-300/90 animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-6 text-center border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800/40 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="p-6 bg-white border border-gray-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 rounded-xl">
            <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
              Authorized Administrators
              {admins.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({admins.length})
                </span>
              )}
            </h3>

            {admins.length === 0 ? (
              <div className="py-8 text-center">
                <Shield className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  No administrators listed for this cooperative.
                </p>
                <button
                  onClick={() => setInvitePopUp(true)}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Invite your first admin →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {admins.map((email, index) => (
                  <div
                    key={`${email}-${index}`}
                    className="flex items-center gap-3 p-4 transition-colors border border-gray-100 cursor-pointer bg-gray-50 dark:bg-slate-900/50 dark:border-slate-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-900 group"
                  >
                    <div className="p-2 text-blue-600 bg-blue-100 rounded-lg dark:bg-blue-900/30 dark:text-blue-400">
                      <Shield size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Coop Admin
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1 mt-0.5">
                        <Mail size={12} className="shrink-0" />
                        <span className="truncate">{email}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admin Invite History */}
        <AdminInviteHistory selectedCoop={selectedCoop} refresh={refresh} />
      </div>

      {/* Invite Modal */}
      {/* {invitePopUp && ( */}
      <FadePopUp
        isOpen={invitePopUp}
        onClose={() => setInvitePopUp(false)}
        overlayClassName="bg-black/10 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-admin-title"
      >
        {/* Modal Content */}
        <div
          className="relative w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <InviteAdminView
            selectedCoop={selectedCoop}
            onInviteSuccess={handleInviteSuccess}
            onClose={() => setInvitePopUp(false)}
          />
        </div>
      </FadePopUp>
      {/* )} */}
    </>
  );
}
