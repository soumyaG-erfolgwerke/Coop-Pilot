"use client";

import React from "react";

export default function SettingsConfirmationModal({
  isOpen,
  warnings = [],
  onCancel,
  onConfirm,
  isSaving,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-white shadow-2xl dark:bg-slate-800 rounded-xl">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Confirm Coop Settings Update
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Some values are below GenG recommendations. You can still save, but review the warnings.
          </p>
        </div>

        <div className="p-6 space-y-3">
          {warnings.length ? (
            warnings.map((warning, index) => (
              <div
                key={`${warning}-${index}`}
                className="px-3 py-2 text-sm text-yellow-800 border border-yellow-200 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-800"
              >
                {warning}
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-300">No warnings.</p>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg dark:bg-slate-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save Anyway"}
          </button>
        </div>
      </div>
    </div>
  );
}
