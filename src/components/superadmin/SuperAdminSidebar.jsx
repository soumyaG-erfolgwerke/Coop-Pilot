"use client";

// import React, { useState, useEffect } from "react";
import {
  Shield,
  Building2,
  Users,
  Mail,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ClipboardEdit,
  Crown,
  Edit2Icon,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

// --- SIDEBAR ---
export const SuperAdminSidebar = ({
  activeView,
  setActiveView,
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const navItems = [
    { name: "Dashboard", icon: Shield, view: "Dashboard" },
    { name: "Cooperatives", icon: Building2, view: "Cooperatives" },
    { name: "Users", icon: Users, view: "Users" },
    { name: "Custom Notification", icon: MessageSquare, view: "Messages" },
    { name: "Contacted Users", icon: Settings, view: "Contacts" },
    {
      name: "Pending Cooperatives",
      icon: ClipboardEdit,
      view: "PendingCooperatives",
    },
    { name: "Mail", icon: Mail, view: "Mails" },
    { name: "Profile", icon: Users, view: "Profile" },
    { name: "Update", view: "Update", icon: Edit2Icon },
  ];

  const { logout } = useAuth();
  const router = useRouter();
  const handleLogout = async () => {
    await logout(router);
  };
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transition-all duration-300 ${
        isSidebarOpen ? "w-64" : "w-20"
      } overflow-y-auto scrollbar-thin`}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between h-16 p-4 bg-white dark:bg-slate-800">
        {isSidebarOpen && (
          <div className="flex items-center">
            <Crown size={24} className="mr-2 text-amber-500" />
            <span className="text-xl font-bold text-gray-800 dark:text-white">
              Super Admin
            </span>
          </div>
        )}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-gray-600 rounded-md dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
        >
          {isSidebarOpen ? <ChevronLeft /> : <ChevronRight />}
        </button>
      </div>
      <nav className="px-2 mt-2">
        {navItems.map((item) => (
          <li key={item.name} className="mb-1 list-none">
            <button
              onClick={() => setActiveView(item.view)}
              className={`w-full flex items-center py-2.5 px-3 rounded-md transition-colors duration-150 ${
                activeView === item.view
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              } ${!isSidebarOpen && "justify-center"}`}
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
      </nav>
      <div
        className={`mt-auto p-4 border-t border-gray-200 dark:border-slate-700 sticky bottom-0 bg-white dark:bg-slate-800 ${
          !isSidebarOpen && "flex flex-col items-center space-y-2"
        }`}
      >
        {isSidebarOpen}
        <button
          className={`w-full flex items-center py-2.5 px-3 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 ${
            !isSidebarOpen && "justify-center"
          }`}
          title="Log Out"
          onClick={handleLogout}
        >
          <LogOut
            size={isSidebarOpen ? 18 : 22}
            className={`${isSidebarOpen ? "mr-3" : ""} shrink-0`}
          />
          {isSidebarOpen && (
            <span className="text-sm font-medium">Log Out</span>
          )}
        </button>
      </div>
    </aside>
  );
};
