"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Sparkles, FolderOpen, Download } from "lucide-react";
import { fetchCooperativeSettings } from "@/lib/cooperativeSettingsService";

const statsData = [
  {
    label: "DATEV ASCII",
    subtitle: "Export Format · Standard format",
    emoji: "📂",
  },
  {
    label: "28 Feb 2026",
    subtitle: "Last Export · Q4 2025 data",
    emoji: "📅",
  },
  {
    label: "AES-256",
    subtitle: "Data Encryption · GDPR compliant",
    emoji: "🔐",
  },
];

const exportHistory = [
  {
    title: "Q4 2025 – Jahresabschluss",
    date: "31.12.2025",
    size: "2.4 MB",
    status: "READY",
  },
  {
    title: "Q3 2025 – Quartalsbericht",
    date: "30.09.2025",
    size: "1.8 MB",
    status: "READY",
  },
];

export default function DatevExportDashboard({ selectedCoop, coops = [] }) {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const loadSettings = async () => {
      if (!selectedCoop) {
        setSettings(null);
        return;
      }

      try {
        const data = await fetchCooperativeSettings(selectedCoop);
        setSettings(data);
      } catch (error) {
        setSettings(null);
      }
    };

    loadSettings();
  }, [selectedCoop]);

  const coopName = useMemo(() => {
    const coop = coops.find((item) => item.id === selectedCoop);
    return coop?.name || settings?.cooperative_name || "-";
  }, [coops, selectedCoop, settings?.cooperative_name]);

  return (
    <div className="p-4 sm:p-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          DATEV Export
        </h2>
        <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-orange-700 bg-orange-100 border border-orange-300 rounded-full dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700">
          <Sparkles size={16} />
          Coming Soon — Preview
        </span>
      </div>

      {/* Hero Banner */}
      <div className="flex items-center justify-between p-6 mb-6 text-white rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">📊</span>
            <h3 className="text-lg font-bold">DATEV Export</h3>
          </div>
          <p className="text-sm text-gray-300">
            Directly export your cooperative&apos;s financial data to DATEV
            format for
            <br />
            seamless handover to your Steuerberater.
          </p>
        </div>
        <button className="px-5 py-2.5 text-sm font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors shadow-md">
          Generate Export
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3 sm:gap-6">
        {statsData.map((stat) => (
          <div
            key={stat.label}
            className="p-5 bg-white border border-gray-100 shadow-sm dark:bg-slate-800 rounded-xl dark:border-slate-700"
          >
            <div className="mb-3 text-2xl">{stat.emoji}</div>
            <p className="text-xl font-bold text-gray-800 dark:text-white">
              {stat.label}
            </p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              {stat.subtitle}
            </p>
          </div>
        ))}
      </div>

      <div className="p-5 mb-6 bg-white border border-gray-100 shadow-sm dark:bg-slate-800 rounded-xl dark:border-slate-700">
        {settings ? (
          <>
            <h3 className="mb-3 text-base font-semibold text-gray-800 dark:text-white">
              Coop Settings Snapshot for Export
            </h3>
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <InfoItem label="Cooperative" value={coopName} />
              <InfoItem
                label="Register Number"
                value={settings?.register_number || "-"}
              />
              <InfoItem
                label="Register Court"
                value={settings?.register_court || "-"}
              />
              <InfoItem
                label="Fiscal Year Start"
                value={settings?.fiscal_year_start || "-"}
              />
              <InfoItem
                label="Fiscal Year End"
                value={settings?.fiscal_year_end || "-"}
              />
              <InfoItem
                label="Share Price"
                value={
                  Number.isFinite(settings?.share_price_cents)
                    ? `EUR ${(settings.share_price_cents / 100).toFixed(2)}`
                    : "-"
                }
              />
            </div>
          </>
        ) : (
          <span>Loading Legal Data...</span>
        )}
      </div>

      {/* Export History */}
      <div className="bg-white border border-gray-100 shadow-sm dark:bg-slate-800 rounded-xl dark:border-slate-700">
        <div className="px-6 pt-5 pb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Export History
          </h3>
        </div>

        <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
          {exportHistory.map((item) => (
            <div
              key={item.title}
              className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/30"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                  <FolderOpen
                    size={20}
                    className="text-yellow-500 dark:text-yellow-400"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {item.date} · {item.size}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {item.status}
                </span>
                <button className="flex items-center gap-1 text-sm font-medium text-pink-600 hover:underline dark:text-pink-400">
                  <Download size={14} />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-700/60">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="font-medium text-gray-800 dark:text-gray-100">{value}</p>
    </div>
  );
}
