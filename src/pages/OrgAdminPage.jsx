"use client";

import React, { useEffect, useState } from "react";
import {
  Building2,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Users,
  Sparkles,
  CloudUpload,
  FileText,
  ClipboardCheck,
  UsersRound,
  BarChart3,
  Mail,
} from "lucide-react";
import { useRoleDashboardTab } from "../hooks/useRoleDashboardTab";
import OverviewView from "../components/orgadmin/OverviewView";
import TeamView from "../components/orgadmin/TeamView";
import GenGView from "../components/orgadmin/GenGView";
import MobileNav from "../components/orgadmin/MobileNav";
import {
  getOrgAdminAuditOrg,
  getOrgAdminTeamMembers,
} from "../lib/orgAdminService";
import Cooperatives from "@/components/orgadmin/coops/Cooperatives";
import Uploads from "@/components/orgadmin/Uploads";
import Issues from "@/components/orgadmin/issues/Issues";
import Audit from "@/components/orgadmin/Audit";
import FoundingAuditDashboard from "@/components/orgadmin/FoundingAudit/Dashboard";
import { useAuth } from "@/hooks/useAuth";
import AuditForms from "@/components/orgadmin/AuditForms";

const TEAM_MEMBERS_PAGE_SIZE = 10;

const MOBILE_TABS = [
  { name: "Overview", view: "Overview", icon: LayoutDashboard },
  { name: "Team", view: "Team", icon: Users },
  { name: "GenG", view: "GenG", icon: Sparkles },
];

const ORG_ADMIN_TAB_MAP = {
  overview: "Overview",
  "onboarding-team": "Team",
  "onboarding-geng": "GenG",
  coops: "Cooperatives",
  form_builder: "FormBuilder",
  "founding-audit": "FoundingAudit",
  audit: "Audit",
  uploads: "Uploads",
  reports: "Reports",
  issues: "Issues",
  email: "Email",
};

const SIDEBAR_TABS = [
  {
    id: "overview",
    view: "Overview",
    label: "Overview",
    icon: LayoutDashboard,
  },
  { id: "onboarding-team", view: "Team", label: "Team", icon: Users },
  { id: "onboarding-geng", view: "GenG", label: "GenG", icon: Sparkles },
  { id: "coops", view: "Cooperatives", label: "Portfolio", icon: Building2 },
  {
    id: "form_builder",
    view: "FormBuilder",
    label: "Form Builder",
    icon: FileText,
  },
  {
    id: "founding-audit",
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
  { id: "uploads", view: "Uploads", label: "Uploads", icon: CloudUpload },
  {
    id: "reports",
    view: "Reports",
    label: "Reports",
    icon: BarChart3,
  },
  { id: "issues", view: "Issues", label: "Issues", icon: ClipboardList },
  { id: "email", view: "Email", label: "Email", icon: Mail },
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
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(true);

  useEffect(() => {
    if (activeView === "Team" || activeView === "GenG")
      setIsOnboardingOpen(true);
  }, [activeView]);

  const getTabClass = (isActive) =>
    `flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors duration-150 ease-in-out ${
      isActive
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

        <div className="mt-2">
          <button
            type="button"
            onClick={() => setIsOnboardingOpen((curr) => !curr)}
            className={`flex w-full items-center rounded-md px-3 py-2.5 text-sm transition-colors duration-150 ease-in-out ${activeView === "Team" || activeView === "GenG" ? "bg-primary/10 text-primary dark:bg-primary/20" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"} ${!isSidebarOpen ? "justify-center" : ""}`}
            title="Onboarding"
          >
            <ClipboardList
              size={18}
              className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
            />
            {isSidebarOpen && (
              <>
                <span className="text-sm font-medium">Onboarding</span>
                <span className="ml-auto">
                  {isOnboardingOpen ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </span>
              </>
            )}
          </button>

          {isSidebarOpen && isOnboardingOpen && (
            <div className="pl-2 mt-2 ml-5 border-l-2 border-gray-200 dark:border-slate-600">
              {SIDEBAR_TABS.filter((t) => t.id.startsWith("onboarding-")).map(
                ({ id, label, icon: Icon, view }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setActiveView(view);
                      setIsOnboardingOpen(true);
                    }}
                    className={`mb-1 flex w-full items-center rounded-md px-2 py-2 text-left text-sm transition-colors duration-150 ease-in-out ${activeView === view ? "bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-gray-200 shadow-sm" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"}`}
                  >
                    <Icon size={16} className="mr-3 shrink-0" />
                    {label}
                  </button>
                ),
              )}
            </div>
          )}
        </div>

        {SIDEBAR_TABS.filter((t) =>
          [
            "coops",
            "audit",
            "form_builder",
            "founding-audit",
            "email",
            "reports",
            "uploads",
            "issues",
          ].includes(t.id),
        ).map(({ view, label, icon: Icon }) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`${getTabClass(activeView === view)} mt-2`}
          >
            <Icon className="w-5 h-5" />
            {isSidebarOpen && <span className="font-medium"> {label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}

function OrgAdminPage() {
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
  const [defaultPassword, setDefaultPassword] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [auditOrg, setAuditOrg] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamPage, setTeamPage] = useState(1);
  const [teamReloadToken, setTeamReloadToken] = useState(0);
  const [isLoadingTeamMembers, setIsLoadingTeamMembers] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [teamPagination, setTeamPagination] = useState({
    total: 0,
    page: 1,
    limit: TEAM_MEMBERS_PAGE_SIZE,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const auditOrgName =
    auditOrg?.OrgName || auditOrg?.name || "Audit organization";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    if (typeof window !== "undefined") localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    let isActive = true;
    (async () => {
      setIsLoadingTeamMembers(true);
      setLoadError("");
      try {
        const res = await getOrgAdminAuditOrg();
        if (isActive) setAuditOrg(res?.auditOrg || null);
      } catch (err) {
        if (isActive) {
          setTeamMembers([]);
          setLoadError(err?.message || "Failed to load audit organization");
        }
      } finally {
        if (isActive) setIsLoadingTeamMembers(false);
      }
    })();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!auditOrg?.id) return;
    let isActive = true;
    (async () => {
      setIsLoadingTeamMembers(true);
      setLoadError("");
      try {
        const res = await getOrgAdminTeamMembers({
          orgId: auditOrg.id,
          page: teamPage,
          limit: TEAM_MEMBERS_PAGE_SIZE,
        });
        if (isActive) {
          setTeamMembers(res?.teamMembers || res?.documents || []);
          setTeamPagination(
            res?.pagination || {
              total: res?.teamMembers?.length || 0,
              page: teamPage,
              limit: TEAM_MEMBERS_PAGE_SIZE,
              totalPages: 1,
              hasNextPage: false,
              hasPrevPage: false,
            },
          );
        }
      } catch (err) {
        if (isActive) {
          setTeamMembers([]);
          setLoadError(err?.message || "Failed to load team members");
        }
      } finally {
        if (isActive) setIsLoadingTeamMembers(false);
      }
    })();
    return () => {
      isActive = false;
    };
  }, [auditOrg?.id, teamPage, teamReloadToken]);

  const refreshTeamMembers = () => setTeamReloadToken((curr) => curr + 1);

  const renderContent = () => {
    switch (activeView) {
      case "Overview":
        return <OverviewView auditOrg={auditOrg} />;
      case "Team":
        return (
          <TeamView
            defaultPassword={defaultPassword}
            setDefaultPassword={setDefaultPassword}
            isDrawerOpen={isDrawerOpen}
            setDrawerOpen={setIsDrawerOpen}
            teamMembers={teamMembers}
            setTeamMembers={setTeamMembers}
            teamPagination={teamPagination}
            onPageChange={setTeamPage}
            onTeamMembersChanged={refreshTeamMembers}
            auditOrgName={auditOrgName}
            isLoading={isLoadingTeamMembers}
          />
        );
      case "GenG":
        return (
          <GenGView auditOrgName={auditOrgName} auditOrgId={auditOrg?.id} />
        );
      case "Cooperatives":
        return <Cooperatives auditOrg={auditOrg} />;
      case "Uploads":
        return <Uploads auditOrg={auditOrg} />;
      case "Issues":
        return auditOrg && <Issues auditOrg={auditOrg} />;
      case "Audit":
        return auditOrg && <Audit auditOrg={auditOrg} user={user} />;
      case "FormBuilder":
        return <AuditForms auditOrg={auditOrg} user={user} />;
      case "FoundingAudit":
        return <FoundingAuditDashboard auditOrg={auditOrg} />;
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

export default OrgAdminPage;
