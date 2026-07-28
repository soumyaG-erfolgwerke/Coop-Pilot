"use client";

import React, { useState, useEffect } from "react";
import { Plus, Calendar, Clock, Megaphone, X, User } from "lucide-react";
import toast from "react-hot-toast";
import { getNotices, createNotice } from "@/lib/noticeService";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NoticeboardView({ selectedCoop, coops }) {
  const { language } = useLanguage();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);

  // Form State
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentCoop = coops.find((c) => c.id === selectedCoop);
  const coopName = currentCoop?.name || "Cooperative";

  const fetchAllNotices = async () => {
    if (!selectedCoop) return;
    try {
      setLoading(true);
      const data = await getNotices(selectedCoop);
      setNotices(data);
    } catch (error) {
      console.error("Failed to load notices:", error);
      toast.error("Failed to load notices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllNotices();
  }, [selectedCoop]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !desc.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setSubmitting(true);
      await createNotice({
        coopId: selectedCoop,
        title: title.trim(),
        desc: desc.trim(),
        expireDate: expireDate ? new Date(expireDate).toISOString() : null,
      });

      toast.success("Notice published successfully!");
      // Reset Form
      setTitle("");
      setDesc("");
      setExpireDate("");
      setIsCreateOpen(false);
      // Reload Notices
      fetchAllNotices();
    } catch (error) {
      console.error("Failed to create notice:", error);
      toast.error(error.message || "Failed to create notice.");
    } finally {
      setSubmitting(false);
    }
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
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 p-6 border shadow-sm sm:flex-row sm:items-center bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-100 dark:from-slate-900 dark:to-indigo-950 rounded-3xl border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notice Board</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage announcements and notices for <span className="font-semibold text-indigo-600 dark:text-indigo-400">{coopName}</span>.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white transition bg-indigo-600 shadow-lg rounded-2xl hover:bg-indigo-500 active:scale-95"
        >
          <Plus size={18} />
          Create Notice
        </button>
      </div>

      {/* Creation Modal/Overlay */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-neutral-200 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.25)] dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Megaphone className="text-indigo-600 dark:text-indigo-400" size={20} />
                  <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Publish Notice</h2>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="flex items-center justify-center transition border h-9 w-9 rounded-xl border-neutral-200 text-neutral-500 hover:bg-neutral-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Notice Heading"
                    className="w-full h-12 px-4 transition bg-white border rounded-2xl border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-4 focus:ring-neutral-100 focus:border-neutral-400 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-400 dark:focus:ring-slate-900/5 dark:focus:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Description
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Provide full details of the notice..."
                    className="w-full px-4 py-3 transition bg-white border resize-none rounded-2xl border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-4 focus:ring-neutral-100 focus:border-neutral-400 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-400 dark:focus:ring-slate-900/5 dark:focus:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Calendar size={15} />
                    Expiry Date <span className="text-xs text-neutral-400">(Optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={expireDate}
                    onChange={(e) => setExpireDate(e.target.value)}
                    className="w-full h-12 px-4 transition bg-white border rounded-2xl border-neutral-200 text-neutral-900 focus:outline-none focus:ring-4 focus:ring-neutral-100 focus:border-neutral-400 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:ring-slate-900/5 dark:focus:border-slate-700"
                  />
                  <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                    If set, the notice will automatically be hidden from members after this date.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-5 font-medium transition bg-white border h-11 rounded-xl border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:bg-slate-800 dark:border-slate-700 dark:text-neutral-300 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 font-medium text-white transition bg-indigo-600 h-11 rounded-xl hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {submitting ? "Publishing..." : "Publish Notice"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Notices List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-t-2 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : notices.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-20 text-center border border-dashed rounded-3xl border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
          <Megaphone className="w-12 h-12 mb-4 text-slate-400 animate-none" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No notices published</h3>
          <p className="max-w-sm mt-1 text-sm text-slate-500 dark:text-slate-400">
            Keep your cooperative members informed! Click "Create Notice" to publish your first announcement.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notices.map((notice, index) => {
            return (
              <div
                key={notice.id}
                onClick={() => setSelectedNotice(notice)}
                className={`cursor-pointer flex flex-col bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all duration-200 relative group hover:border-indigo-400 dark:hover:border-indigo-500 ${index === 0 ? "ring-2 ring-indigo-500/20" : ""
                  }`}
              >
                {/* Header Tag for the latest notice */}
                {index === 0 && (
                  <span className="absolute top-3 right-3 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider">
                    LATEST
                  </span>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                    <User size={12} className="shrink-0" />
                    <span className="truncate max-w-[150px]">By {notice.givenBy}</span>
                  </div>

                  <h2 className="pr-12 text-base font-semibold text-slate-900 dark:text-white line-clamp-1">
                    {notice.title}
                  </h2>

                  <div className="text-[10px] text-slate-400 flex flex-col gap-0.5 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                    <span>Published: {formatDateTime(notice.createdAt)}</span>
                    {notice.expireDate && (
                      <span>Expires: {formatDateTime(notice.expireDate)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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
                  <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400">
                    <Megaphone size={14} />
                    <span>Announcement</span>
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
                  className="px-5 py-2.5 font-medium text-white transition rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-100"
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
