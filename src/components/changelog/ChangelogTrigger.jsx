"use client";

// Import React hooks for component state and effect handling
import React, { useState, useEffect } from "react";
// Import Megaphone icon from lucide-react to signal product announcements and release notes
import { Megaphone } from "lucide-react";
import {
  fetchChangelog,
  filterChangelogsByRole,
  hasUnreadChangelog,
  markChangelogAsRead,
} from "@/lib/changelogService";
import ChangelogDrawer from "./ChangelogDrawer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";

export default function ChangelogTrigger() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const userRole = user?.role || "guest";

  const [roleLogs, setRoleLogs] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    async function loadChangelog() {
      const allLogs = await fetchChangelog();
      const filtered = filterChangelogsByRole(allLogs, userRole);
      setRoleLogs(filtered);
      const isUnread = hasUnreadChangelog(filtered, userRole);
      setUnread(isUnread);
    }
    loadChangelog();
  }, [userRole]);

  const handleOpen = () => {
    setIsDrawerOpen(true);
    if (roleLogs.length > 0) {
      markChangelogAsRead(roleLogs[0].id, userRole);
      setUnread(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="relative p-2 text-slate-600 transition-colors duration-300 rounded-full dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95"
        title={language === "de" ? "Was gibt's Neues" : "What's New"}
        aria-label="What's New"
      >
        {/* Render Megaphone mic icon for product announcements */}
        <Megaphone size={20} className="text-slate-600 dark:text-slate-300" />
        {unread && (
          <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600 border border-white dark:border-slate-900"></span>
          </span>
        )}
      </button>

      <ChangelogDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        changelogs={roleLogs}
        userRole={userRole}
      />
    </>
  );
}
