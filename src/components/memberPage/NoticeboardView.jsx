"use client";

import React, { useState, useEffect } from "react";
import { Megaphone, Calendar, Clock, User, Building2, BellRing, X } from "lucide-react";
import toast from "react-hot-toast";
import { getNotices } from "@/lib/noticeService";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NoticeboardView({ selectedCoop, coops }) {
  const { language } = useLanguage();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState("latest"); // "latest" or "all"
  const [selectedNotice, setSelectedNotice] = useState(null);

  const fetchMemberNotices = async () => {
    try {
      setLoading(true);
      // Fetch notices. If selectedCoop is active, filter at the API level
      const data = await getNotices(selectedCoop);

      // Ensure the member only sees notices for coops they actually belong to
      const memberCoopIds = coops.map((c) => c.coopId || c.id);
      let allowedData = data.filter((notice) => memberCoopIds.includes(notice.coopId));

      // Tag the latest notice of each coop
      // Since getNotices returns notices sorted by createdAt desc, the first occurrence of a coopId is the latest.
      const seenCoops = new Set();
      const processed = allowedData.map((notice) => {
        const isLatest = !seenCoops.has(notice.coopId);
        seenCoops.add(notice.coopId);
        return {
          ...notice,
          isLatestOfCoop: isLatest,
        };
      });

      setNotices(processed);
    } catch (error) {
      console.error("Failed to load notices:", error);
      toast.error("Failed to load notices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberNotices();
  }, [selectedCoop, coops]);

  // Filter notices based on filterMode
  const displayedNotices = notices.filter((notice) => {
    if (filterMode === "latest") {
      return notice.isLatestOfCoop;
    }
    return true;
  });

  const getCoopName = (coopId) => {
    const coop = coops.find((c) => (c.coopId || c.id) === coopId);
    return coop?.name || "Cooperative";
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString(language, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-6xl p-6 mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col items-start justify-between gap-4 p-6 border shadow-sm bg-gradient-to-r from-blue-50 via-indigo-50/30 to-slate-100 dark:from-blue-950 dark:via-indigo-950 dark:to-slate-900 rounded-3xl border-slate-200 dark:border-slate-800 md:flex-row md:items-center text-slate-900 dark:text-white">
        <div>
          <div className="flex items-center gap-2">
            <BellRing className="text-blue-600 dark:text-blue-400" size={22} />
            <h1 className="text-2xl font-bold tracking-tight">GenG Notice Board</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
            Stay up to date with official announcements from your cooperatives.
          </p>
        </div>

        {/* Filter Mode Control */}
        <div className="flex bg-slate-200/60 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-300/50 dark:border-slate-700/50">
          <button
            onClick={() => setFilterMode("latest")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
              filterMode === "latest"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            Latest Notices
          </button>
          <button
            onClick={() => setFilterMode("all")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
              filterMode === "all"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            All Notices
          </button>
        </div>
      </div>

      {/* Notices Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-t-2 border-b-2 border-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : displayedNotices.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-20 text-center border border-dashed rounded-3xl border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
          <Megaphone className="w-12 h-12 mb-4 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No announcements</h3>
          <p className="max-w-sm mt-1 text-sm text-slate-500 dark:text-slate-400">
            {filterMode === "latest"
              ? "There are no active latest announcements for the selected cooperatives."
              : "There are no announcements published at the moment."}
          </p>
          {filterMode === "latest" && notices.length > 0 && (
            <button
              onClick={() => setFilterMode("all")}
              className="px-4 py-2 mt-4 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View past announcements
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayedNotices.map((notice) => (
            <div
              key={notice.id}
              onClick={() => setSelectedNotice(notice)}
              className={`cursor-pointer flex flex-col bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all duration-200 relative group hover:border-blue-500 dark:hover:border-blue-400 overflow-hidden`}
            >
              {/* Latest tag badge */}
              {notice.isLatestOfCoop && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-xl shadow-sm tracking-wider">
                  LATEST
                </div>
              )}

              <div className="space-y-3">
                {/* Coop and Author Details */}
                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-700 dark:text-slate-300 font-semibold">
                    <Building2 size={11} className="shrink-0" />
                    <span className="max-w-[120px] truncate">{getCoopName(notice.coopId)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                    <User size={10} className="shrink-0" />
                    <span className="max-w-[100px] truncate">{notice.givenBy}</span>
                  </div>
                </div>

                {/* Title */}
                <h2 className="pr-12 text-base font-semibold text-slate-900 dark:text-white line-clamp-1">
                  {notice.title}
                </h2>

                {/* Dates Footer */}
                <div className="text-[10px] text-slate-400 flex flex-col gap-0.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    Published: {formatDateTime(notice.createdAt)}
                  </span>
                  {notice.expireDate && (
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      Expires: {formatDateTime(notice.expireDate)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedNotice(null)} />
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-neutral-200 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.25)] dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
            <div className="p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                    <Building2 size={14} />
                    <span className="font-semibold">{getCoopName(selectedNotice.coopId)}</span>
                  </div>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{selectedNotice.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="flex items-center justify-center transition border h-9 w-9 rounded-xl border-neutral-200 text-neutral-500 hover:bg-neutral-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 text-sm text-neutral-600 dark:text-neutral-300">
                <p className="p-4 leading-relaxed whitespace-pre-wrap border bg-slate-50 dark:bg-slate-800/40 rounded-2xl border-slate-100 dark:border-slate-800/50">
                  {selectedNotice.desc}
                </p>

                <div className="flex flex-col gap-1 pt-2 text-xs text-neutral-400">
                  <div className="flex items-center gap-1">
                    <User size={12} />
                    <span>Published by: {selectedNotice.givenBy}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>Published: {formatDateTime(selectedNotice.createdAt)}</span>
                  </div>
                  {selectedNotice.expireDate && (
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>Expires: {formatDateTime(selectedNotice.expireDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="px-5 py-2.5 font-medium text-white transition rounded-xl bg-blue-600 hover:bg-blue-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
