"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  Search,
  CheckCircle,
  FileUp,
  Hourglass,
  Eye,
  FileText,
} from "lucide-react";
import { getAllActivatedCoops } from "../../lib/getCoopsService";
import { AuditStatusColors, AuditStatusEnum } from "../../lib/AuditStatus";
import { useRouter } from "next/navigation";
import AssignAuditorsButton from "./AssignAuditorsButton";

// Font Import
const PRO_FONT =
  "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'";

function useProfessionalFont() {
  useEffect(() => {
    const id = "font-inter";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

const STATUS_TABS = [
  { key: "ALL", label: "All" },
  { key: "SUBMITTED", label: "Submitted" },
  { key: "UNDER_REVIEW", label: "Under Review" },
  { key: "APPROVED", label: "Approved" },
];

const StatCard = ({ title, value, description, Icon, iconColor, index }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = Number(value) || 0;
    const duration = 900;
    let increment = (end - start) / (duration / 16);
    increment = increment > 1 ? Math.ceil(increment) : 1;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.ceil(start));
      }
    }, 16);
  }, [value]);

  return (
    <div
      className="p-5 transition-all duration-300 bg-white shadow-lg dark:bg-slate-800 rounded-xl hover:scale-105"
      style={{ animationDelay: `${index * 0.06}s`, fontFamily: PRO_FONT }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {count}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {description}
          </p>
        </div>
        <div
          className={`p-3 rounded-full bg-opacity-20 ${iconColor.replace(
            "text-",
            "bg-"
          )} ${iconColor}`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

const CooperativeAuditView = () => {
  const [cooperatives, setCooperatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("ALL");

  const router = useRouter();
  useProfessionalFont();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const allCoops = await getAllActivatedCoops();
        if (mounted) setCooperatives(allCoops || []);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [reloadKey]);

  const isFeatureReady = (status) =>
    !(status === "NOT_STARTED" || status === "IN_PROGRESS");

  const dynamicStatsData = useMemo(() => {
    const total = cooperatives.length;
    const submitted = cooperatives.filter(
      (c) => c.auditStatus === "SUBMITTED"
    ).length;
    const underReview = cooperatives.filter(
      (c) => c.auditStatus === "UNDER_REVIEW"
    ).length;
    const approved = cooperatives.filter(
      (c) => c.auditStatus === "APPROVED"
    ).length;

    return [
      {
        title: "Total Submissions",
        value: total,
        description: "All registered cooperatives",
        icon: Building2,
        iconColor: "text-primary",
      },
      {
        title: "Submitted",
        value: submitted,
        description: "Awaiting initial review",
        icon: FileUp,
        iconColor: "text-amber-500",
      },
      {
        title: "Under Review",
        value: underReview,
        description: "Currently being reviewed",
        icon: Hourglass,
        iconColor: "text-indigo-500",
      },
      {
        title: "Approved",
        value: approved,
        description: "Successfully approved",
        icon: CheckCircle,
        iconColor: "text-green-500",
      },
    ];
  }, [cooperatives]);

  const filteredCoops = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cooperatives.filter((c) => {
      const statusOk = statusTab === "ALL" ? true : c.auditStatus === statusTab;
      if (!q) return statusOk;
      const hay = `${c.name ?? ""} ${c.state ?? ""} ${c.sector ?? ""} ${
        c.auditStatus ?? ""
      }`.toLowerCase();
      return statusOk && hay.includes(q);
    });
  }, [cooperatives, search, statusTab]);

  return (
    <div
      className="min-h-screen p-6 bg-gray-50 dark:bg-slate-900"
      style={{ fontFamily: PRO_FONT }}
    >
      {/* Hero Section */}

      {/* Stats Section */}
      <div className="grid grid-cols-1 gap-6 my-8 sm:grid-cols-2 lg:grid-cols-4">
        {dynamicStatsData.map((stat, i) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            Icon={stat.icon}
            iconColor={stat.iconColor}
            index={i}
          />
        ))}
      </div>

      {/* Toolbar Section */}
      <div className="flex flex-col gap-3 mb-4 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Audit Cooperatives
        </h2>

        <div className="flex items-center flex-1 gap-3 lg:flex-none">
          {/* Status tabs */}
          <div className="flex items-center gap-1 p-1 bg-white border border-gray-200 rounded-xl dark:border-slate-700 dark:bg-slate-800">
            {STATUS_TABS.map((t) => {
              const active = statusTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setStatusTab(t.key)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition
                    ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                    }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative flex-1 lg:w-80">
            <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, state, sector…"
              className="w-full py-2 pr-3 text-sm bg-white border border-gray-200 pl-9 rounded-xl dark:border-slate-700 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="px-3 py-2 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden bg-white shadow-md dark:bg-slate-800 rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 text-xs text-left text-gray-700 uppercase dark:text-gray-300 bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="p-4">Cooperative</th>
                <th className="p-4">State</th>
                <th className="p-4">Auditor</th>
                <th className="p-4">Share Price</th>
                <th className="p-4">Audit Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b dark:border-slate-700">
                    <td className="p-4">
                      <div className="w-48 h-4 bg-gray-200 rounded dark:bg-slate-700 animate-pulse" />
                    </td>
                    <td className="p-4">
                      <div className="w-20 h-4 bg-gray-200 rounded dark:bg-slate-700 animate-pulse" />
                    </td>
                    <td className="p-4">
                      <div className="w-32 h-4 bg-gray-200 rounded dark:bg-slate-700 animate-pulse" />
                    </td>
                    <td className="p-4">
                      <div className="w-16 h-4 bg-gray-200 rounded dark:bg-slate-700 animate-pulse" />
                    </td>
                    <td className="p-4">
                      <div className="h-6 bg-gray-200 rounded-full w-28 dark:bg-slate-700 animate-pulse" />
                    </td>
                    <td className="p-4">
                      <div className="w-24 h-4 bg-gray-200 rounded dark:bg-slate-700 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredCoops.length === 0 ? (
                <tr>
                  <td
                    className="p-8 text-center text-gray-500 dark:text-gray-400"
                    colSpan={6}
                  >
                    No cooperatives found for the selected filters.
                  </td>
                </tr>
              ) : (
                filteredCoops.map((coop) => (
                  <tr
                    key={coop.id}
                    className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                  >
                    <td className="p-4 font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <img
                          src={coop.logo}
                          alt={`${coop.name} logo`}
                          className="object-cover w-8 h-8 mr-3 rounded-md"
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold">{coop.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {coop.sector}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{coop.state}</td>
                    {/* {console.log("CoopNameAuditView", coop.name)} */}
                    <td className="p-4">
                      <AssignAuditorsButton
                        coopId={coop.id}
                        coopName={coop.name}
                      />
                    </td>
                    <td className="p-4">{coop.sharePrice}€</td>
                    <td className="p-4">
                      {coop.auditStatus && (
                        <span
                          className={`inline-block mt-1 px-3 py-1 text-xs font-medium rounded-full ${
                            AuditStatusColors[coop.auditStatus] ||
                            "bg-gray-200 text-gray-800"
                          }`}
                        >
                          {AuditStatusEnum[coop.auditStatus]}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <button
                        className="p-1.5 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600"
                        onClick={() => router.push(`/cooperate/${coop.id}`)}
                        title="View cooperative"
                      >
                        <Eye size={16} />
                      </button>
                      {isFeatureReady(coop.auditStatus) && (
                        <button
                          className="p-1.5 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600"
                          onClick={() => router.push(`/coopaudit/${coop.id}`)}
                          title="Open audit"
                        >
                          <FileText size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default CooperativeAuditView;
