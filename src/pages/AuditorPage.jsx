"use client";

import React, { useEffect, useState } from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  FolderKanban,
  UsersRound,
  BarChart3,
  CircleAlert,
  Ticket,
  Mail,
  Bell,
} from "lucide-react";
import { useRoleDashboardTab } from "../hooks/useRoleDashboardTab";
import MobileNav from "../components/orgadmin/MobileNav";
import { getOrgAdminAuditOrg } from "../lib/orgAdminService";
import Cooperatives from "@/components/orgadmin/coops/Cooperatives";
import Issues from "@/components/orgadmin/issues/Issues";
import { fetchAuditorAuditOrg } from "@/lib/auditorService";
import AuditerNotification from "@/components/AuditerPage/AuditerNotification";
import TicketsAuditView from "@/components/AuditerPage/TicketsAuditView";
import MailDashboard from "@/components/mail/MailDashboard";
import { useAuth } from "@/hooks/useAuth";
import AuditorAudit from "@/components/AuditerPage/Audit";
import OverviewView from "@/components/AuditerPage/Overview";
import MyAudits from "@/components/AuditerPage/MyAudits";
import FoundingAuditDashboard from "@/components/orgadmin/FoundingAudit/Dashboard";

const ORG_ADMIN_TAB_MAP = {
  overview: "Overview",
  coops: "Cooperatives",
  founding_audit: "FoundingAudit",
  audit: "Audit",
  my_audit: "MyAudit",
  reports: "Reports",
  issues: "Issues",
  tickets: "Tickets",
  email: "Email",
  notifications: "Notification",
};

const SIDEBAR_TABS = [
  {
    id: "overview",
    view: "Overview",
    label: "Overview",
    icon: LayoutDashboard,
  },
  { id: "coops", view: "Cooperatives", label: "Portfolio", icon: Building2 },
  {
    id: "founding_audit",
    view: "FoundingAudit",
    label: "Founding Audit",
    icon: UsersRound,
  },
  {
    id: "audit",
    view: "Audit",
    label: "Audits",
    icon: ClipboardCheck,
  },
  {
    id: "my_audit",
    view: "MyAudit",
    label: "My Audits",
    icon: FolderKanban,
  },
  {
    id: "reports",
    view: "Reports",
    label: "Reports",
    icon: BarChart3,
  },
  {
    id: "issues",
    view: "Issues",
    label: "Issues",
    icon: CircleAlert,
  },
  {
    id: "tickets",
    view: "Tickets",
    label: "Tickets",
    icon: Ticket,
  },
  {
    id: "email",
    view: "Email",
    label: "Email",
    icon: Mail,
  },
  {
    id: "notifications",
    view: "Notification",
    label: "Notifications",
    icon: Bell,
  },
];

const Topbar = ({ activePage, auditOrgName }) => (
  <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex items-center flex-1 min-w-0 gap-2">
        <Building2 className="w-5 h-5 text-blue-600" />
        <span
          className="min-w-0 max-w-[40vw] truncate text-sm text-gray-500 dark:text-gray-400 sm:max-w-[18rem]"
          title={auditOrgName}
        >
          {auditOrgName}
        </span>
        <span className="text-gray-400">/</span>
        <h2 className="min-w-0 text-sm font-medium text-gray-700 truncate dark:text-gray-200">
          {activePage}
        </h2>
      </div>
    </div>
  </header>
);

function Sidebar({
  isSidebarOpen,
  setSidebarOpen,
  activeView,
  setActiveView,
  auditOrgName,
}) {
  const getTabClass = (isActive) =>
    `flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors duration-150 ease-in-out ${isActive
      ? "bg-primary text-white shadow-md"
      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
    } ${!isSidebarOpen ? "justify-center" : ""}`;

  const overviewTab = SIDEBAR_TABS.find((t) => t.id === "overview");

  return (
    <aside
      className={`fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] overflow-y-auto border-r border-gray-200 bg-white shadow-sm transition-all duration-300 dark:border-slate-700 dark:bg-slate-800 ${isSidebarOpen ? "w-64" : "w-20"}`}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between h-16 p-4 bg-white border-b border-gray-200 dark:bg-slate-800 dark:border-slate-700">
        <div
          className={`flex min-w-0 items-center gap-2 ${!isSidebarOpen ? "w-full justify-center" : ""}`}
        >
          <img
            src={`https://placehold.co/32x32/6366F1/FFFFFF?text=${auditOrgName?.charAt(0) || "A"}`}
            alt="Logo"
            className={`h-8 w-8 rounded-md ${isSidebarOpen ? "mr-2" : ""}`}
          />
          {isSidebarOpen && (
            <span
              className="min-w-0 text-xl font-bold text-gray-800 truncate dark:text-white"
              title={auditOrgName || "Audit Organization"}
            >
              {auditOrgName || "Audit Organization"}
            </span>
          )}
        </div>
        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="p-2 text-gray-600 transition-colors rounded-md hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isSidebarOpen ? (
            <ChevronLeft size={18} />
          ) : (
            <ChevronRight size={18} />
          )}
        </button>
      </div>

      <nav className="px-2 mt-2">
        {overviewTab && (
          <button
            onClick={() => setActiveView(overviewTab.view)}
            className={getTabClass(activeView === overviewTab.view)}
          >
            <overviewTab.icon className="w-5 h-5" />
            {isSidebarOpen && (
              <span className="font-medium">{overviewTab.label}</span>
            )}
          </button>
        )}

        {SIDEBAR_TABS.filter((t) => !["overview"].includes(t.id)).map(
          ({ view, label, icon: Icon }) => (
            <button
              key={view}
              onClick={() => {
                setActiveView(view);
              }}
              className={`${getTabClass(activeView === view)} mt-2`}
            >
              <Icon className="w-5 h-5" />
              {isSidebarOpen && <span className="font-medium"> {label}</span>}
            </button>
          ),
        )}
      </nav>
    </aside>
  );
}

function AuditorPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { activeView, setActiveView } = useRoleDashboardTab(
    ORG_ADMIN_TAB_MAP,
    "Overview",
  );

  const { user } = useAuth();

  const [theme] = useState(
    () =>
      (typeof window !== "undefined" ? localStorage.getItem("theme") : null) ||
      "light",
  );

  const [auditOrg, setAuditOrg] = useState(null);
  const [loadError, setLoadError] = useState("");

  const auditOrgName =
    auditOrg?.OrgName || auditOrg?.name || "Audit organization";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    if (typeof window !== "undefined") localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    let isActive = true;
    (async () => {
      setLoadError("");
      try {
        const res = await fetchAuditorAuditOrg();
        if (isActive) setAuditOrg(res?.auditOrg || null);
      } catch (err) {
        if (isActive) {
          setLoadError(err?.message || "Failed to load audit organization");
        }
      }
    })();
    return () => {
      isActive = false;
    };
  }, []);

  const renderContent = () => {
    switch (activeView) {
      case "Overview":
        return (
          <OverviewView auditOrg={auditOrg} />
        );
      case "Cooperatives":
        return <Cooperatives auditOrg={auditOrg} />;
      case "FoundingAudit":
        return (
          <div className="min-h-[70vh]"><FoundingAuditDashboard auditOrg={auditOrg} /></div>
        );
      case "Audit":
        return <AuditorAudit />;
      case "MyAudit":
        return (
          auditOrg && <MyAudits auditOrg={auditOrg} />
        );
      case "Reports":
        return <div className="min-h-[70vh]">Reports view coming soon...</div>;
      case "Issues":
        return auditOrg && <Issues auditOrg={auditOrg} />;
      case "Tickets":
        return user?.teamMemberId && <TicketsAuditView />;
      case "Email":
        return (
          <div className="p-1">
            <MailDashboard />
          </div>
        );
      case "Notification":
        return <AuditerNotification />;

      default:
        return <div className="min-h-[70vh]" />;
    }
  };

  return (
    <div className="flex min-h-screen font-sans text-gray-900 bg-gray-100 dark:bg-slate-900 dark:text-gray-200">
      <div className="hidden md:block">
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setSidebarOpen={setIsSidebarOpen}
          activeView={activeView}
          setActiveView={setActiveView}
          auditOrgName={auditOrgName}
        />
      </div>
      <main
        className={`flex-1 min-w-0 transition-all duration-300 ${isSidebarOpen ? "md:ml-64" : "md:ml-20"}`}
      >
        <Topbar activePage={activeView} auditOrgName={auditOrgName} />
        <MobileNav
          activeView={activeView}
          setActiveView={setActiveView}
          mobileTabs={SIDEBAR_TABS}
        />
        {loadError && (
          <div className="px-4 py-3 text-sm border-b border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            {loadError}
          </div>
        )}
        {renderContent()}
      </main>
    </div>
  );
}

export default AuditorPage;
