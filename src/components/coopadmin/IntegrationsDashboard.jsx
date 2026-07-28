"use client";

import React from "react";
import { Sparkles } from "lucide-react";

const integrations = [
  {
    name: "DATEV",
    description: "Export financials to your tax advisor",
    emoji: "🗄️",
    iconBg: "bg-purple-50 dark:bg-purple-900/20",
    status: "soon",
  },
  {
    name: "EEG-Meldeportal",
    description: "Regulatory energy reporting",
    emoji: "⚡",
    iconBg: "bg-yellow-50 dark:bg-yellow-900/20",
    status: "soon",
  },
  {
    name: "Elster",
    description: "German tax filing portal",
    emoji: "🏛️",
    iconBg: "bg-pink-50 dark:bg-pink-900/20",
    status: "soon",
  },
  {
    name: "SEPA Direct Debit",
    description: "Automatic member payment collection",
    emoji: "🏦",
    iconBg: "bg-slate-100 dark:bg-slate-700/50",
    status: "soon",
  },
  {
    name: "DocuSign",
    description: "eSignature provider integration",
    emoji: "📝",
    iconBg: "bg-green-50 dark:bg-green-900/20",
    status: "soon",
  },
  {
    name: "SSO / Identity Provider",
    description: "Single sign-on via LDAP or OAuth",
    emoji: "🔐",
    iconBg: "bg-orange-50 dark:bg-orange-900/20",
    status: "soon",
  },
  {
    name: "Netzbetreiber API",
    description: "Live grid operator data feed",
    emoji: "🔌",
    iconBg: "bg-blue-50 dark:bg-blue-900/20",
    status: "soon",
  },
  {
    name: "Coop-Pilot API",
    description: "Build custom integrations",
    emoji: "⚙️",
    iconBg: "bg-gray-100 dark:bg-slate-700/50",
    status: "soon",
  },
];

export default function IntegrationsDashboard() {
  return (
    <div className="p-4 sm:p-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Integrations
        </h2>
        <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-orange-700 bg-orange-100 border border-orange-300 rounded-full dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700">
          <Sparkles size={16} />
          Coming Soon — Preview
        </span>
      </div>

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 sm:gap-5">
        {integrations.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between p-5 bg-white border border-gray-100 shadow-sm dark:bg-slate-800 rounded-xl dark:border-slate-700"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 flex items-center justify-center rounded-xl text-xl ${item.iconBg}`}
              >
                {item.emoji}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 dark:text-white">
                  {item.name}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {item.description}
                </p>
              </div>
            </div>
            {item.status === "connect" ? (
              <button className="px-4 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors dark:bg-green-700 dark:hover:bg-green-600">
                CONNECT
              </button>
            ) : (
              <span className="px-3 py-1.5 text-xs font-semibold text-gray-400 bg-gray-100 rounded-md dark:bg-slate-700 dark:text-gray-500">
                SOON
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
