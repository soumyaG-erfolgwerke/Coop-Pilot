"use client";

// Import React hooks for component state and effect handling
import React from "react";
// Import Search glass icon from lucide-react
import { Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * GlobalSearchTrigger Component
 * Renders a prominent search input trigger inside the authenticated Navbar.
 * Clicking it or hitting Cmd+K/Ctrl+K opens the Multi-Cooperative Global Search overlay.
 */
export default function GlobalSearchTrigger({ onClick }) {
  const { language } = useLanguage();

  const placeholderText =
    language === "de"
      ? "Genossenschaften durchsuchen... (Mitglieder, Dokumente, Beschlüsse)"
      : "Search cooperatives... (Members, documents, resolutions)";

  return (
    <button
      onClick={onClick}
      type="button"
      className="hidden md:flex items-center justify-between w-64 lg:w-96 px-3.5 py-2 text-sm text-gray-400 dark:text-neutral-400 bg-gray-50 dark:bg-neutral-800/80 border border-gray-200 dark:border-neutral-700/80 rounded-xl hover:bg-white dark:hover:bg-neutral-800 hover:border-gray-300 dark:hover:border-neutral-600 transition-all group shadow-sm"
      title="Open Global Search (Ctrl + K)"
    >
      {/* Left Search Icon and Placeholder Text */}
      <div className="flex items-center gap-2 overflow-hidden truncate">
        <Search className="w-4 h-4 text-gray-400 dark:text-neutral-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
        <span className="truncate text-xs lg:text-sm text-gray-500 dark:text-neutral-400 font-medium">
          {placeholderText}
        </span>
      </div>

      {/* Right Keyboard Shortcut Badge (Ctrl K / ⌘K) */}
      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:text-neutral-400 bg-gray-200/70 dark:bg-neutral-700/80 border border-gray-300 dark:border-neutral-600 rounded">
          ⌘K
        </kbd>
      </div>
    </button>
  );
}
