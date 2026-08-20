"use client";
import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

import {
  Loader2,
  AlertTriangle,
  CheckCheck,
  BarChart2,
  CalendarDays,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  DollarSign,
  Download,
  File,
  FileChartColumn,
  FileText,
  Folder,
  FolderClock,
  FolderOpenDot,
  History,
  Landmark,
  Layers,
  LayoutDashboard,
  Mail,
  PenTool,
  Plug,
  Receipt,
  ScrollText,
  Send,
  Settings,
  ShieldAlert,
  ShieldCheck,
  SquareUserRound,
  TrendingUp,
  UserCog,
  Users,
  Users2,
  Wallet,
  X,
  Ticket,
  FileSignature,
  UserPlus,
  ChartNoAxesCombined,
  ArrowRight,
  Megaphone,
  CreditCard,
  WalletCards,
} from "lucide-react";

import MemberOnboardingView from "@/components/coopadmin/MemberOnboardingView.jsx";
import AdminOnboardingView from "@/components/coopadmin/AdminOnboardingView.jsx";

import { getActivePollsCountByCoopId } from "@/lib/votingService.js";

import FormerMembersView from "@/components/coopadmin/FormerMembersView.jsx";
import MemberDirectoryView from "@/components/coopadmin/MemberDirectoryView.jsx";
import ProposalView from "@/components/coopadmin/ProposalsView.jsx";
import TransactionsView from "@/components/coopadmin/TransactionsView.jsx";

import NotificationBox from "@/components/NotificationBox.jsx";
import { getCoopAdmins } from "@/lib/getCoopsService.js";
import { getMembersOfCoop } from "@/lib/transactionService.js";
import { useAuth } from "../hooks/useAuth.js";
import { useLanguage } from "@/contexts/LanguageContext.jsx";
// import MessageBox from "@/components/MessageBox.jsx"; //TODO : To be discussed
import AuditView from "@/components/coopadmin/AuditView.jsx";
import CalendarDashboard from "@/components/coopadmin/CalendarDashboard.jsx";
import { CompliancePopUpInfo } from "@/components/coopadmin/CompliancePopUpInfo.jsx";
import CoopDocsUploader from "@/components/coopadmin/CoopDocsUploader.jsx";
import CooperativeSettingsView from "@/components/coopadmin/CooperativeSettingsView.jsx";
import CreateGroup from "@/components/coopadmin/CreateGroup.jsx";
import DatevExportDashboard from "@/components/coopadmin/DatevExportDashboard.jsx";
import DocShare from "@/components/coopadmin/DocShare.jsx";
import ESignatureDashboard from "@/components/coopadmin/ESignatureDashboard.jsx";
import FinancialAnalysisDashboard from "@/components/coopadmin/FinancialAnalysisDashboard.jsx";
import IntegrationsDashboard from "@/components/coopadmin/IntegrationsDashboard.jsx";
import InvoicesDashboard from "@/components/coopadmin/InvoicesDashboard.jsx";
import NiederschriftPage from "@/components/coopadmin/NiederschriftView.jsx";
import PayoutsView from "@/components/coopadmin/PayoutsView.jsx";
import AssemblyDashboardView from "@/components/coopadmin/assembly/AssemblyDashboardView.jsx";
import CreateAssemblyView from "@/components/coopadmin/assembly/CreateAssemblyView.jsx";
import OverviewLoader from "@/components/loaders/OverviewLoader.jsx";
import MailDashboard from "@/components/mail/MailDashboard.jsx";
import VerificationPage from "@/components/shared/VerificationPage.jsx";
import useClickOutside from "@/hooks/useClickOutside.js";
import { useRoleDashboardTab } from "@/hooks/useRoleDashboardTab";
import {
  getAssembliesByCoopId,
  updateAssemblyStatus,
} from "@/lib/assemblyService.js";
import { getComplianceInfoByCoopId } from "@/lib/helpers/_complianceHelpers.js";
import AuditPage from "./AuditPage.jsx";
import { button } from "framer-motion/client";
import { getRelativeTime } from "@/lib/helpers/_auxilaryHelpers.js";
import AuditHistoryView from "@/components/coopadmin/AuditHistoryView.jsx";
import InviteAdminView from "@/components/coopadmin/coopadminInvitation/InviteAdminView.jsx";
import ShareRegisterReport from "../components/coopadmin/ShareRegisterReport.jsx";
import CapitalSummaryReport from "../components/coopadmin/CapitalSummaryReport.jsx";
import ProfilePage from "./ProfilePage.jsx";
import { getAuditDiscrepancyForCoopAdmin } from "@/lib/auditDiscrepancy.js";
import NotificationLoader from "@/components/loaders/NotificationLoader.jsx";
import Link from "next/link.js";
import NoticeboardView from "@/components/coopadmin/NoticeboardView.jsx";
import SubscriptionPage from "@/components/coopadmin/Subscription.jsx";

// --- UTILITY HOOK ---
const useOutsideClick = (ref, callback) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) callback();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback]);
};

// --- NAVIGATION ITEMS ---
const navItems = {
  Dashboard: [{ name: "Overview", icon: LayoutDashboard, view: "Overview" }],
  Management: [
    { name: "Transactions", icon: DollarSign, view: "Transactions" },
    { name: "Payouts", icon: Wallet, view: "Payouts" },
    // { name: "Audit", icon: History, view: "Audit" },
    { name: "Notice Board", icon: Megaphone, view: "Noticeboard" },
    { name: "GenG Settings", icon: Settings, view: "Settings" },
    { name: "Mails", icon: Mail, view: "Mails" },
  ],
};

// Governance dropdown items (collapsible)
const governanceItems = [
  // { name: "Assembly", icon: Gavel, view: "Assembly", comingSoon: false },
  // { name: "Polls", icon: BarChart2, view: "Polls", comingSoon: false },
  { name: "eSignature", icon: PenTool, view: "ESignature", comingSoon: false },
  { name: "Calendar", icon: CalendarDays, view: "Calendar", comingSoon: false },
];
// Finance dropdown items (collapsible)
const financeItems = [
  {
    name: "Financial Analysis",
    icon: TrendingUp,
    view: "FinancialAnalysis",
    comingSoon: false,
  },
  { name: "Invoices", icon: Receipt, view: "Invoices", comingSoon: false },
  {
    name: "DATEV Export",
    icon: Download,
    view: "DatevExport",
    comingSoon: false,
  },
];

const reportsItems = [
  {
    name: "Share Register Summary",
    icon: FileChartColumn,
    view: "ShareRegisterReport",
  },
  {
    name: "Financial Year Summary",
    icon: ChartNoAxesCombined,
    view: "CapitalSummaryReport",
  },
];

const docsItems = [
  { name: "Repository", icon: Folder, view: "DocUpload", comingSoon: false },
  { name: "Sharing", icon: Send, view: "DocShare", comingSoon: false },
];

const membersItems = [
  { name: "Directory", icon: Users, view: "ShowMembers", comingSoon: false },
  { name: "Group", icon: Layers, view: "CreateGroup", comingSoon: false },
  {
    name: "Former Members",
    icon: Users2,
    view: "FormerMembers",
    comingSoon: false,
  },
];

const onboardingItems = [
  { name: "Admin", icon: ShieldCheck, view: "OnboardingAdmins" },
  { name: "Member", icon: Users, view: "OnboardingMembers" },
];

const assemblyItems = [
  {
    name: "Assembly",
    icon: BarChart2,
    view: "assemblyPolls",
    comingSoon: false,
  },
  {
    name: "Niederschrift",
    icon: ScrollText,
    view: "Niederschrift",
    comingSoon: false,
  },
];

const ticketsItems = [
  {
    name: "Filing",
    icon: FileSignature,
    view: "Filing",
    comingSoon: false,
  },
  {
    name: "History",
    icon: History,
    view: "History",
    comingSoon: false,
  },
  {
    name: "Discrepancy",
    icon: ShieldAlert,
    view: "Discrepancy",
    comingSoon: false,
  },
];

// Bottom nav items (Profile, Pending Action)
const bottomNavItems = [
  // { name: "Integrations", icon: Plug, view: "Integrations" },
  { name: "Pending Action", icon: ShieldAlert, view: "Verification" },
  { name: "Profile", icon: UserCog, view: "Profile" },
  {name: "Subscriptions", icon: WalletCards, view: "Subscriptions" },
];
const allNavItems = Object.values(navItems).flat();

const ADMIN_TAB_MAP = {
  overview: "Overview",
  noticeboard: "Noticeboard",
  "invite-admin": "InviteAdmin",
  members: "MemberDirectory",
  "member-directory": "MemberDirectory",
  transactions: "Transactions",
  payouts: "Payouts",
  // audit: "Audit",
  documents: "Documents",
  settings: "Settings",
  mails: "Mails",
  polls: "Polls",
  assembly: "assemblyPolls",
  "create-assembly": "CreateAssembly",
  governance: "Polls",
  verification: "Verification",
  profile: "Profile",
  "financial-analysis": "FinancialAnalysis",
  finance: "FinancialAnalysis",
  invoices: "Invoices",
  "datev-export": "DatevExport",
  integrations: "Integrations",
  "e-signature": "ESignature",
  calendar: "Calendar",
  "doc-upload": "DocUpload",
  "doc-share": "DocShare",
  "show-members": "ShowMembers",
  "create-group": "CreateGroup",
  "assembly-polls": "assemblyPolls",
  niederschrift: "Niederschrift",
  "former-members": "FormerMembers",
  proposals: "Proposal",
  filing: "Filing",
  history: "History",
  discrepancy: "Discrepancy",
  "onboarding-admin": "OnboardingAdmins",
  "onboarding-member": "OnboardingMembers",
  "share-register": "ShareRegisterReport",
  "capital-summary": "CapitalSummaryReport",
  "subscriptions": "Subscriptions",
};

// --- UI COMPONENTS ---

const Sidebar = ({
  activeView,
  setActiveView,
  isSidebarOpen,
  setIsSidebarOpen,
  initIsVerified,
  isVerified,
  isCoopLive = false,
  testBlankTabEnabled = false,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isGovernanceOpen, setIsGovernanceOpen] = useState(false);

  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isAssemblyOpen, setIsAssemblyOpen] = useState(false);
  const [isTicketsOpen, setIsTicketsOpen] = useState(false);

  // Check if any finance view is active
  const isFinanceViewActive = financeItems.some(
    (item) => item.view === activeView,
  );
  const isReportsViewActive = reportsItems.some(
    (item) => item.view === activeView,
  );
  const isGovernanceViewActive = governanceItems.some(
    (item) => item.view === activeView,
  );
  const isDocumentViewActive = docsItems.some(
    (item) => item.view === activeView,
  );
  const isMemberViewActive = membersItems.some(
    (item) => item.view === activeView,
  );
  const isAssemblyViewActive = assemblyItems.some((item) => {
    return item.view === activeView || activeView === "CreateAssembly";
  });
  const isTicketsViewActive = ticketsItems.some(
    (item) => item.view === activeView,
  );

  useEffect(() => {
    if (isGovernanceViewActive) {
      setIsGovernanceOpen(true);
    }
  }, [isGovernanceViewActive]);

  useEffect(() => {
    if (isFinanceViewActive) {
      setIsFinanceOpen(true);
    }
  }, [isFinanceViewActive]);

  useEffect(() => {
    if (isReportsViewActive) {
      setIsReportsOpen(true);
    }
  }, [isReportsViewActive]);

  useEffect(() => {
    if (isDocumentViewActive) {
      setIsDocumentsOpen(true);
    }
  }, [isDocumentViewActive]);

  useEffect(() => {
    if (isMemberViewActive) {
      setIsMembersOpen(true);
    }
  }, [isMemberViewActive]);

  useEffect(() => {
    if (isAssemblyViewActive) {
      setIsAssemblyOpen(true);
    }
  }, [isAssemblyViewActive]);

  useEffect(() => {
    if (isTicketsViewActive) {
      setIsTicketsOpen(true);
    }
  }, [isTicketsViewActive]);

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const isOnboardingViewActive = [
    "OnboardingAdmins",
    "OnboardingMembers",
  ].includes(activeView);

  useEffect(() => {
    if (isOnboardingViewActive) {
      setIsOnboardingOpen(true);
    }
  }, [isOnboardingViewActive]);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transition-all duration-300 ease-in-out ${
        isSidebarOpen ? "w-64" : "w-20"
      } flex flex-col`}
    >
      <div
        className={`flex items-center justify-between p-4 sticky top-0 bg-white dark:bg-slate-800 z-10 h-16`}
      >
        {isSidebarOpen && (
          <div className="flex items-center">
            <img
              src="https://placehold.co/32x32/6366F1/FFFFFF?text=DC"
              alt="Logo"
              className="w-8 h-8 mr-2 rounded-md"
            />
            <span className="text-xl font-bold text-gray-800 dark:text-white">
              DigiCoop
            </span>
          </div>
        )}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-gray-600 rounded-md dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
        >
          {isSidebarOpen ? (
            <ChevronLeft size={20} />
          ) : (
            <ChevronRight size={20} />
          )}
        </button>
      </div>

      {isSidebarOpen && (
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center justify-center w-6 h-6 text-white bg-primary">
              <SquareUserRound size={22} />
            </div>
            <p className="text-sm font-semibold text-gray-800 dark:text-white">
              {user?.name || "User"}
            </p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {user?.email}
          </p>
        </div>
      )}

      <nav className="flex-grow px-2 mt-2 overflow-y-auto scrollbar-hide">
        {/* Dashboard Section */}
        <div className="mb-3">
          {isSidebarOpen && (
            <h3 className="px-3 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
              {t("Dashboard")}
            </h3>
          )}
          <ul>
            <li className="mb-1">
              <button
                onClick={() => setActiveView("Overview")}
                className={`w-full flex items-center py-2.5 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                  activeView === "Overview"
                    ? "bg-primary text-white shadow-md"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                } ${!isSidebarOpen ? "justify-center" : ""}`}
                title={t("Overview")}
              >
                <LayoutDashboard
                  size={isSidebarOpen ? 18 : 22}
                  className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                />
                {isSidebarOpen && (
                  <span className="text-sm font-medium">{t("Overview")}</span>
                )}
              </button>
            </li>
          </ul>
        </div>

        {testBlankTabEnabled && (
          <div className="mb-3">
            <ul>
              <li className="mb-1">
                <button
                  onClick={() => setActiveView("TestBlankTab")}
                  className={`w-full flex items-center py-2.5 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                    activeView === "TestBlankTab"
                      ? "bg-primary text-white shadow-md"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                  } ${!isSidebarOpen ? "justify-center" : ""}`}
                  title="Test feature"
                >
                  <File
                    size={isSidebarOpen ? 18 : 22}
                    className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                  />
                  {isSidebarOpen && <span className="text-sm font-medium">Test feature</span>}
                </button>
              </li>
            </ul>
          </div>
        )}

        {/* Onboarding Collapsible Dropdown */}
        <div className="mb-3">
          {isSidebarOpen && (
            <h3 className="px-3 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
              {t("Onboarding")}
            </h3>
          )}
          <ul>
            <li className="mb-1">
              <button
                onClick={() => setIsOnboardingOpen(!isOnboardingOpen)}
                className={`w-full flex items-center py-2.5 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                  isOnboardingViewActive
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                } ${!isSidebarOpen ? "justify-center" : ""}`}
                title={t("Onboarding")}
              >
                <UserPlus
                  size={isSidebarOpen ? 18 : 22}
                  className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                />
                {isSidebarOpen && (
                  <>
                    <span className="text-sm font-medium dark:text-slate-200">
                      {t("Onboarding")}
                    </span>
                    <span className="ml-auto">
                      <ChevronDown
                        size={16}
                        className={`ease-in-out duration-150 ${!isOnboardingOpen ? "rotate-0" : "rotate-180"}`}
                      />
                    </span>
                  </>
                )}
              </button>
            </li>

            {(isOnboardingOpen || !isSidebarOpen) && (
              <div
                className={`${isSidebarOpen ? "ml-4 border-l-2 border-gray-200 dark:border-slate-600" : ""}`}
              >
                {onboardingItems.map((item) => (
                  <li key={item.name} className="mb-1">
                    <button
                      onClick={() => setActiveView(item.view)}
                      className={`w-full flex items-center py-2 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                        activeView === item.view
                          ? "bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-gray-200 shadow-sm"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                      } ${!isSidebarOpen ? "justify-center" : ""}`}
                      title={t(item.name)}
                    >
                      <item.icon
                        size={isSidebarOpen ? 16 : 20}
                        className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                      />
                      {isSidebarOpen && (
                        <span className="text-sm font-medium">
                          {t(item.name)}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </div>
            )}
          </ul>
        </div>

        {/* Management Section */}
        <div className="mb-3">
          {isSidebarOpen && (
            <h3 className="px-3 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
              {t("Management")}
            </h3>
          )}
          <ul>
            {navItems.Management.map((item) => (
              <li key={item.name} className="mb-1">
                <button
                  onClick={() => setActiveView(item.view)}
                  className={`w-full flex items-center py-2.5 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                    activeView === item.view
                      ? "bg-primary text-white shadow-md"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                  } ${!isSidebarOpen ? "justify-center" : ""}`}
                  title={t(item.name)}
                >
                  <item.icon
                    size={isSidebarOpen ? 18 : 22}
                    className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                  />
                  {isSidebarOpen && (
                    <span className="text-sm font-medium">{t(item.name)}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Tickets Collapsible Dropdown */}
        <div className="mb-3">
          {isSidebarOpen && (
            <h3 className="px-3 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
              {t("Audits")}
            </h3>
          )}

          <ul>
            {/* Tickets Dropdown Toggle */}
            <li className="mb-1">
              <button
                onClick={() => setIsTicketsOpen(!isTicketsOpen)}
                className={`w-full flex items-center py-2.5 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                  isTicketsViewActive
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                } ${!isSidebarOpen ? "justify-center" : ""}`}
                title={t("Audits")}
              >
                <Ticket
                  size={isSidebarOpen ? 18 : 22}
                  className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                />

                {isSidebarOpen && (
                  <>
                    <span className="text-sm font-medium dark:text-slate-200">
                      {t("Audits")}
                    </span>

                    <span className="ml-auto">
                      <ChevronDown
                        size={16}
                        className={`ease-in-out duration-150 ${
                          !isTicketsOpen ? "rotate-0" : "rotate-180"
                        }`}
                      />
                    </span>
                  </>
                )}
              </button>
            </li>

            {/* Tickets Sub-items */}
            {(isTicketsOpen || !isSidebarOpen) && (
              <div
                className={`${
                  isSidebarOpen
                    ? "ml-4 border-l-2 border-gray-200 dark:border-slate-600"
                    : ""
                }`}
              >
                {ticketsItems.map((item) => {
                  const isDisabled = item.view === "Filing" && !isCoopLive;
                  return (
                    <li key={item.name} className="mb-1">
                      <button
                        onClick={() => !isDisabled && setActiveView(item.view)}
                        disabled={isDisabled}
                        className={`w-full flex items-center py-2 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                          isDisabled
                            ? "text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50"
                            : activeView === item.view
                              ? "bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-gray-200 shadow-sm"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                        } ${!isSidebarOpen ? "justify-center" : ""}`}
                        title={
                          isDisabled
                            ? `${t(item.name)} (Only available for live cooperatives)`
                            : t(item.name)
                        }
                      >
                        <item.icon
                          size={isSidebarOpen ? 16 : 20}
                          className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                        />

                        {isSidebarOpen && (
                          <span className="text-sm font-medium">
                            {t(item.name)}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </div>
            )}
          </ul>
        </div>

        {/* Members Collapsible Dropdown */}
        <div className="mb-3">
          {isSidebarOpen && (
            <h3 className="px-3 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
              {t("Members")}
            </h3>
          )}
          <ul>
            {/* Documents Dropdown Toggle */}
            <li className="mb-1">
              <button
                onClick={() => setIsMembersOpen(!isMembersOpen)}
                className={`w-full flex items-center py-2.5 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                  isMemberViewActive
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                } ${!isSidebarOpen ? "justify-center" : ""}`}
                title={t("Members")}
              >
                <UserCog
                  size={isSidebarOpen ? 18 : 22}
                  className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                />
                {isSidebarOpen && (
                  <>
                    <span className="text-sm font-medium dark:text-slate-200">
                      {t("Members")}
                    </span>
                    <span className="ml-auto">
                      {isMembersOpen ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </span>
                  </>
                )}
              </button>
            </li>

            {/* Documents Sub-items */}
            {(isMembersOpen || !isSidebarOpen) && (
              <div
                className={`${isSidebarOpen ? "ml-4 border-l-2 border-gray-200 dark:border-slate-600" : ""}`}
              >
                {membersItems.map((item) => (
                  <li key={item.name} className="mb-1">
                    <button
                      onClick={() => setActiveView(item.view)}
                      className={`w-full flex items-center py-2 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                        activeView === item.view
                          ? "bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-gray-200 shadow-sm"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                      } ${!isSidebarOpen ? "justify-center" : ""}`}
                      title={t(item.name)}
                    >
                      <item.icon
                        size={isSidebarOpen ? 16 : 20}
                        className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                      />

                      {isSidebarOpen && (
                        <span className="text-sm font-medium">
                          {t(item.name)}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </div>
            )}

            {/* Proposals button */}
            <li className="mt-1 mb-1">
              <button
                onClick={() => setActiveView("Proposal")}
                className={`w-full flex items-center py-2.5 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                  activeView === "Proposal"
                    ? "bg-primary text-white shadow-md animate-scaleIn"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                } ${!isSidebarOpen ? "justify-center" : ""}`}
                title={t("Proposals")}
              >
                <FileText
                  size={isSidebarOpen ? 18 : 22}
                  className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                />
                {isSidebarOpen && (
                  <span className="text-sm font-medium">{t("Proposals")}</span>
                )}
              </button>
            </li>
          </ul>
        </div>

        {/* Assembly Collapsible Dropdown */}
        <div className="mb-3">
          {isSidebarOpen && (
            <h3 className="px-3 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
              {t("Assembly")}
            </h3>
          )}
          <ul>
            {/* Assembly Dropdown Toggle */}
            <li className="mb-1">
              <button
                onClick={() => setIsAssemblyOpen(!isAssemblyOpen)}
                className={`w-full flex items-center py-2.5 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                  isAssemblyViewActive
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                } ${!isSidebarOpen ? "justify-center" : ""}`}
                title={t("Assembly")}
              >
                <Landmark
                  size={isSidebarOpen ? 18 : 22}
                  className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                />
                {isSidebarOpen && (
                  <>
                    <span className="text-sm font-medium dark:text-slate-200">
                      {t("Assembly")}
                    </span>
                    <span className="ml-auto">
                      <ChevronDown
                        size={16}
                        className={`ease-in-out duration-150 ${!isAssemblyOpen ? "rotate-0" : "rotate-180"}`}
                      />
                    </span>
                  </>
                )}
              </button>
            </li>

            {/* Assembly Sub-items */}
            {(isAssemblyOpen || !isSidebarOpen) && (
              <div
                className={`${isSidebarOpen ? "ml-4 border-l-2 border-gray-200 dark:border-slate-600" : ""}`}
              >
                {assemblyItems.map((item) => (
                  <li key={item.name} className="mb-1">
                    <button
                      onClick={() => setActiveView(item.view)}
                      className={`w-full flex items-center py-2 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                        activeView === item.view
                          ? "bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-gray-200 shadow-sm"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                      } ${!isSidebarOpen ? "justify-center" : ""}`}
                      title={t(item.name)}
                    >
                      <item.icon
                        size={isSidebarOpen ? 16 : 20}
                        className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                      />

                      {isSidebarOpen && (
                        <span className="text-sm font-medium">
                          {t(item.name)}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </div>
            )}
          </ul>
        </div>

        {/* Documents Collapsible Dropdown */}
        <div className="mb-3">
          {isSidebarOpen && (
            <h3 className="px-3 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
              {t("Documents")}
            </h3>
          )}
          <ul>
            {/* Documents Dropdown Toggle */}
            <li className="mb-1">
              <button
                onClick={() => setIsDocumentsOpen(!isDocumentsOpen)}
                className={`w-full flex items-center py-2.5 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                  isDocumentViewActive
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                } ${!isSidebarOpen ? "justify-center" : ""}`}
                title={t("Documents")}
              >
                <File
                  size={isSidebarOpen ? 18 : 22}
                  className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                />
                {isSidebarOpen && (
                  <>
                    <span className="text-sm font-medium dark:text-slate-200">
                      {t("Documents")}
                    </span>
                    <span className="ml-auto">
                      {isDocumentsOpen ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </span>
                  </>
                )}
              </button>
            </li>

            {/* Documents Sub-items */}
            {(isDocumentsOpen || !isSidebarOpen) && (
              <div
                className={`${isSidebarOpen ? "ml-4 border-l-2 border-gray-200 dark:border-slate-600" : ""}`}
              >
                {docsItems.map((item) => (
                  <li key={item.name} className="mb-1">
                    <button
                      onClick={() => setActiveView(item.view)}
                      className={`w-full flex items-center py-2 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                        activeView === item.view
                          ? "bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-gray-200 shadow-sm"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                      } ${!isSidebarOpen ? "justify-center" : ""}`}
                      title={t(item.name)}
                    >
                      <item.icon
                        size={isSidebarOpen ? 16 : 20}
                        className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                      />

                      {isSidebarOpen && (
                        <span className="text-sm font-medium">
                          {t(item.name)}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </div>
            )}
          </ul>
        </div>

        {/* Governance Collapsible Dropdown */}
        <div className="mb-3">
          {isSidebarOpen && (
            <h3 className="px-3 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
              {t("Governance")}
            </h3>
          )}
          <ul>
            {/* Governance Dropdown Toggle */}
            <li className="mb-1">
              <button
                onClick={() => setIsGovernanceOpen(!isGovernanceOpen)}
                className={`w-full flex items-center py-2.5 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                  isGovernanceViewActive
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                } ${!isSidebarOpen ? "justify-center" : ""}`}
                title={t("Governance")}
              >
                <ShieldCheck
                  size={isSidebarOpen ? 18 : 22}
                  className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                />
                {isSidebarOpen && (
                  <>
                    <span className="text-sm font-medium dark:text-slate-200">
                      {t("Governance")}
                    </span>
                    <span className="ml-auto">
                      {isGovernanceOpen ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </span>
                  </>
                )}
              </button>
            </li>

            {/* Governance Sub-items */}
            {(isGovernanceOpen || !isSidebarOpen) && (
              <div
                className={`${isSidebarOpen ? "ml-4 border-l-2 border-gray-200 dark:border-slate-600" : ""}`}
              >
                {governanceItems.map((item) => (
                  <li key={item.name} className="mb-1">
                    <button
                      onClick={() =>
                        !item.comingSoon && setActiveView(item.view)
                      }
                      className={`w-full flex items-center py-2 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                        item.comingSoon
                          ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                          : item.view === "Polls"
                            ? activeView === item.view
                              ? "bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-gray-200 shadow-sm"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                            : activeView === item.view
                              ? "bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-gray-200 shadow-sm"
                              : "text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-600 dark:hover:text-gray-400"
                      } ${!isSidebarOpen ? "justify-center" : ""}`}
                      title={
                        item.comingSoon
                          ? `${t(item.name)} (Coming Soon)`
                          : t(item.name)
                      }
                      disabled={item.comingSoon}
                    >
                      <item.icon
                        size={isSidebarOpen ? 16 : 20}
                        className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                      />
                      {isSidebarOpen && (
                        <span className="text-sm font-medium">
                          {t(item.name)}
                        </span>
                      )}
                      {item.view !== "Polls" && isSidebarOpen && (
                        <span className="ml-auto px-1.5 py-0.5 text-[10px] font-semibold bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded">
                          SOON
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </div>
            )}
          </ul>
        </div>

        {/* Reports Section */}
        <div className="mb-3">
          {isSidebarOpen && (
            <h3 className="px-3 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
              {t("Reports")}
            </h3>
          )}
          <ul>
            {/* Reports Dropdown Toggle */}
            <li className="mb-1">
              <button
                onClick={() => setIsReportsOpen(!isReportsOpen)}
                className={`w-full flex items-center py-2.5 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                  isReportsViewActive
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                } ${!isSidebarOpen ? "justify-center" : ""}`}
                title={t("Reports")}
              >
                {isReportsOpen ? (
                  <FolderOpenDot
                    size={isSidebarOpen ? 18 : 22}
                    className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                  />
                ) : (
                  <FolderClock
                    size={isSidebarOpen ? 18 : 22}
                    className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                  />
                )}
                {isSidebarOpen && (
                  <>
                    <span className="text-sm font-medium dark:text-slate-200">
                      {t("Reports")}
                    </span>
                    <span className="ml-auto">
                      {isReportsOpen ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </span>
                  </>
                )}
              </button>
            </li>

            {/* Reports Sub-items */}
            {(isReportsOpen || !isSidebarOpen) && (
              <div
                className={`${isSidebarOpen ? "ml-4 border-l-2 border-gray-200 dark:border-slate-600" : ""}`}
              >
                {reportsItems.map((item) => (
                  <li key={item.name} className="mb-1">
                    <button
                      onClick={() => setActiveView(item.view)}
                      className={`w-full flex items-center py-2 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                        activeView === item.view
                          ? "bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-gray-200 shadow-sm"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                      } ${!isSidebarOpen ? "justify-center" : ""}`}
                      title={t(item.name)}
                    >
                      <item.icon
                        size={isSidebarOpen ? 16 : 20}
                        className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                      />

                      {isSidebarOpen && (
                        <span className="text-sm font-medium">
                          {t(item.name)}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </div>
            )}
          </ul>
        </div>

        {/* Bottom Nav Items (Profile, Pending Action) */}
        <div className="pt-2 mt-auto border-t border-gray-200 dark:border-slate-700">
          <ul>
            {bottomNavItems.map((item) => {
              // Hide "Pending Action" if user is already verified initially
              if (item.view === "Verification" && initIsVerified) {
                return null;
              }

              return (
                <li key={item.name} className="mb-1">
                  <button
                    onClick={() => setActiveView(item.view)}
                    className={`w-full flex items-center py-2.5 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                      activeView === item.view
                        ? item.view === "Verification" && !isVerified
                          ? "bg-yellow-500 text-slate-800 dark:text-slate-900 italic shadow-md"
                          : "bg-primary text-white shadow-md"
                        : item.view === "Verification" && !isVerified
                          ? "animate-pulse bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-700/50"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                    } ${!isSidebarOpen ? "justify-center" : ""} ${
                      item.view === "Verification" && !isVerified
                        ? "relative"
                        : ""
                    }`}
                    title={t(item.name)}
                  >
                    <item.icon
                      size={isSidebarOpen ? 18 : 22}
                      className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                    />
                    {isSidebarOpen && (
                      <span className="text-sm font-medium">
                        {t(item.name)}
                      </span>
                    )}
                    {item.view === "Integrations" && isSidebarOpen && (
                      <span className="ml-auto px-1.5 py-0.5 text-[10px] font-semibold bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded">
                        SOON
                      </span>
                    )}
                    {item.view === "Verification" && !isVerified && (
                      <span className="absolute w-2 h-2 bg-red-800 rounded-full dark:bg-red-500 top-2 right-2 animate-bounce"></span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </aside>
  );
};

const MobileNav = ({ activeView, setActiveView, isCoopLive = false, testBlankTabEnabled = false }) => {
  const { t } = useLanguage();
  const proposalItem = {
    name: t("Proposals"),
    icon: FileText,
    view: "Proposal",
  };
  return (
    <nav className="sticky z-50 border-b border-gray-200 md:hidden top-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md dark:border-slate-700">
      <div className="px-4 py-2 overflow-x-auto scrollbar-hide">
        <div className="flex items-center space-x-2">
          {[
            ...allNavItems,
            ...docsItems,
            ...membersItems,
            ...ticketsItems,
            proposalItem,
            ...governanceItems,
            ...financeItems,
            ...bottomNavItems,
            ...(testBlankTabEnabled ? [{ name: "Test feature", icon: File, view: "TestBlankTab" }] : []),
          ].map((item) => {
            const isDisabled = item.view === "Filing" && !isCoopLive;
            return (
              <button
                key={item.view}
                onClick={() => !isDisabled && setActiveView(item.view)}
                disabled={isDisabled}
                className={`flex-shrink-0 px-3.5 py-2 rounded-full text-sm font-medium flex items-center space-x-2 transition-all duration-200 ease-in-out transform hover:scale-105 ${
                  isDisabled
                    ? "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-55"
                    : activeView === item.view
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                }`}
                title={
                  isDisabled
                    ? `${t(item.name)} (Only available for live cooperatives)`
                    : t(item.name)
                }
              >
                <item.icon size={16} />
                <span>{t(item.name)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

const CoopSelector = ({ coops, selectedCoop, setSelectedCoop }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  useOutsideClick(dropdownRef, () => setIsOpen(false));
  const currentCoop = coops.find((c) => c.id === selectedCoop);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center p-2 space-x-2 transition-colors bg-gray-100 rounded-lg dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600"
      >
        <img
          src={currentCoop?.logo}
          alt={currentCoop?.name}
          className="w-6 h-6 rounded-md"
        />
        <span className="hidden text-sm font-semibold text-gray-800 dark:text-gray-200 sm:inline">
          {currentCoop?.name}
        </span>
        <ChevronsUpDown
          size={16}
          className="text-gray-500 dark:text-gray-400"
        />
      </button>
      {isOpen && (
        <div
          className="absolute right-0 z-50 w-64 mt-2 bg-white border rounded-lg shadow-xl top-full dark:bg-slate-800 dark:border-slate-700 animate-fadeInUp"
          style={{ animationDuration: "200ms" }}
        >
          <div className="p-2">
            {coops.map((coop) => (
              <button
                key={coop.id}
                onClick={() => {
                  setSelectedCoop(coop.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-3 transition-colors ${
                  selectedCoop === coop.id
                    ? "bg-blue-50 dark:bg-primary-dark-900/50"
                    : "hover:bg-gray-100 dark:hover:bg-slate-700"
                }`}
              >
                <img
                  src={coop.logo}
                  alt={coop.name}
                  className="w-6 h-6 rounded-md"
                />
                <span
                  className={`font-medium text-sm ${
                    selectedCoop === coop.id
                      ? "text-blue-600 dark:text-primary/80"
                      : "text-gray-700 dark:text-gray-200"
                  }`}
                >
                  {coop.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- CONTENT VIEWS (Mostly unchanged, but responsive classes matter) ---

const DashboardOverviewView = ({ coops, selectedCoop }) => {
  const { t } = useLanguage();
  const coop = coops.find((c) => c.id === selectedCoop);
  const [memberCount, setmemberCount] = useState(0);
  const [coopLoading, setCoopLoading] = useState(true);
  const [assemblyInfo, setAssemblyInfo] = useState(null);
  const [docsInfo, setDocsInfo] = useState(null);
  const [governanceInfo, setGovernanceInfo] = useState(null);
  const [complianceInfo, setComplianceInfo] = useState(null);
  const [isCompliancePopUpOpen, setIsCompliancePopUpOpen] = useState(false);
  const stats = [
    {
      title: "Total Members",
      value: memberCount,
      icon: Users2,
      change: `in ${coop?.name}`,
      color: "blue",
      action: {
        name: "Members",
        url: `/dashboard?tab=show-members`,
      },
    },
    {
      title: "Active Docs",
      value: docsInfo || 0,
      icon: FileText,
      change: "in Publications",
      color: "green",
      action: {
        name: "Documents",
        url: `/dashboard?tab=doc-upload`,
      },
    },
    {
      title: "Upcoming Assemblies",
      value: assemblyInfo?.upcomingAssemblyCount || 0,
      icon: Landmark,
      change: `${assemblyInfo?.totalAssemblyCount || 0} total`,
      color: "orange",
      action: {
        name: "Assemblies",
        url: `/dashboard?tab=assembly`,
      },
    },
    {
      title: "Compliance",
      value: complianceInfo
        ? parseInt(complianceInfo?.result?.grade) + "%"
        : "0%",
      icon: ShieldCheck,
      change: complianceInfo ? complianceInfo?.result?.text : "--",
      color: complianceInfo ? complianceInfo?.result?.color : "darked",
      grade: complianceInfo ? complianceInfo?.result?.label : "--",
      action: {
        name: "Compliance",
        onClick: () => setIsCompliancePopUpOpen(true),
      },
    },
  ];

  const colorClasses = {
    blue: "bg-primary",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    teal: "bg-teal-500",
    orange: "bg-orange-500",
    darked: "bg-red-600",
  };

  const themeStyles = {
    blue: {
      iconBg:
        "bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100/50 dark:border-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      badge:
        "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-100/30 dark:border-blue-900/20",
      hoverBorder: "hover:border-purple-300/80 dark:hover:border-purple-800/80",
      barBg: "bg-purple-500/90 dark:bg-purple-500/80",
    },
    green: {
      iconBg:
        "bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-100/50 dark:border-emerald-900/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      badge:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-100/30 dark:border-emerald-900/20",
      hoverBorder:
        "hover:border-emerald-300/80 dark:hover:border-emerald-800/80",
      barBg: "bg-emerald-500/90 dark:bg-emerald-500/80",
    },
    teal: {
      iconBg:
        "bg-teal-50/80 dark:bg-teal-950/30 border border-teal-100/50 dark:border-teal-900/20",
      iconColor: "text-teal-600 dark:text-teal-400",
      badge:
        "bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-100/30 dark:border-teal-900/20",
      hoverBorder: "hover:border-teal-300/80 dark:hover:border-teal-800/80",
      barBg: "bg-teal-500/90 dark:bg-teal-500/80",
    },
    yellow: {
      iconBg:
        "bg-amber-50/80 dark:bg-amber-950/30 border border-amber-100/50 dark:border-amber-900/20",
      iconColor: "text-amber-600 dark:text-amber-400",
      badge:
        "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-100/30 dark:border-amber-900/20",
      hoverBorder: "hover:border-amber-300/80 dark:hover:border-amber-800/80",
      barBg: "bg-amber-500/90 dark:bg-amber-500/80",
    },
    orange: {
      iconBg:
        "bg-orange-50/80 dark:bg-orange-950/30 border border-orange-100/50 dark:border-orange-900/20",
      iconColor: "text-orange-600 dark:text-orange-400",
      badge:
        "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border border-orange-100/30 dark:border-orange-900/20",
      hoverBorder: "hover:border-orange-300/80 dark:hover:border-orange-800/80",
      barBg: "bg-orange-500/90 dark:bg-orange-500/80",
    },
    darkred: {
      iconBg:
        "bg-rose-50/80 dark:bg-rose-950/30 border border-rose-100/50 dark:border-rose-900/20",
      iconColor: "text-rose-600 dark:text-rose-400",
      badge:
        "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-100/30 dark:border-rose-900/20",
      hoverBorder: "hover:border-rose-300/80 dark:hover:border-rose-800/80",
      barBg: "bg-rose-500/90 dark:bg-rose-500/80",
    },
    darked: {
      iconBg:
        "bg-slate-100/85 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50",
      iconColor: "text-slate-600 dark:text-slate-400",
      badge:
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/30 dark:border-slate-700/30",
      hoverBorder: "hover:border-slate-300/80 dark:hover:border-slate-750",
      barBg: "bg-slate-500/90 dark:bg-slate-500/80",
    },
  };

  const popupRef = useClickOutside(() => {
    setIsCompliancePopUpOpen(false);
  }, isCompliancePopUpOpen);

  const fetchInfo = async () => {
    try {
      setCoopLoading(true);
      const currentTime = new Date().toISOString();
      const response = await getMembersOfCoop(selectedCoop);
      const complianceInfo = await getComplianceInfoByCoopId(selectedCoop);
      const pollsCount = await getActivePollsCountByCoopId(
        selectedCoop,
        currentTime,
      );
      setmemberCount(response.length);
      setAssemblyInfo(complianceInfo.assemblyInfo);
      setDocsInfo(complianceInfo.docsCount);
      setGovernanceInfo(complianceInfo.governanceCount);
      setComplianceInfo(complianceInfo);
    } catch (err) {
      console.error("Failed to fetch member info:", err);
    } finally {
      setCoopLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedCoop) {
      setmemberCount(0);
      return;
    }

    fetchInfo();
  }, [selectedCoop]);

  return (
    <div className="relative z-10 p-2 sm:p-2 animate-fadeIn">
      <div className="relative z-20 grid grid-cols-2 gap-2 lg:grid-cols-4 sm:gap-2">
        {stats.map((stat, index) => {
          const theme = themeStyles[stat.color] || themeStyles.darked;
          const isComplianceCard = stat.title === "Compliance";
          return (
            <div
              key={stat.title}
              className={`p-4 transition-all duration-350 ease-in-out transform bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/80 shadow-sm opacity-0 sm:px-4 sm:py-4 rounded-lg hover:shadow-md hover:-translate-y-0.5 animate-fadeInUp flex flex-col justify-between relative ${theme.hoverBorder} ${
                isComplianceCard && isCompliancePopUpOpen ? "z-40" : "z-10"
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {coopLoading ? (
                <OverviewLoader stat={stat} />
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`p-2 sm:p-3 rounded-full ${
                        colorClasses[stat.color]
                      }`}
                    >
                      <stat.icon size={20} sm={24} className="text-white" />
                    </div>
                    <span className="text-2xl font-bold text-gray-800 sm:text-3xl dark:text-white">
                      {stat.grade ? (
                        <span
                          className={`ml-2 px-2 py-1 text-lg font-semibold rounded-lg ${stat.color === "darked" ? "bg-gray-500 text-white" : `bg-${stat.color}-100 text-${stat.color}-700`}`}
                        >
                          {stat.grade ? stat.grade : "--"}
                        </span>
                      ) : (
                        ""
                      )}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                    {t(stat.title)}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-gray-500 sm:text-sm dark:text-gray-400">
                    {stat.title === "Active Docs"
                      ? `${t("in")} ${t("publications")}`
                      : stat.title === "Upcoming Assemblies"
                        ? `${assemblyInfo?.totalAssemblyCount || 0} ${t("total")}`
                        : stat.title === "Total Members"
                          ? `${t("in")} ${coop?.name}`
                          : stat?.change}
                  </div>
                  <div className="flex items-end justify-between mt-2 text-xs text-gray-500 sm:text-sm dark:text-gray-400">
                    <span className="text-2xl font-bold text-gray-800 sm:text-3xl dark:text-white">
                      {stat.value}
                    </span>
                    {stat?.action && complianceInfo?.result?.grade && (
                      <div className="relative inline-block">
                        {stat.action.url ? (
                          <Link
                            href={stat.action.url}
                            className="group inline-flex cursor-pointer items-center px-2 py-0.5 text-xs font-semibold text-blue-500 transition-all hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100/80 dark:hover:bg-blue-900/40 rounded-2xl gap-0.5 duration-300 ease-in-out"
                          >
                            {t("View")} {t(stat.action.name)}
                            <ArrowRight
                              size={12}
                              className="transition-all duration-300 ease-in-out group-hover:translate-x-0.5"
                            />
                          </Link>
                        ) : (
                          <>
                            <button
                              onClick={stat.action.onClick}
                              className="group inline-flex cursor-pointer items-center px-2 py-0.5 text-xs font-semibold text-blue-500 transition-all hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100/80 dark:hover:bg-blue-900/40 rounded-2xl gap-0.5 duration-300 ease-in-out"
                            >
                              {t("View")} {t(stat.action.name)}
                              <ArrowRight
                                size={12}
                                className="transition-all duration-300 ease-in-out group-hover:translate-x-0.5"
                              />
                            </button>
                            {isCompliancePopUpOpen && (
                              <div
                                ref={popupRef}
                                className="absolute right-0 z-10 mt-2 text-left text-gray-700 bg-white border rounded-lg shadow-lg w-[400px] dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700 animate-fadeIn"
                              >
                                {CompliancePopUpInfo(complianceInfo?.details)}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="relative z-10 w-full py-2">
        {coopLoading ? <NotificationLoader /> : <NotificationBox />}
      </div>
    </div>
  );
};

const GovernanceView = ({ selectedCoop }) => {
  return (
    <div className="p-4 sm:p-6 animate-fadeIn">
      <div className="p-6 bg-white shadow-lg dark:bg-slate-800 rounded-xl">
        <p className="text-gray-600 dark:text-gray-400">
          Governance for the selected cooperative would be managed here.
        </p>
      </div>
    </div>
  );
};

const StatusPill = ({ status }) => {
  const styles = {
    Verified:
      "bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300",
    Pending:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300",
    Rejected: "bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300",
  };
  return (
    <span
      className={`px-2.5 py-1 text-xs font-semibold rounded-full ${styles[status]}`}
    >
      {status}
    </span>
  );
};
const TypePill = ({ type }) => {
  const styles = {
    Buy: "bg-tint text-blue-700 dark:bg-primary-dark-700/30 dark:text-blue-300",
    Sell: "bg-purple-100 text-purple-700 dark:bg-purple-700/30 dark:text-purple-300",
  };
  return (
    <span
      className={`px-2.5 py-1 text-xs font-semibold rounded-full inline-flex items-center ${styles[type]}`}
    >
      {type}
    </span>
  );
};

const TransactionDetailModal = ({ transaction, onClose }) => {
  if (!transaction) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md m-4 transform bg-white shadow-2xl dark:bg-slate-800 rounded-xl animate-scaleIn">
        <div className="flex items-center justify-between p-6 border-b dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Transaction Details
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Cooperative
            </span>
            <span className="font-semibold text-gray-800 dark:text-gray-100">
              {transaction.coopName}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Date
            </span>
            <span className="font-semibold text-gray-800 dark:text-gray-100">
              {transaction.date}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Status
            </span>
            <StatusPill status={transaction.verificationStatus} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Type
            </span>
            <TypePill type={transaction.transactionType} />
          </div>
          <div className="my-2 border-t dark:border-slate-700"></div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Shares
            </span>
            <span className="font-semibold text-gray-800 dark:text-gray-100">
              {transaction.shares}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Price
            </span>
            <span className="font-semibold text-gray-800 dark:text-gray-100">
              ${transaction.price.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Purchased For
            </span>
            <span className="font-semibold text-gray-800 capitalize dark:text-gray-100">
              {transaction.buyFor}
            </span>
          </div>
        </div>
        <div className="p-4 text-right bg-gray-50 dark:bg-slate-800/50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border rounded-lg dark:bg-slate-700 dark:text-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const AuditDiscrepancyView = ({ selectedCoop }) => {
  const [discrepancies, setDiscrepancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedCoop) return;
    let isMounted = true;
    const fetchDiscrepancies = async () => {
      try {
        setLoading(true);
        setError(null);
        const list = await getAuditDiscrepancyForCoopAdmin(selectedCoop);
        if (isMounted) {
          setDiscrepancies(list);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load discrepancies:", err);
          setError(err.message || "Failed to load audit discrepancies.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchDiscrepancies();
    return () => {
      isMounted = false;
    };
  }, [selectedCoop]);

  return (
    <div className="p-4 sm:p-6 animate-fadeIn">
      <div className="p-6 bg-white shadow-lg dark:bg-slate-800 rounded-xl">
        <div className="flex flex-col pb-5 border-b sm:flex-row sm:items-center sm:justify-between border-gray-150 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              Audit Discrepancies
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Identify and manage potential compliance risks or financial
              discrepancies detected in your cooperative's data.
            </p>
          </div>
          <span className="inline-flex items-center self-start px-3 py-1 mt-3 text-xs font-semibold text-red-700 bg-red-100 rounded-full sm:mt-0 dark:bg-red-900/30 dark:text-red-400">
            <ShieldAlert size={14} className="mr-1" />
            Discrepancy Monitoring
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Loading discrepancies…
            </p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-4 my-6 text-sm text-red-800 border border-red-200 rounded-xl bg-red-50 dark:bg-red-900/10 dark:border-red-800 dark:text-red-400">
            <AlertTriangle size={20} className="shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        ) : discrepancies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex items-center justify-center w-16 h-16 mb-4 text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-2xl">
              <CheckCheck size={32} />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              All Clear!
            </h3>
            <p className="max-w-md mt-1 text-sm text-slate-500 dark:text-slate-400">
              No unresolved discrepancies or potential compliance threats have
              been detected for this cooperative.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs font-bold tracking-wider uppercase border-b border-gray-150 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                  <th className="pb-3 pr-4">Description</th>
                  <th className="px-4 pb-3">Escalation Type</th>
                  <th className="px-4 pb-3">Detected On</th>
                  <th className="pb-3 pl-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-150 dark:divide-slate-700">
                {discrepancies.map((item) => {
                  const type =
                    item.type === "threat"
                      ? "Androhung Sonderprüfung"
                      : "Fehler";
                  const date = item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString()
                    : new Date(
                        item.$createdAt || Date.now(),
                      ).toLocaleDateString();

                  return (
                    <tr
                      key={item.$id}
                      className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                    >
                      <td className="py-4 pr-4 font-medium align-top text-slate-800 dark:text-slate-200">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {item.title || "Potential Compliance Issue"}
                          </div>
                          {(item.description || item.details) && (
                            <p className="max-w-xl mt-1 text-xs font-normal leading-relaxed text-slate-500 dark:text-slate-400">
                              {item.description || item.details}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 capitalize align-top whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {type}
                      </td>
                      <td className="px-4 py-4 align-top whitespace-nowrap text-slate-600 dark:text-slate-400">
                        {date}
                      </td>
                      <td className="py-4 pl-4 text-right align-top whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
                            item.status === "open"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : item.status === "partially_resolved"
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                : item.status === "resolved"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                          }`}
                        >
                          {item.status === "open"
                            ? "Offen"
                            : item.status === "partially_resolved"
                              ? "Teilweise"
                              : item.status === "resolved"
                                ? "Behoben"
                                : "Nicht bestätigt"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const SettingsView = ({ selectedCoop, coops }) => (
  <CooperativeSettingsView selectedCoop={selectedCoop} coops={coops} />
);

// --- MAIN PAGE COMPONENT ---
export default function AdminPage() {
  const { t } = useLanguage();
  const { activeView, setActiveView } = useRoleDashboardTab(
    ADMIN_TAB_MAP,
    "Overview",
  );
  const [allCoops, setAllCoops] = useState([]);
  const [selectedCoop, setSelectedCoop] = useState(allCoops[0]?.id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user } = useAuth();
  const [initIsVerified, setInitIsVerified] = useState(
    user?.isVerified || false,
  );
  const [isVerified, setIsVerified] = useState(user?.isVerified || false);
  const [assemblyHistory, setAssemblyHistory] = useState([]);
  const [editingAssembly, setEditingAssembly] = useState(null);
  const [testBlankTabEnabled, setTestBlankTabEnabled] = useState(false);

  // Sync verification state when user data loads after login
  useEffect(() => {
    if (user?.isVerified !== undefined) {
      setIsVerified(user.isVerified);
      setInitIsVerified(user.isVerified);
    }
  }, [user?.isVerified]);

  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    handleResize();

    async function getAdminRegisteredCoops() {
      if (!user?.email) return;
      const coops = await getCoopAdmins(user.email);
      setAllCoops(coops);
      if (coops.length > 0) {
        setSelectedCoop(coops[0].id);
      }
    }
    getAdminRegisteredCoops();
    return () => window.removeEventListener("resize", handleResize);
  }, [user?.email]);

  useEffect(() => {
    if (!selectedCoop) {
      setAssemblyHistory([]);
      return;
    }

    const loadAssemblies = async () => {
      try {
        const assemblies = await getAssembliesByCoopId(selectedCoop);
        setAssemblyHistory(assemblies);
      } catch {
        setAssemblyHistory([]);
      }
    };

    loadAssemblies();
  }, [selectedCoop]);

  useEffect(() => {
    if (!selectedCoop) {
      setTestBlankTabEnabled(false);
      return;
    }

    let cancelled = false;
    fetch(`/api/features?coopId=${encodeURIComponent(selectedCoop)}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((payload) => {
        if (!cancelled) setTestBlankTabEnabled(payload?.features?.test_blank_tab === true);
      })
      .catch(() => {
        if (!cancelled) setTestBlankTabEnabled(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCoop]);

  useEffect(() => {
    if (!testBlankTabEnabled && activeView === "TestBlankTab") {
      setActiveView("Overview");
    }
  }, [activeView, setActiveView, testBlankTabEnabled]);
  const viewTitles = {
    Overview: "Overview",
    Noticeboard: "Notice Board",
    Transactions: "Transactions",
    Payouts: "Payouts",
    Audit: "Audit Log",
    Governance: "Governance",
    Settings: "Settings",
    Assembly: "All Assemblies",
    assemblyPolls: "All Assemblies",
    CreateAssembly: "Create Assembly",
    Polls: "Polls Dashboard",
    Verification: "Account Verification",
    FinancialAnalysis: "Financial Analysis",
    Invoices: "Invoices",
    DatevExport: "DATEV Export",
    Integrations: "Integrations",
    ESignature: "eSignature",
    Calendar: "Calendar",
    Upload: "Upload",
    Share: "Share",
    Proposal: "Proposals",
    OnboardingAdmins: "Admin Onboarding",
    OnboardingMembers: "Member Onboarding",
    Filing: "Filing",
    History: "History",
    Discrepancy: "Audit Discrepancies",
    TestBlankTab: "Test feature",
  };

  const renderView = () => {
    const props = { selectedCoop, coops: allCoops };
    const saveAssemblyToHistory = (assembly) => {
      setAssemblyHistory((prev) => [
        assembly,
        ...prev.filter((item) => item.id !== assembly.id),
      ]);
      if (assembly.status !== "draft") {
        setActiveView("assemblyPolls");
      }
    };
    const updateAssemblyInHistory = (updatedAssembly) => {
      setAssemblyHistory((prev) =>
        prev.map((item) =>
          item.id === updatedAssembly.id ? updatedAssembly : item,
        ),
      );
    };

    const discardAssemblyFromHistory = async (assembly) => {
      try {
        const updated = await updateAssemblyStatus(assembly.id, "discarded");
        updateAssemblyInHistory(updated);
        toast.success("Draft assembly discarded successfully.");
      } catch (err) {
        console.error("Failed to discard assembly:", err);
        toast.error("Failed to discard assembly.");
      }
    };

    switch (activeView) {
      case "Overview":
        return <DashboardOverviewView {...props} />;
      case "Noticeboard":
        return <NoticeboardView selectedCoop={selectedCoop} coops={allCoops} />;
      case "Transactions":
        return <TransactionsView {...props} />;
      case "Payouts":
        return <PayoutsView {...props} />;
      case "Filing":
        return <AuditView {...props} />;
      case "History":
        return <AuditHistoryView {...props} />;
      case "ShareRegisterReport":
        return <ShareRegisterReport {...props} />;
      case "CapitalSummaryReport":
        return <CapitalSummaryReport {...props} />;
      case "Discrepancy":
        return <AuditDiscrepancyView {...props} />;
      case "Governance":
        return <GovernanceView {...props} />;
      case "Settings":
        return <SettingsView {...props} />;
      case "DocUpload":
        return <CoopDocsUploader coopId={selectedCoop} userId={user.$id} />;
      case "DocShare":
        return <DocShare coopId={selectedCoop} userId={user.$id} />;
      case "ShowMembers":
        return <MemberDirectoryView {...props} />;
      case "Proposal":
        return <ProposalView {...props} />;
      case "FormerMembers":
        return <FormerMembersView selectedCoop={selectedCoop} />;
      case "CreateGroup":
        return <CreateGroup coopId={selectedCoop} userId={user.$id} />;
      case "Verification":
        return <VerificationPage user={user} setIsVerified={setIsVerified} />;
      case "assemblyPolls":
        return (
          <AssemblyDashboardView
            assemblies={assemblyHistory.filter(
              (assembly) => assembly.coopId === selectedCoop,
            )}
            onCreateAssembly={() => setActiveView("CreateAssembly")}
            onAssemblyUpdate={updateAssemblyInHistory}
            onEditAssembly={(assembly) => {
              setEditingAssembly(assembly);
              setActiveView("CreateAssembly");
            }}
            onDiscardAssembly={discardAssemblyFromHistory}
            selectedCoop={selectedCoop}
          />
        );
      // case "assemblyPolls":
      //   return <PollsView selectedCoop={selectedCoop} />;
      // case "Assembly":
      //   return (
      //     <AssemblyDashboardView
      //       assemblies={assemblyHistory.filter(
      //         (assembly) => assembly.coopId === selectedCoop,
      //       )}
      //       onCreateAssembly={() => setActiveView("CreateAssembly")}
      //     />
      //   );
      case "CreateAssembly":
        return (
          <CreateAssemblyView
            {...props}
            initialAssembly={editingAssembly}
            onAssemblySave={(assembly) => {
              saveAssemblyToHistory(assembly);
              setEditingAssembly(null);
            }}
            onCancel={() => {
              setActiveView("assemblyPolls");
              setEditingAssembly(null);
            }}
          />
        );
      case "Niederschrift":
        return <NiederschriftPage selectedCoop={selectedCoop} />;
      case "Mails":
        return (
          <div className="py-2 pr-2">
            <MailDashboard selectedCoopId={selectedCoop} />
          </div>
        );
      case "Profile":
        return (
          <div className="p-1 mx-auto">
            <ProfilePage />
          </div>
        );
      case "FinancialAnalysis":
        return <FinancialAnalysisDashboard />;
      case "Invoices":
        return <InvoicesDashboard />;
      case "DatevExport":
        return (
          <DatevExportDashboard selectedCoop={selectedCoop} coops={allCoops} />
        );
      case "Integrations":
        return <IntegrationsDashboard />;
      case "ESignature":
        return <ESignatureDashboard />;
      case "Calendar":
        return <CalendarDashboard />;
      case "OnboardingAdmins":
        return <AdminOnboardingView {...props} />;
      case "OnboardingMembers":
        return <MemberOnboardingView {...props} />;
      case "Subscriptions":
        return <SubscriptionPage coopId={selectedCoop} {...props} />;
      case "TestBlankTab":
        return <div className="min-h-[calc(100vh-8rem)] bg-white dark:bg-slate-900" aria-label="Test feature blank page" />;
      default:
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold">{activeView}</h2>
          </div>
        );
    }
  };

  const currentCoop = allCoops.find((c) => c.id === selectedCoop);
  const isCoopLive = currentCoop?.isLive ?? false;

  return (
    <div className="flex min-h-screen font-sans text-gray-900 bg-gray-100 dark:bg-slate-900 dark:text-gray-200">
      <style>{`
            :root { --header-height: 4rem; --nav-height: 3.5rem; }
            .scrollbar-hide::-webkit-scrollbar { display: none; }
            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            .animate-fadeIn { animation: fadeIn 0.5s ease-in-out forwards; }
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            .animate-fadeInUp { animation: fadeInUp 0.5s ease-in-out forwards; }
            @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            .animate-scaleIn { animation: scaleIn 0.3s ease-out forwards; }
        `}</style>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          initIsVerified={initIsVerified}
          isVerified={isVerified}
          isCoopLive={isCoopLive}
          testBlankTabEnabled={testBlankTabEnabled}
        />
      </div>

      <main
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "md:ml-64" : "md:ml-20"
        }`}
      >
        <header className="sticky top-0 z-40 flex-shrink-0 border-b border-gray-200 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md dark:border-slate-700">
          <div className="flex items-center justify-between h-16 p-4">
            <div className="flex items-center">
              <img
                src={allCoops.find((c) => c.id === selectedCoop)?.logo}
                alt="coop logo"
                className="w-8 h-8 mr-3 rounded-lg md:hidden"
              />
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
                {t(viewTitles[activeView])}
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <CoopSelector
                coops={allCoops}
                selectedCoop={selectedCoop}
                setSelectedCoop={setSelectedCoop}
              />
              <img
                src={`https://placehold.co/32x32/A5B4FC/312E81?text=${user?.name ? user.name.charAt(0) : "U"}`}
                alt="Admin Avatar"
                className="hidden w-8 h-8 rounded-full sm:block"
              />
            </div>
          </div>
        </header>

        {/* Mobile Navigation Ribbon */}
        <MobileNav
          activeView={activeView}
          setActiveView={setActiveView}
          isCoopLive={isCoopLive}
          testBlankTabEnabled={testBlankTabEnabled}
        />

        <div className="flex-1 overflow-y-auto">{renderView()}</div>
      </main>
    </div>
  );
}
