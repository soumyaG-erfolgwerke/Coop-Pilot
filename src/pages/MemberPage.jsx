"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Radio,
  Users,
  Bell,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  CheckCircle,
  Mail,
  Receipt,
  RefreshCcw,
  Wallet,
  Download,
  Folder,
  Share,
  Share2,
  UserMinus,
  UserPlus,
  Megaphone,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

import MembersView from "../components/memberPage/MembersView";
import OverviewView from "../components/memberPage/OverviewView";
import SharesView from "../components/memberPage/SharesView";
import AssemblyView from "../components/memberPage/AssemblyView";
import TransactionsView from "../components/memberPage/TransactionsView";
import NotificationBox from "../components/NotificationBox";
import MemberDocs from "../components/memberPage/MemberDocs";
import ResubmitKycView from "../components/memberPage/ResubmitKycView";
import ProposalsView from "../components/memberPage/ProposalsView";
import KundigungView from "../components/memberPage/KundigungView";
import OnboardingView from "../components/memberPage/OnboardingView";

import MailDashboard from "@/components/mail/MailDashboard";
import { getCoopsOfMembers } from "../lib/transactionService";
import MemberProfileView from "./MemberProfilePage";
import DataExportPage from "@/components/memberPage/DataExportPage";
import { useRoleDashboardTab } from "@/hooks/useRoleDashboardTab";
import SharedDocs from "@/components/memberPage/SharedDocs";
import NoticeboardView from "../components/memberPage/NoticeboardView";

// Sidebar nav items
const navItems = [
  { name: "Overview", icon: LayoutDashboard, view: "Overview" },
  { name: "Notice Board", icon: Megaphone, view: "Noticeboard" },
  { name: "My Shares", icon: Wallet, view: "Shares" },
  { name: "Assembly", icon: Radio, view: "Assembly" },
  { name: "Members", icon: Users, view: "Members" },
  { name: "Notifications", icon: Bell, view: "Notifications" },
  { name: "Mails", icon: Mail, view: "Email" },
  { name: "Profile", icon: Users, view: "Profile" }
];

const shareSubscriptionItems = [
  { name: "Transactions", icon: Receipt, view: "Transactions" },
  { name: "Proposals", icon: FileText, view: "Proposals" },
  { name: "Kündigung", icon: UserMinus, view: "Kündigung" }
];

const managementItems = [
  { name: "KYC Resubmission", icon: RefreshCcw, view: "ResubmitKYC" },
  { name: "Data Export", icon: Download, view: "Export" },
  { name: "Onboarding", icon: UserPlus, view: "Onboarding" }
];

const MEMBER_TAB_MAP = {
  overview: "Overview",
  noticeboard: "Noticeboard",
  transactions: "Transactions",
  proposals: "Proposals",
  kundigung: "Kündigung",
  shares: "Shares",
  assembly: "Assembly",
  members: "Members",
  notifications: "Notifications",
  documents: "Documents",
  email: "Email",
  profile: "Profile",
  "resubmit-kyc": "ResubmitKYC",
  export: "Export",
  onboarding: "Onboarding",
  repository: "Repository",
  shared: "Shared",
};
const documentsItems = [
  { name: "Repository", icon: Folder, view: "Repository" },
  { name: "Shared with me", icon: Share2, view: "Shared" }
];

// Sidebar
const MemberSidebar = ({
  activeView,
  setActiveView,
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const { t } = useLanguage();
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [isDocumentOpen, setIsDocumentOpen] = useState(false);
  const [isShareSubscriptionOpen, setIsShareSubscriptionOpen] = useState(false);

  const isManagementViewActive = managementItems.some(item => item.view === activeView);
  const isDocumentViewActive = documentsItems.some(item => item.view === activeView);
  const isShareSubscriptionActive = shareSubscriptionItems.some(item => item.view === activeView);

  useEffect(() => {
    if (isShareSubscriptionActive) {
      setIsShareSubscriptionOpen(true);
    }
  }, [isShareSubscriptionActive]);

  useEffect(() => {
    if (isDocumentViewActive) {
      setIsDocumentOpen(true);
    }
  }, [isDocumentViewActive]);

  useEffect(() => {
    if (isManagementViewActive) {
      setIsManagementOpen(true);
    }
  }, [isManagementViewActive]);

  return (
  <aside
    className={`fixed inset-y-0 left-0 z-30 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transition-all duration-300 ease-in-out ${isSidebarOpen ? "w-64" : "w-20"
      } overflow-y-auto`}
  >
    {/* Hide scrollbar (Chrome, Firefox, Edge) */}
    <style>{`
      aside::-webkit-scrollbar { display: none; }
      aside { scrollbar-width: none; -ms-overflow-style: none; }
    `}</style>

    {/* Logo + Toggle */}
    <div className="sticky top-0 z-10 flex items-center justify-between h-16 p-4 bg-white dark:bg-slate-800">
      {isSidebarOpen && (
        <div className="flex items-center">
          <img
            src="https://placehold.co/32x32/3B82F6/FFFFFF?text=DC"
            alt="Co-op Logo"
            className="w-8 h-8 mr-2 rounded-md"
          />
          <span className="text-xl font-bold text-gray-800 dark:text-white">
            DigiCoope
          </span>
        </div>
      )}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="p-2 text-gray-600 rounded-md dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
      >
        {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>
    </div>

    {/* Navigation */}
    <nav className="px-2 pb-4 mt-4">
      <ul className="mb-4">
        {navItems.slice(0, 1).map((item) => {
          return (
          <li key={item.name} className="mb-1.5">
            <button
              onClick={() => setActiveView(item.view)}
              className={`w-full flex items-center py-2.5 px-3 rounded-lg transition-colors duration-150 ease-in-out
                ${activeView === item.view
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                }
                ${!isSidebarOpen ? "justify-center" : ""}`}
              title={t(item.name)}
            >
              <item.icon
                size={isSidebarOpen ? 20 : 24}
                className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
              />
              {isSidebarOpen && (
                <span className="text-sm font-medium">{t(item.name)}</span>
              )}
            </button>
          </li>
          );
        })}
      </ul>

      {/* Share Subscription Collapsible Dropdown */}
      <div className="mb-3">
        <ul>
          {/* Share Subscription Dropdown Toggle */}
          <li className="mb-1">
            <button
              onClick={() => setIsShareSubscriptionOpen(!isShareSubscriptionOpen)}
              className={`w-full flex items-center py-2.5 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                isShareSubscriptionActive
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              } ${!isSidebarOpen ? "justify-center" : ""}`}
              title={t("Share subscription")}
            >
              <Share
                size={isSidebarOpen ? 18 : 22}
                className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
              />
              {isSidebarOpen && (
                <>
                  <span className="text-sm font-medium dark:text-slate-200">{t("Share subscription")}</span>
                  <span className="ml-auto">
                    {isShareSubscriptionOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </>
              )}
            </button>
          </li>

          {/* Share Subscription Sub-items */}
          {(isShareSubscriptionOpen || !isSidebarOpen) && (
            <div className={`${isSidebarOpen ? "ml-4 border-l-2 border-gray-200 dark:border-slate-600" : ""}`}>
              {shareSubscriptionItems.map((item) => (
                <li key={item.name} className="mb-1">
                  <button
                    onClick={() => setActiveView(item.view)}
                    className={`w-full flex items-center py-2 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                      activeView === item.view
                        ? "bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-gray-200 shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-700 dark:hover:text-gray-300"
                    } ${!isSidebarOpen ? "justify-center" : ""}`}
                    title={t(item.name)}
                  >
                    <item.icon
                      size={isSidebarOpen ? 16 : 20}
                      className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                    />
                    {isSidebarOpen && (
                      <span className="text-sm font-medium">{t(item.name)}</span>
                    )}
                  </button>
                </li>
              ))}
            </div>
          )}
        </ul>
      </div>

      <ul className="mb-4">
        {navItems.slice(1).map((item) => {
          return (
          <li key={item.name} className="mb-1.5">
            <button
              onClick={() => setActiveView(item.view)}
              className={`w-full flex items-center py-2.5 px-3 rounded-lg transition-colors duration-150 ease-in-out
                ${activeView === item.view
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                }
                ${!isSidebarOpen ? "justify-center" : ""}`}
              title={t(item.name)}
            >
              <item.icon
                size={isSidebarOpen ? 20 : 24}
                className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
              />
              {isSidebarOpen && (
                <span className="text-sm font-medium">{t(item.name)}</span>
              )}
            </button>
          </li>
          );
        })}
      </ul>

      {/* document Collapsible Dropdown */}
      <div className="mb-3">
        <ul>
          {/* documet Dropdown Toggle */}
          <li className="mb-1">
            <button
              onClick={() => setIsDocumentOpen(!isDocumentOpen)}
              className={`w-full flex items-center py-2.5 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                isDocumentViewActive
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              } ${!isSidebarOpen ? "justify-center" : ""}`}
              title={t("Documents")}
            >
              <Folder
                size={isSidebarOpen ? 18 : 22}
                className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
              />
              {isSidebarOpen && (
                <>
                  <span className="text-sm font-medium dark:text-slate-200">{t("Documents")}</span>
                  <span className="ml-auto">
                    {isDocumentOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </>
              )}
            </button>
          </li>

          {/* document Sub-items */}
          {(isDocumentOpen || !isSidebarOpen) && (
            <div className={`${isSidebarOpen ? "ml-4 border-l-2 border-gray-200 dark:border-slate-600" : ""}`}>
              {documentsItems.map((item) => (
                <li key={item.name} className="mb-1">
                  <button
                    onClick={() => setActiveView(item.view)}
                    className={`w-full flex items-center py-2 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                      activeView === item.view
                        ? "bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-gray-200 shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-700 dark:hover:text-gray-300"
                    } ${!isSidebarOpen ? "justify-center" : ""}`}
                    title={t(item.name)}
                  >
                    <item.icon
                      size={isSidebarOpen ? 16 : 20}
                      className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                    />
                    {isSidebarOpen && (
                      <span className="text-sm font-medium">{t(item.name)}</span>
                    )}
                  </button>
                </li>
              ))}
            </div>
          )}
        </ul>
      </div>




      {/* Management Collapsible Dropdown */}
      <div className="mb-3">
        <ul>
          {/* Management Dropdown Toggle */}
          <li className="mb-1">
            <button
              onClick={() => setIsManagementOpen(!isManagementOpen)}
              className={`w-full flex items-center py-2.5 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                isManagementViewActive
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              } ${!isSidebarOpen ? "justify-center" : ""}`}
              title={t("Management")}
            >
              <ShieldCheck
                size={isSidebarOpen ? 18 : 22}
                className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
              />
              {isSidebarOpen && (
                <>
                  <span className="text-sm font-medium dark:text-slate-200">{t("Management")}</span>
                  <span className="ml-auto">
                    {isManagementOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </>
              )}
            </button>
          </li>

          {/* Management Sub-items */}
          {(isManagementOpen || !isSidebarOpen) && (
            <div className={`${isSidebarOpen ? "ml-4 border-l-2 border-gray-200 dark:border-slate-600" : ""}`}>
              {managementItems.map((item) => (
                <li key={item.name} className="mb-1">
                  <button
                    onClick={() => setActiveView(item.view)}
                    className={`w-full flex items-center py-2 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                      activeView === item.view
                        ? "bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-gray-200 shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-700 dark:hover:text-gray-300"
                    } ${!isSidebarOpen ? "justify-center" : ""}`}
                    title={t(item.name)}
                  >
                    <item.icon
                      size={isSidebarOpen ? 16 : 20}
                      className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                    />
                    {isSidebarOpen && (
                      <span className="text-sm font-medium">{t(item.name)}</span>
                    )}
                  </button>
                </li>
              ))}
            </div>
          )}
        </ul>
      </div>
    </nav>
  </aside>
  );
};

// Mobile Horizontal Nav
const MobileHorizontalNav = ({ activeView, setActiveView }) => {
  const { t } = useLanguage();
  const scrollRef = useRef(null);

  return (
    <nav className="fixed left-0 right-0 z-20 border-b border-gray-200 md:hidden top-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md dark:border-slate-700">
      <div
        ref={scrollRef}
        className="flex items-center p-2 space-x-2 overflow-x-auto scrollbar-hide"
      >
        {[...navItems, ...shareSubscriptionItems, ...documentsItems, ...managementItems].map((item) => (
          <button
            key={item.view}
            onClick={() => setActiveView(item.view)}
            className={`relative flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200
              ${activeView === item.view
                ? "text-white"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
              }`}
          >
            {activeView === item.view && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-blue-600 rounded-full"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center">
              <item.icon size={16} className="mr-1.5" />
              {t(item.name)}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

// Main Component
function MemberPage() {
  const { t } = useLanguage();
  const { activeView, setActiveView } = useRoleDashboardTab(MEMBER_TAB_MAP, "Overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [coops, setCoops] = useState([]);
  const [selectedCoop, setSelectedCoop] = useState("");
  const { user } = useAuth();
  const [loadingCoops, setLoadingCoops] = useState(true);

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch coops
  useEffect(() => {
    if (!user?.userId) return;

    const fetchCoops = async () => {
      try {
        setLoadingCoops(true)
        const result = await getCoopsOfMembers(user.userId);
        setCoops(result);
        // if (result.length > 0) {
        //   setSelectedCoop(result[0].coopId);
        // }
      } catch (err) {
        console.error("Failed to fetch coops:", err);
      } finally {
        setLoadingCoops(false)
      }
    };

    fetchCoops();
  }, [user?.userId]);

  const filteredCoops = selectedCoop
    ? coops.filter((c) => c.coopId === selectedCoop)
    : coops;

  if (loadingCoops) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 rounded-full border-b-primary border-l-transparent border-r-transparent animate-spin"></div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
          {t("Loading...")}
        </p>
      </div>
    );
  }


  // Views
  const renderView = () => {
    switch (activeView) {
      case "Overview":
        return <OverviewView memberId={user?.userId} coopId={selectedCoop} />;
      case "Noticeboard":
        return <NoticeboardView selectedCoop={selectedCoop} coops={coops} />;
      case "Shares":
        return <SharesView coops={filteredCoops} />;
      case "Transactions":
        return <TransactionsView coopId={selectedCoop} />;
      case "Assembly":
        return <AssemblyView coops={filteredCoops} />;
      case "Proposals":
        return <ProposalsView selectedCoop={selectedCoop} coops={coops} />;
      case "Kündigung":
        return <KundigungView userId={user?.userId} />;
      case "Members":
        return <MembersView coopId={selectedCoop} />;
      case "Notifications":
        return (
          <div className="p-1">
            <NotificationBox />
          </div>
        );
      case "Repository":
        return <MemberDocs userId={user?.userId} coops={filteredCoops} />;
      case "Shared":
        return <SharedDocs userId={user?.userId} coops={filteredCoops} />;
      case "Email":
        return <MailDashboard />;
      case "Profile":
        return <MemberProfileView coops={filteredCoops} />;
      case "ResubmitKYC":
        const activeCoopId = selectedCoop || coops[0]?.coopId || "";
        return <ResubmitKycView coopId={activeCoopId} />;
      case "Export":
        return <DataExportPage/>;
      case "Onboarding":
        return <OnboardingView />;
      default:
        return <OverviewView memberId={user?.userId} coopId={selectedCoop} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-slate-900 font-inter">

      {/* Sidebar */}
      <div className="hidden md:block">
        <MemberSidebar
          activeView={activeView}
          setActiveView={setActiveView}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
      </div>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarOpen ? "md:ml-64" : "md:ml-20"
          }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-20 h-auto p-4 border-b border-gray-200 shadow-sm bg-white/80 dark:bg-slate-800/80 backdrop-blur-md md:h-24 dark:border-slate-700">
          <div className="flex flex-col items-start justify-between md:flex-row md:items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-800 md:text-2xl dark:text-white">
                {t("Good evening")}, {user?.name || t("User")}!
              </h1>
              <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                {user?.isVerified && (
                  <CheckCircle size={14} className="text-green-500 mr-1.5" />
                )}
                <span>
                  • {t("ID")}: {user?.userId} • {user?.email}
                </span>
              </div>
            </div>

            {/* Coop Selector */}
            <div className="mt-3 md:mt-0">
              {coops.length > 0 ? (
                <select
                  value={selectedCoop || ""}
                  onChange={(e) => setSelectedCoop(e.target.value)}
                  className="px-3 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg dark:border-slate-600 dark:text-gray-200 dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600"
                >
                  <option value="None">{t("---Select Cooperative---")}</option>
                  <option value="">{t("All Cooperatives")}</option>
                  {coops.map((c) => (
                    <option key={c.coopId} value={c.coopId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("No coops found")}
                </p>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Navigation */}
        <MobileHorizontalNav
          activeView={activeView}
          setActiveView={setActiveView}
          user={user}
        />

        {/* Content */}
        <div className="md:mt-0">{renderView()}</div>
      </main>
    </div>
  );
}

export default MemberPage;
