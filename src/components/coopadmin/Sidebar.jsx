"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ShieldAlert,
  DollarSign,
  FileText,
  BarChart2,
  UserCog,
  SquareUserRound,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  PenTool,
  TrendingUp,
  Receipt,
  Download,
  Mail,
  History,
  Plug,
  ChevronUp,
  ChevronDown,
  Wallet,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";

// --- NAVIGATION ITEMS ---
export const onboardingItems = [
  { name: "Admin", icon: ShieldCheck, view: "OnboardingAdmins" },
  { name: "Member", icon: Users, view: "OnboardingMembers" },
];
export const navItems = {
  Dashboard: [{ name: "Overview", icon: LayoutDashboard, view: "Overview" }],
  Management: [
    { name: "Members", icon: Users, view: "MemberDirectory" },
    { name: "Transactions", icon: DollarSign, view: "Transactions" },
    { name: "Audit", icon: History, view: "Audit" },
    { name: "Documents", icon: FileText, view: "Documents" },
    { name: "Mails", icon: Mail, view: "Mails" },
  ],
};

// Governance dropdown items
export const governanceItems = [
  { name: "Polls", icon: BarChart2, view: "Polls", comingSoon: false },
  { name: "eSignature", icon: PenTool, view: "ESignature", comingSoon: false },
  { name: "Calendar", icon: CalendarDays, view: "Calendar", comingSoon: false },
];

// Finance dropdown items
export const financeItems = [
  { name: "Financial Analysis", icon: TrendingUp, view: "FinancialAnalysis", comingSoon: false },
  { name: "Invoices", icon: Receipt, view: "Invoices", comingSoon: false },
  { name: "DATEV Export", icon: Download, view: "DatevExport", comingSoon: false },
];

// Bottom nav items
export const bottomNavItems = [
  { name: "Integrations", icon: Plug, view: "Integrations" },
  { name: "Pending Action", icon: ShieldAlert, view: "Verification" },
  { name: "Profile", icon: UserCog, view: "Profile" },
];

export const Sidebar = ({
  activeView,
  setActiveView,
  isSidebarOpen,
  setIsSidebarOpen,
  initIsVerified,
  isVerified,
}) => {
  const { user } = useAuth();
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);
  const [isGovernanceOpen, setIsGovernanceOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  
  const isFinanceViewActive = financeItems.some(item => item.view === activeView);
  const isGovernanceViewActive = governanceItems.some(item => item.view === activeView);
  const isOnboardingViewActive = ["OnboardingAdmins", "OnboardingMembers"].includes(activeView);
  
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
              {user?.name || 'User'}
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
              Dashboard
            </h3>
          )}
          <ul>
            <li className="mb-1">
              <button
                onClick={() => setActiveView && setActiveView("Overview")}
                className={`w-full flex items-center py-2.5 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                  activeView === "Overview"
                    ? "bg-primary text-white shadow-md"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                } ${!isSidebarOpen ? "justify-center" : ""}`}
                title="Overview"
              >
                <LayoutDashboard
                  size={isSidebarOpen ? 18 : 22}
                  className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                />
                {isSidebarOpen && (
                  <span className="text-sm font-medium">Overview</span>
                )}
              </button>
            </li>
          </ul>
        </div>

        {/* Onboarding Collapsible Dropdown */}
        <div className="mb-3">
          {isSidebarOpen && (
            <h3 className="px-3 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
              Onboarding
            </h3>
          )}
          <ul>
            <li className="mb-1">
              <button
                onClick={() => setIsOnboardingOpen(!isOnboardingOpen)}
                className={`w-full flex items-center py-2.5 px-3 rounded-md transition-colors duration-150 ease-in-out ${isOnboardingViewActive
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                  } ${!isSidebarOpen ? "justify-center" : ""}`}
                title="Onboarding"
              >
                <UserPlus
                  size={isSidebarOpen ? 18 : 22}
                  className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                />
                {isSidebarOpen && (
                  <>
                    <span className="text-sm font-medium dark:text-slate-200">
                      Onboarding
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
                      onClick={() => setActiveView && setActiveView(item.view)}
                      className={`w-full flex items-center py-2 px-3 rounded-md transition-colors duration-150 ease-in-out ${activeView === item.view
                          ? "bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-gray-200 shadow-sm"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                        } ${!isSidebarOpen ? "justify-center" : ""}`}
                      title={item.name}
                    >
                      <item.icon
                        size={isSidebarOpen ? 16 : 20}
                        className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                      />
                      {isSidebarOpen && (
                        <span className="text-sm font-medium">{item.name}</span>
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
              Management
            </h3>
          )}
          <ul>
            {navItems.Management.map((item) => (
              <li key={item.name} className="mb-1">
                <button
                  onClick={() => setActiveView && setActiveView(item.view)}
                  className={`w-full flex items-center py-2.5 px-3 rounded-md transition-colors duration-150 ease-in-out ${activeView === item.view
                      ? "bg-primary text-white shadow-md"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                    } ${!isSidebarOpen ? "justify-center" : ""}`}
                  title={item.name}
                >
                  <item.icon
                    size={isSidebarOpen ? 18 : 22}
                    className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                  />
                  {isSidebarOpen && (
                    <span className="text-sm font-medium">{item.name}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-3">
          {isSidebarOpen && (
            <h3 className="px-3 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
              Governance
            </h3>
          )}
          <ul>
            <li className="mb-1">
              <button
                onClick={() => setIsGovernanceOpen(!isGovernanceOpen)}
                className={`w-full flex items-center py-2.5 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                  isGovernanceViewActive
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                } ${!isSidebarOpen ? "justify-center" : ""}`}
                title="Governance"
              >
                <ShieldCheck
                  size={isSidebarOpen ? 18 : 22}
                  className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                />
                {isSidebarOpen && (
                  <>
                    <span className="text-sm font-medium dark:text-slate-200">Governance</span>
                    <span className="ml-auto">
                      {isGovernanceOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </>
                )}
              </button>
            </li>

            {(isGovernanceOpen || !isSidebarOpen) && (
              <div className={`${isSidebarOpen ? "ml-4 border-l-2 border-gray-200 dark:border-slate-600" : ""}`}>
                {governanceItems.map((item) => (
                  <li key={item.name} className="mb-1">
                    <button
                      onClick={() => !item.comingSoon && setActiveView && setActiveView(item.view)}
                      className={`w-full flex items-center py-2 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                        item.comingSoon
                          ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                          : activeView === item.view
                          ? "bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-gray-200 shadow-sm"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                      } ${!isSidebarOpen ? "justify-center" : ""}`}
                      title={item.comingSoon ? `${item.name} (Coming Soon)` : item.name}
                      disabled={item.comingSoon}
                    >
                      <item.icon
                        size={isSidebarOpen ? 16 : 20}
                        className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                      />
                      {isSidebarOpen && (
                        <span className="text-sm font-medium">{item.name}</span>
                      )}
                    </button>
                  </li>
                ))}
              </div>
            )}
          </ul>
        </div>

        <div className="mb-3">
          {isSidebarOpen && (
            <h3 className="px-3 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
              Finance
            </h3>
          )}
          <ul>
            <li className="mb-1">
              <button
                onClick={() => setIsFinanceOpen(!isFinanceOpen)}
                className={`w-full flex items-center py-2.5 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                  isFinanceViewActive
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                } ${!isSidebarOpen ? "justify-center" : ""}`}
                title="Finance"
              >
                <Wallet
                  size={isSidebarOpen ? 18 : 22}
                  className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                />
                {isSidebarOpen && (
                  <>
                    <span className="text-sm font-medium dark:text-slate-200">Finance</span>
                    <span className="ml-auto">
                      {isFinanceOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </>
                )}
              </button>
            </li>

            {(isFinanceOpen || !isSidebarOpen) && (
              <div className={`${isSidebarOpen ? "ml-4 border-l-2 border-gray-200 dark:border-slate-600" : ""}`}>
                {financeItems.map((item) => (
                  <li key={item.name} className="mb-1">
                    <button
                      onClick={() => !item.comingSoon && setActiveView && setActiveView(item.view)}
                      className={`w-full flex items-center py-2 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                        item.comingSoon
                          ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                          : activeView === item.view
                          ? "bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-gray-200 shadow-sm"
                          : "text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700"
                      } ${!isSidebarOpen ? "justify-center" : ""}`}
                      title={item.comingSoon ? `${item.name} (Coming Soon)` : item.name}
                      disabled={item.comingSoon}
                    >
                      <item.icon
                        size={isSidebarOpen ? 16 : 20}
                        className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                      />
                      {isSidebarOpen && (
                        <span className="text-sm font-medium">{item.name}</span>
                      )}
                    </button>
                  </li>
                ))}
              </div>
            )}
          </ul>
        </div>

        <div className="pt-2 mt-auto border-t border-gray-200 dark:border-slate-700">
          <ul>
            {bottomNavItems.map((item) => {
              if (item.view === "Verification" && initIsVerified) {
                return null;
              }

              return (
                <li key={item.name} className="mb-1">
                  <button
                    onClick={() => setActiveView && setActiveView(item.view)}
                    className={`w-full flex items-center py-2.5 px-3 rounded-md transition-colors duration-150 ease-in-out ${
                      activeView === item.view
                        ? item.view === "Verification" && !isVerified
                          ? "bg-yellow-500 text-slate-800 dark:text-slate-900 italic shadow-md"
                          : "bg-primary text-white shadow-md"
                        : item.view === "Verification" && !isVerified
                        ? "animate-pulse bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-700/50"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                    } ${!isSidebarOpen ? "justify-center" : ""} ${
                      item.view === "Verification" && !isVerified ? "relative" : ""
                    }`}
                    title={item.name}
                  >
                    <item.icon
                      size={isSidebarOpen ? 18 : 22}
                      className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
                    />
                    {isSidebarOpen && (
                      <span className="text-sm font-medium">{item.name}</span>
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
