"use client";

import React from "react";

const formatValue = (value) => {
  try {
    const parsed = JSON.parse(value);
    return parsed === null ? "-" : String(parsed);
  } catch {
    return value || "-";
  }
};

export default function ParametersHistoryTable({ history = [] }) {
  return (
    <div className="overflow-hidden bg-white border border-gray-100 shadow-sm dark:bg-slate-800 rounded-xl dark:border-slate-700">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Settings Change History
        </h3>
      </div>

      {history.length === 0 ? (
        <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
          No changes recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-700/60">
              <tr>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300">Field</th>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300">Old</th>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300">New</th>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300">By</th>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300">When</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.$id} className="border-t border-gray-100 dark:border-slate-700">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{item.changed_field}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatValue(item.old_value)}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatValue(item.new_value)}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.changed_by_email || item.changed_by}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {item.changed_at ? new Date(item.changed_at).toLocaleString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
