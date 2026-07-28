"use client";
import React, { useState, useEffect, createContext, useContext } from "react";
import {
  Sun,
  Moon,
  Search,
  Bell,
  Mail,
  MessageSquare,
  ListTodo,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Users,
  Settings,
  LogOut,
  Building2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import Overview from "@/components/subAuditor/Overview";
import SubAuditerNotify from "@/components/subAuditor/SubAuditorNotify";
import AssignedAudit from "@/components/subAuditor/AssignedAudit";
import CoopAuditView from "@/components/subAuditor/CoopAuditView";
import TicketsAuditView from "@/components/AuditerPage/TicketsAuditView";
import NotFoundPage from "./NotFoundPage.jsx";
import ProfilePage from "./ProfilePage";

import MailDashboard from "../components/mail/MailDashboard.jsx";
import { useRoleDashboardTab } from "@/hooks/useRoleDashboardTab";

const SUB_AUDITOR_TAB_MAP = {
  overview: "Overview",
  "audits-assigned": "Audits Assigned",
  tickets: "Tickets",
  notifications: "Notifications",
  email: "Email",
  profile: "Profile",
};

/* ---------------- Theme ---------------- */
const ThemeCtx = createContext({ theme: "light", toggle: () => {} });
const useTheme = () => useContext(ThemeCtx);

/* ---------------- Topbar ---------------- */
function Topbar({ activePage }) {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();

  const initials = (user?.name || user?.email || "A U D I T")
    .split(" ")
    .map((s) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 dark:bg-gray-900/80 backdrop-blur dark:border-gray-800">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Breadcrumb / Title */}
        <div className="flex items-center gap-2 min-w-[180px]">
          <Building2 className="w-5 h-5 text-blue-600" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Auditer
          </span>
          <span className="text-gray-400">/</span>
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {activePage}
          </h2>
        </div>
      </div>
    </header>
  );
}

/* ---------------- Sidebar ---------------- */
function Sidebar({ isSidebarOpen, setSidebarOpen, activeView, setActiveView }) {
  const navItems = [
    { name: "Overview", icon: LayoutDashboard, view: "Overview" },
    { name: "Audits Assigned", icon: Users, view: "Audits Assigned" },
    { name: "Tickets", icon: MessageSquare, view: "Tickets" },
    { name: "Notifications", icon: Bell, view: "Notifications" },
    { name: "Email", icon: Mail, view: "Email" },
    { name: "Profile", icon: Settings, view: "Profile" },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 shadow-sm ${
        isSidebarOpen ? "w-64" : "w-20"
      } z-50`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200 dark:border-gray-800">
        {isSidebarOpen && (
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-white">
              Auditor
            </h1>
          </div>
        )}
        {!isSidebarOpen && (
          <div className="flex justify-center w-full">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700">
              <Building2 className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="p-1.5 text-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300 transition-colors"
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isSidebarOpen ? (
            <ChevronLeft size={18} />
          ) : (
            <ChevronRight size={18} />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="px-3 mt-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeView === item.view;
            return (
              <li key={item.name}>
                <button
                  onClick={() => setActiveView(item.view)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  } ${!isSidebarOpen && "justify-center"}`}
                >
                  <item.icon
                    className={`${isActive ? "w-5 h-5" : "w-5 h-5"}`}
                  />
                  {isSidebarOpen && (
                    <span className="font-medium">{item.name}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer - Optional */}
      {isSidebarOpen && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="text-xs text-center text-gray-500 dark:text-gray-400">
            © 2025 DigiCoop
          </div>
        </div>
      )}
    </aside>
  );
}

/* ---------------- Main Page ---------------- */
function SubAuditerPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const [theme, setTheme] = useState(
    () => (typeof window !== "undefined" ? localStorage.getItem("theme") : null) || "light"
  );
  const { user } = useAuth();
  const { activeView, setActiveView } = useRoleDashboardTab(SUB_AUDITOR_TAB_MAP, "Overview");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const renderView = () => {
    switch (activeView) {
      case "Overview":
        return <Overview />;
      case "Audits Assigned":
        return <CoopAuditView userId={user?.$id} />;
      case "Notifications":
        return <SubAuditerNotify />;
      case "Tickets":
        return <TicketsAuditView />;
      case "Profile":
        return (
          <div className="max-w-4xl mx-auto">
            <ProfilePage />
          </div>
        );
      case "Email":
              return (
                <div className="px-6 py-6">
                  <MailDashboard/>
                </div>
              );
    }
  };

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeView={activeView}
          setActiveView={setActiveView}
        />
        <main
          className={`flex-1 transition-all duration-300 ${
            isSidebarOpen ? "ml-64" : "ml-20"
          }`}
        >
          <Topbar activePage={activeView} />
          <div className="p-6">{renderView()}</div>
        </main>
      </div>
    </ThemeCtx.Provider>
  );
}

export default SubAuditerPage;
