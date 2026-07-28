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
  User,
  Settings,
  LogOut,
  Building2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import CooperativeAuditView from "../components/AuditerPage/CooperativeAuditView";
import ComingSoon from "../components/ComingSoon";
import AuditerNotification from "../components/AuditerPage/AuditerNotification";
// import MessageBox from "../components/MessageBox"; //TODO : To be discussed
import TicketsAuditView from "../components/AuditerPage/TicketsAuditView";
import Link from "next/link";
import NotFoundPage from "./NotFoundPage";
import ProfilePage from "./ProfilePage";

import MailDashboard from "../components/mail/MailDashboard.jsx"; 
import { useRoleDashboardTab } from "@/hooks/useRoleDashboardTab";

const AUDITER_TAB_MAP = {
  dashboard: "Dashboard",
  cooperatives: "Cooperatives",
  notifications: "Notifications",
  tickets: "Tickets",
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
            GovAuditor
          </span>
          <span className="text-gray-400">/</span>
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {activePage}
          </h2>
        </div>

        {/* Search
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <span className="absolute -translate-y-1/2 left-3 top-1/2">
              <Search className="w-4 h-4 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search in Audit ( / )"
              className="w-full py-2 pr-3 text-sm bg-white border border-gray-200 pl-9 rounded-xl dark:border-gray-700 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div> */}

        {/* Actions
        <div className="flex items-center gap-1">
          <IconBtn label="Mail"><Mail className="w-5 h-5" /></IconBtn>
          <IconBtn label="Messages"><MessageSquare className="w-5 h-5" /></IconBtn>
          <IconBtn label="Notifications" badge><Bell className="w-5 h-5" /></IconBtn>

          
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="inline-flex items-center justify-center ml-1 border border-gray-200 h-9 w-9 rounded-xl dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="relative group">
            <button className="grid ml-1 text-xs font-semibold text-white bg-blue-600 h-9 w-9 rounded-xl place-items-center">
              {initials}
            </button>
            <div className="absolute right-0 w-48 mt-2 transition bg-white border border-gray-200 shadow-lg opacity-0 pointer-events-none rounded-xl dark:border-gray-700 dark:bg-gray-800 group-hover:opacity-100 group-hover:pointer-events-auto">
              <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                {user?.name || user?.email || 'Auditor'}
              </div>
              <MenuItem icon={<User className="w-4 h-4" />} text="Profile" />
              <MenuItem icon={<Settings className="w-4 h-4" />} text="Settings" />
              <div className="h-px mx-2 bg-gray-200 dark:bg-gray-700" />
              <MenuItem icon={<LogOut className="w-4 h-4" />} text="Log out" />
            </div>
          </div>
        </div> */}
      </div>
    </header>
  );
}

function IconBtn({ children, badge = false, label }) {
  return (
    <button
      aria-label={label}
      className="relative inline-flex items-center justify-center border border-gray-200 h-9 w-9 rounded-xl dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      {children}
      {badge && (
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-600 text-[10px] text-white grid place-items-center">
          3
        </span>
      )}
    </button>
  );
}

function MenuItem({ icon, text }) {
  return (
    <button className="flex items-center w-full gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
      {icon}
      {text}
    </button>
  );
}

/* ---------------- Sidebar ---------------- */
function Sidebar({ isSidebarOpen, setSidebarOpen, activePage, setActivePage }) {
  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Notifications", icon: Bell },
    { name: "Tickets", icon: MessageSquare },
    { name: "Email", icon: Mail },
    { name: "Profile", icon: User },
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
              GovAuditor
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
            const isActive = activePage === item.name;
            return (
              <li key={item.name}>
                <button
                  onClick={() => setActivePage(item.name)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  } ${!isSidebarOpen && "justify-center"}`}
                >
                  <item.icon className="w-5 h-5" />
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

/* ---------------- Page Hero + Lifecycle (Dashboard) ---------------- */
function DashboardHero({ onPrimary }) {
  return (
    <div className="px-6 pt-6">
      {/* <div className="p-6 bg-white border border-gray-200 rounded-2xl dark:border-gray-800 dark:bg-gray-900">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Audit cooperatives effectively!</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Create, customize and track cooperative audits.
        </p>
        <div className="mt-4">
          <button
            onClick={onPrimary}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700"
          >
            Create Audit
          </button>
        </div>
      </div> */}

      {/* Lifecycle (visual, lightweight) */}
      <section className="p-6 mt-8 bg-white border border-gray-200 rounded-2xl dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          Life cycle of an Audit
        </h2>
        <div className="grid gap-6 mt-4">
          <LifecycleRow
            title="CASE 1: Pre-Audit"
            steps={["Create Audit", "Convert to Open", "Ready for Visit?"]}
            yes="Mark as Scheduled"
            no="Mark as On Hold"
          />
          <LifecycleRow
            title="CASE 2: During Audit"
            steps={["Open", "Visit Started?", "Findings Recorded?"]}
            yes="Mark as Completed"
            no="Record Partial Findings"
          />
          <LifecycleRow
            title="CASE 3: Post-Audit"
            steps={["Completed", "Report Prepared?"]}
            yes="Send Report"
            no="Request Clarification"
          />
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            In the Audit module, you can:
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
            <li>✓ Create audits to accompany field inspections.</li>
            <li>
              ✓ Convert an audit into a report to charge or notify stakeholders.
            </li>
            <li>
              ✓ Mark audits as completed, on hold, or record partial findings.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

function LifecycleRow({ title, steps, yes, no }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
        {title}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((s, idx) => (
          <span
            key={idx}
            className="px-3 py-1 text-xs text-gray-700 border border-gray-200 rounded-full dark:border-gray-700 dark:text-gray-200"
          >
            {s}
          </span>
        ))}
        <span className="mx-2 text-xs text-gray-400">→</span>
        <span className="px-3 py-1 text-xs text-green-700 border border-green-200 rounded-full bg-green-50 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
          {yes}
        </span>
        <span className="px-3 py-1 text-xs border rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800">
          {no}
        </span>
      </div>
    </div>
  );
}

/* ---------------- Main Page ---------------- */
function GovAuditorPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { activeView: activePage, setActiveView: setActivePage } = useRoleDashboardTab(
    AUDITER_TAB_MAP,
    "Dashboard"
  );
  const [theme, setTheme] = useState(
    () => (typeof window !== "undefined" ? localStorage.getItem("theme") : null) || "light"
  );
  const { user } = useAuth();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const renderContent = () => {
    switch (activePage) {
      case "Dashboard":
        return (
          <>
            <DashboardHero onPrimary={() => setActivePage("Cooperatives")} />
            <div className="px-6 py-6">
              <CooperativeAuditView />
            </div>
          </>
        );
      case "Cooperatives":
        return (
          <div className="px-6 py-6">
            <CooperativeAuditView />
          </div>
        );
      case "Notifications":
        return (
          <div className="px-6 py-6">
            <AuditerNotification />
          </div>
        );
      case "Tickets":
        return (
          <div className="px-6 py-6">
            <TicketsAuditView />
          </div>
        );
      case "Email":
        return (
          <div className="px-6 py-6">
            <MailDashboard/>
          </div>
        );
      case "Profile":
        return (
          <div className="max-w-4xl mx-auto">
            <ProfilePage />
          </div>
        );
      default:
        return <NotFoundPage />;
    }
  };

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activePage={activePage}
          setActivePage={setActivePage}
        />
        <main
          className={`flex-1 transition-all duration-300 ${
            isSidebarOpen ? "ml-64" : "ml-20"
          }`}
        >
          <Topbar activePage={activePage} />
          {renderContent()}
        </main>
      </div>
    </ThemeCtx.Provider>
  );
}

export default GovAuditorPage;
