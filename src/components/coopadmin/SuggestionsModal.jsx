"use client";

import { createSuggestion } from "@/lib/suggestionService";
import { useState, useEffect, Suspense } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";

function CreateSuggestionModalContent({ isOpen, onClose }) {
  const searchParams = useSearchParams();
  const activeTab = searchParams ? (searchParams.get("tab") || "overview") : "overview";

  const [tab, setTab] = useState(activeTab);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTab(activeTab);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await createSuggestion(title, description, tab);

      setTitle("");
      setDescription("");
      toast.success("Suggestion sent successfully!");
      onClose();
    } catch (error) {
      console.error("Failed to create suggestion:", error);
      toast.error("Failed to create suggestion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="
    relative
    w-full
    max-w-xl
    rounded-3xl
    bg-white
    border border-neutral-200
    shadow-[0_24px_80px_-20px_rgba(0,0,0,0.25)]
    dark:bg-slate-900
    dark:border-slate-800
  "
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                Create feedback
              </h2>

              <p className="flex items-center gap-1 mt-1 text-sm text-neutral-500 dark:text-gray-400">
                Share an idea, report an issue, or suggest an improvement.
              </p>
            </div>

            <button
              onClick={onClose}
              className="transition border h-9 w-9 rounded-xl border-neutral-200 text-neutral-500 hover:bg-neutral-50"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Tab
              </label>

              <input
                type="text"
                value={tab}
                onChange={(e) => setTab(e.target.value)}
                placeholder="Active tab (e.g. overview)"
                required
                className="w-full h-12 px-4 transition bg-white border rounded-2xl border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-4 focus:ring-neutral-100 focus:border-neutral-400 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-400 dark:focus:ring-slate-900/5 dark:focus:border-slate-700"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary"
                required
                className="w-full h-12 px-4 transition bg-white border rounded-2xl border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-4 focus:ring-neutral-100 focus:border-neutral-400 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-400 dark:focus:ring-slate-900/5 dark:focus:border-slate-700"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 ">
                Description
              </label>

              <textarea
                rows={6}
                value={description}
                required
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your feedback..."
                className="w-full px-4 py-3 transition bg-white border resize-none rounded-2xl border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-4 focus:ring-neutral-100 focus:border-neutral-400 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-400 dark:focus:ring-slate-900/5 dark:focus:border-slate-700"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 font-medium transition bg-white border h-11 rounded-xl border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:bg-slate-800 dark:border-slate-700 dark:text-neutral-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-5 font-medium text-white transition h-11 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-50 dark:hover:bg-slate-100 dark:text-slate-950"
              >
                {loading ? "Creating..." : "Create feedback"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CreateSuggestionModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <Suspense fallback={null}>
      <CreateSuggestionModalContent isOpen={isOpen} onClose={onClose} />
    </Suspense>
  );
}
