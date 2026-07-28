"use client";

import React from "react";
import { LayoutDashboard, Users, Sparkles } from "lucide-react";

export default function MobileNav({ activeView, setActiveView, mobileTabs }) {
  return (
    <nav className="sticky top-16 z-20 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/80 md:hidden">
      <div className="overflow-x-auto px-4 py-2 scrollbar-hide">
        <div className="flex items-center gap-2">
          {mobileTabs.map((item) => (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              className={`flex-shrink-0 flex items-center space-x-2 rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200 ease-in-out hover:scale-105 ${
                activeView === item.view
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700"
              }`}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}