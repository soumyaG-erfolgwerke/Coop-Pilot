"use client";

// Import React hooks for component state and effect handling
import React, { useState, useEffect } from "react";
import {
  fetchChangelog,
  filterChangelogsByRole,
  hasUnreadChangelog,
  markChangelogAsRead,
} from "@/lib/changelogService";
import ChangelogDrawer from "./ChangelogDrawer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";

/**
 * Custom Megaphone (Bullhorn 📢) Vector SVG Component
 * Renders a vibrant 3D/Flat Megaphone matching the reference screenshot
 * (Yellow/Amber gradient cone, dark crimson handle, and sound broadcast rays).
 */
const CustomMegaphoneIcon = ({ className = "w-5 h-5" }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Sound Broadcast Ray 1 */}
    <path
      d="M24 8L27 6"
      stroke="#D97706"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Sound Broadcast Ray 2 */}
    <path
      d="M26 14L29.5 13.5"
      stroke="#B91C1C"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Sound Broadcast Ray 3 */}
    <path
      d="M24.5 20L28 21.5"
      stroke="#B91C1C"
      strokeWidth="2.5"
      strokeLinecap="round"
    />

    {/* Megaphone Handle */}
    <path
      d="M11 18.5L14.5 27C14.8 27.7 15.6 28 16.3 27.7L18.5 26.8C19.2 26.5 19.5 25.7 19.2 25L16.2 17.5"
      fill="#B91C1C"
      stroke="#991B1B"
      strokeWidth="1"
    />

    {/* Megaphone Main Body (Rear Housing) */}
    <path
      d="M5 12C4.4 12 4 12.4 4 13V18C4 18.6 4.4 19 5 19L11 20V11L5 12Z"
      fill="#DC2626"
    />
    {/* Body Base Accent Ring */}
    <path
      d="M10 11H12.5V20H10V11Z"
      fill="#EA580C"
    />

    {/* Megaphone Front Flare Cone (Amber Gradient Outer) */}
    <path
      d="M12.5 11L22.5 4.5C23.3 4 24.3 4.6 24.3 5.6V25.4C24.3 26.4 23.3 27 22.5 26.5L12.5 20V11Z"
      fill="url(#megaphone-cone-gradient)"
    />

    {/* Front Oval Bell Opening Rim (Gold Flare) */}
    <ellipse
      cx="24.3"
      cy="15.5"
      rx="2"
      ry="10.5"
      fill="#FBBF24"
      stroke="#F59E0B"
      strokeWidth="1"
    />
    {/* Inner Bell Core Shadow */}
    <ellipse
      cx="24.3"
      cy="15.5"
      rx="1.2"
      ry="8.5"
      fill="#D97706"
    />

    {/* Gradient Definitions */}
    <defs>
      <linearGradient
        id="megaphone-cone-gradient"
        x1="12.5"
        y1="15.5"
        x2="24.3"
        y2="15.5"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#F59E0B" />
        <stop offset="0.6" stopColor="#F97316" />
        <stop offset="1" stopColor="#EF4444" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * ChangelogTrigger Component
 * Renders the Megaphone icon button in the Navbar with role-scoped unread pulse badge.
 * Opens the What's New slide-in drawer on click.
 */
export default function ChangelogTrigger() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const userRole = user?.role || "guest";

  const [roleLogs, setRoleLogs] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [unread, setUnread] = useState(false);

  // 1. Fetch release notes and check unread status matching active userRole
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

  // 2. Open drawer and mark latest update as read for active role
  const handleOpen = () => {
    setIsDrawerOpen(true);
    if (roleLogs.length > 0) {
      markChangelogAsRead(roleLogs[0].id, userRole);
      setUnread(false);
    }
  };

  return (
    <>
      {/* Navbar Megaphone Trigger Button */}
      <button
        onClick={handleOpen}
        className="relative p-2 text-slate-600 transition-colors duration-300 rounded-full dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 flex items-center justify-center"
        title={language === "de" ? "Was gibt's Neues" : "What's New"}
        aria-label="What's New"
      >
        {/* Render custom Megaphone vector icon matching reference screenshot */}
        <CustomMegaphoneIcon className="w-5 h-5 hover:scale-110 transition-transform" />

        {/* Role-scoped Unread Pulse Badge */}
        {unread && (
          <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600 border border-white dark:border-slate-900"></span>
          </span>
        )}
      </button>

      {/* Slide-In Right Drawer Feed */}
      <ChangelogDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        changelogs={roleLogs}
        userRole={userRole}
      />
    </>
  );
}
