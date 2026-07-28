"use client";

import React from "react";
import { Coins, Hash, Users, Info } from "lucide-react";

const Page3 = ({ formData, handleChange, errors }) => {
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn pt-4">
      {/* HEADER */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
          <Coins className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Share Settings
        </h2>

        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Configure your cooperative’s legal share structure and member formatting.
        </p>
      </div>

      {/* FORM CONTAINER */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-6">
        
        {/* Max Shares */}
        <div>
          <label
            htmlFor="maxShares"
            className="block mb-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest"
          >
            Maximum Shares <span className="text-rose-500">*</span>
          </label>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <Users size={18} className="text-slate-400" />
            </div>

            <input
              type="number"
              id="maxShares"
              name="maxShares"
              value={formData.maxShares || ""}
              onChange={handleChange}
              placeholder="e.g. 100"
              min="1"
              className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 dark:text-white ${
                errors.maxShares
                  ? "border-rose-300 focus:ring-rose-500/50 focus:border-rose-500 dark:border-rose-700"
                  : "border-slate-200 focus:ring-indigo-500/50 focus:border-indigo-500 dark:border-slate-700"
              }`}
            />
          </div>

          {errors.maxShares ? (
            <p className="mt-2 text-[11px] font-bold text-rose-500">
              {errors.maxShares}
            </p>
          ) : (
            <p className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Maximum number of shares a single member can hold.
            </p>
          )}
        </div>

        {/* Share Price */}
        <div>
          <label
            htmlFor="sharePrice"
            className="block mb-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest"
          >
            Share Price (€) <span className="text-rose-500">*</span>
          </label>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <Coins size={18} className="text-slate-400" />
            </div>

            <input
              type="number"
              id="sharePrice"
              name="sharePrice"
              value={formData.sharePrice || ""}
              onChange={handleChange}
              placeholder="e.g. 500"
              min="1"
              className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 dark:text-white ${
                errors.sharePrice
                  ? "border-rose-300 focus:ring-rose-500/50 focus:border-rose-500 dark:border-rose-700"
                  : "border-slate-200 focus:ring-indigo-500/50 focus:border-indigo-500 dark:border-slate-700"
              }`}
            />
          </div>

          {errors.sharePrice ? (
            <p className="mt-2 text-[11px] font-bold text-rose-500">
              {errors.sharePrice}
            </p>
          ) : (
            <p className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              The nominal price per cooperative share.
            </p>
          )}
        </div>

        {/* Membership Number Format */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2 mt-4">
            <label
              htmlFor="memberNumberFormat"
              className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest"
            >
              Member Number Format <span className="text-rose-500">*</span>
            </label>

            {/* Info Tooltip */}
            <div className="relative group flex items-center">
              <button
                type="button"
                className="text-slate-400 hover:text-indigo-500 transition-colors focus:outline-none"
              >
                <Info size={14} />
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 text-xs font-medium text-white bg-slate-800 dark:bg-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 text-center z-10">
                Only letters and numbers are allowed. No spaces or special characters.
                {/* Tooltip arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700"></div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <Hash size={18} className="text-slate-400" />
            </div>

            <input
              type="text"
              id="memberNumberFormat"
              name="memberNumberFormat"
              value={formData.memberNumberFormat || ""}
              onChange={(e) => {
                handleChange({
                  target: {
                    name: "memberNumberFormat",
                    value: e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase(),
                  },
                });
              }}
              placeholder="e.g. C001"
              className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 dark:text-white ${
                errors.memberNumberFormat
                  ? "border-rose-300 focus:ring-rose-500/50 focus:border-rose-500 dark:border-rose-700"
                  : "border-slate-200 focus:ring-indigo-500/50 focus:border-indigo-500 dark:border-slate-700"
              }`}
            />
          </div>

          {errors.memberNumberFormat && (
            <p className="mt-2 text-[11px] font-bold text-rose-500">
              {errors.memberNumberFormat}
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default Page3;