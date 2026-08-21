"use client";

import React, { useState } from "react";
import { X, Sparkles, CheckCircle2, Wrench, Rocket, ShieldCheck, UserCheck, Users, Building2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { normalizeRole } from "@/lib/changelogService";

export default function ChangelogDrawer({ isOpen, onClose, changelogs, userRole }) {
  const { language } = useLanguage();
  const [activeFilter, setActiveFilter] = useState("all");

  if (!isOpen) return null;

  const filteredLogs = changelogs.filter((item) => {
    if (activeFilter === "all") return true;
    return item.type === activeFilter;
  });

  const getRoleLabel = (role) => {
    const normalized = normalizeRole(role);
    switch (normalized) {
      case "member":
        return { en: "Member Portal", de: "Mitgliederportal", icon: <Users className="w-3.5 h-3.5 text-blue-500" /> };
      case "coopadmin":
        return { en: "Coop Administrator", de: "Genossenschafts-Admin", icon: <Building2 className="w-3.5 h-3.5 text-purple-500" /> };
      case "auditor":
        return { en: "Auditor Portal", de: "Prüfer-Portal", icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> };
      case "orgadmin":
        return { en: "Audit Org Admin", de: "Verbands-Admin", icon: <UserCheck className="w-3.5 h-3.5 text-amber-500" /> };
      default:
        return { en: "All Portals", de: "Alle Portale", icon: <Sparkles className="w-3.5 h-3.5 text-slate-500" /> };
    }
  };

  const roleInfo = getRoleLabel(userRole);

  const getTypeBadge = (type) => {
    switch (type) {
      case "feature":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            {language === "de" ? "Funktion" : "Feature"}
          </span>
        );
      case "fix":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
            <Wrench className="w-3 h-3 text-amber-500" />
            {language === "de" ? "Korrektur" : "Fix"}
          </span>
        );
      case "improvement":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
            <Rocket className="w-3 h-3 text-indigo-500" />
            {language === "de" ? "Verbesserung" : "Improvement"}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Body */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {language === "de" ? "Was gibt's Neues in Coop-Pilot" : "What's New in Coop-Pilot"}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {roleInfo.icon}
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {language === "de" ? roleInfo.de : roleInfo.en}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar bg-white dark:bg-slate-900">
            {[
              { id: "all", label: language === "de" ? "Alle" : "All" },
              { id: "feature", label: language === "de" ? "Funktionen" : "Features" },
              { id: "fix", label: language === "de" ? "Korrekturen" : "Fixes" },
              { id: "improvement", label: language === "de" ? "Verbesserungen" : "Improvements" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 ${
                  activeFilter === tab.id
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Feed Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-slate-400">
                  {language === "de"
                    ? "Keine Updates in dieser Kategorie für Ihr Profil gefunden."
                    : "No updates found in this category for your role."}
                </p>
              </div>
            ) : (
              filteredLogs.map((item) => {
                const title = typeof item.title === "object" ? item.title[language] || item.title.en : item.title;
                const summary = typeof item.summary === "object" ? item.summary[language] || item.summary.en : item.summary;
                const itemsList = Array.isArray(item.items)
                  ? item.items
                  : item.items && item.items[language]
                  ? item.items[language]
                  : item.items && item.items.en
                  ? item.items.en
                  : [];

                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeBadge(item.type)}
                        <span className="text-xs font-mono font-medium text-slate-400 dark:text-slate-500">
                          {item.version}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {item.date}
                      </span>
                    </div>

                    {/* Title & Summary */}
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {summary}
                      </p>
                    </div>

                    {/* Bullet Items */}
                    {itemsList && itemsList.length > 0 && (
                      <ul className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                        {itemsList.map((bullet, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Coop-Pilot Compliance Platform &copy; 2026
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
