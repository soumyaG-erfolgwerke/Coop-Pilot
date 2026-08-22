"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Users,
  FileText,
  CreditCard,
  Award,
  ClipboardCheck,
  X,
  ChevronRight,
  Loader2,
  CornerDownLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * GlobalSearchModal Component
 * Renders a centered Linear/Stripe-inspired Command Palette search modal.
 * Supports keyboard hotkeys (Cmd+K/Ctrl+K), debounced backend queries,
 * grouped results by category, keyboard navigation (Up/Down/Enter), and direct routing.
 */
export default function GlobalSearchModal({ isOpen, onClose }) {
  const { language } = useLanguage();
  const router = useRouter();

  // State Management
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({
    members: [],
    documents: [],
    transactions: [],
    resolutions: [],
    applications: [],
  });
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef(null);

  // 1. Focus search input automatically when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery("");
      setResults({
        members: [],
        documents: [],
        transactions: [],
        resolutions: [],
        applications: [],
      });
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // 2. Listen for global keyboard shortcuts (Cmd+K / Ctrl+K / Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open modal
          if (typeof window !== "undefined") {
            const event = new CustomEvent("open-global-search");
            window.dispatchEvent(event);
          }
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // 3. Debounced (250ms) search fetcher calling backend API /api/search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults({
        members: [],
        documents: [],
        transactions: [],
        resolutions: [],
        applications: [],
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.results) {
            setResults(data.results);
            setSelectedIndex(0);
          }
        }
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // 4. Flatten active items list for keyboard navigation (Up/Down/Enter)
  const getFlatList = () => {
    let list = [];
    if (activeCategory === "all" || activeCategory === "documents") {
      list = [...list, ...results.documents];
    }
    if (activeCategory === "all" || activeCategory === "members") {
      list = [...list, ...results.members];
    }
    if (activeCategory === "all" || activeCategory === "transactions") {
      list = [...list, ...results.transactions];
    }
    if (activeCategory === "all" || activeCategory === "resolutions") {
      list = [...list, ...results.resolutions];
    }
    if (activeCategory === "all" || activeCategory === "applications") {
      list = [...list, ...results.applications];
    }
    return list;
  };

  const flatList = getFlatList();

  // 5. Handle Arrow Key navigation (Up, Down, Enter)
  const handleKeyNavigation = (e) => {
    if (flatList.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flatList.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatList.length) % flatList.length);
    } else if (e.key === "Enter" && flatList[selectedIndex]) {
      e.preventDefault();
      handleSelectResult(flatList[selectedIndex]);
    }
  };

  // 6. Direct click-through routing to the source record page
  const handleSelectResult = (item) => {
    onClose();
    if (item.url) {
      router.push(item.url);
    }
  };

  if (!isOpen) return null;

  const hasAnyResults = flatList.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      {/* Modal Card Overlay Container */}
      <div
        className="w-full max-w-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyNavigation}
      >
        {/* Search Header Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <Search className="w-5 h-5 text-gray-400 dark:text-neutral-500 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              language === "de"
                ? "Suchen nach Dokumenten, Mitgliedern, Beschlüssen..."
                : "Search documents, members, resolutions, transactions..."
            }
            className="w-full text-base bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500"
          />
          {loading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin mr-2 flex-shrink-0" />}
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Pills Bar */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-gray-50/70 dark:bg-neutral-900/50 border-b border-gray-100 dark:border-neutral-800 text-xs overflow-x-auto">
          {[
            { id: "all", label: language === "de" ? "Alle" : "All" },
            { id: "documents", label: language === "de" ? "Dokumente" : "Documents" },
            { id: "members", label: language === "de" ? "Mitglieder" : "Members" },
            { id: "transactions", label: language === "de" ? "Transaktionen" : "Transactions" },
            { id: "resolutions", label: language === "de" ? "Beschlüsse" : "Resolutions" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeCategory === cat.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-neutral-400 hover:bg-gray-200/60 dark:hover:bg-neutral-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results List Area */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {!query.trim() ? (
            <div className="py-12 text-center text-sm text-gray-400 dark:text-neutral-500">
              {language === "de"
                ? "Geben Sie einen Suchbegriff ein, um die Genossenschaft zu durchsuchen."
                : "Type a query to search across your cooperative records."}
            </div>
          ) : !loading && !hasAnyResults ? (
            <div className="py-12 text-center text-sm text-gray-400 dark:text-neutral-500">
              {language === "de"
                ? `Keine Ergebnisse für "${query}" gefunden.`
                : `No records found matching "${query}".`}
            </div>
          ) : (
            <>
              {/* 📄 Documents Group */}
              {(activeCategory === "all" || activeCategory === "documents") &&
                results.documents.length > 0 && (
                  <div>
                    <div className="px-3 py-1 text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      {language === "de" ? "Dokumente & Nachweise" : "Documents & Evidence"}
                    </div>
                    <div className="mt-1 space-y-1">
                      {results.documents.map((doc) => {
                        const itemIdx = flatList.findIndex((i) => i.id === doc.id);
                        const isSelected = itemIdx === selectedIndex;
                        return (
                          <div
                            key={doc.id}
                            onClick={() => handleSelectResult(doc)}
                            onMouseEnter={() => setSelectedIndex(itemIdx)}
                            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                              isSelected
                                ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50"
                                : "hover:bg-gray-50 dark:hover:bg-neutral-800/60 border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 flex-shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="overflow-hidden">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                  {doc.title}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-neutral-400 truncate">
                                  {doc.subtitle}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 flex-shrink-0 ml-2">
                              {doc.badge}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* 👥 Members Group */}
              {(activeCategory === "all" || activeCategory === "members") &&
                results.members.length > 0 && (
                  <div>
                    <div className="px-3 py-1 text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-500" />
                      {language === "de" ? "Genossenschaftsmitglieder" : "Cooperative Members"}
                    </div>
                    <div className="mt-1 space-y-1">
                      {results.members.map((m) => {
                        const itemIdx = flatList.findIndex((i) => i.id === m.id);
                        const isSelected = itemIdx === selectedIndex;
                        return (
                          <div
                            key={m.id}
                            onClick={() => handleSelectResult(m)}
                            onMouseEnter={() => setSelectedIndex(itemIdx)}
                            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                              isSelected
                                ? "bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50"
                                : "hover:bg-gray-50 dark:hover:bg-neutral-800/60 border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400 flex-shrink-0">
                                <Users className="w-4 h-4" />
                              </div>
                              <div className="overflow-hidden">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                  {m.title}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-neutral-400 truncate">
                                  {m.subtitle}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex-shrink-0 ml-2">
                              {m.badge}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* 💳 Transactions Group */}
              {(activeCategory === "all" || activeCategory === "transactions") &&
                results.transactions.length > 0 && (
                  <div>
                    <div className="px-3 py-1 text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-purple-500" />
                      {language === "de" ? "Finanztransaktionen" : "Transactions"}
                    </div>
                    <div className="mt-1 space-y-1">
                      {results.transactions.map((tx) => {
                        const itemIdx = flatList.findIndex((i) => i.id === tx.id);
                        const isSelected = itemIdx === selectedIndex;
                        return (
                          <div
                            key={tx.id}
                            onClick={() => handleSelectResult(tx)}
                            onMouseEnter={() => setSelectedIndex(itemIdx)}
                            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                              isSelected
                                ? "bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800/50"
                                : "hover:bg-gray-50 dark:hover:bg-neutral-800/60 border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400 flex-shrink-0">
                                <CreditCard className="w-4 h-4" />
                              </div>
                              <div className="overflow-hidden">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                  {tx.title}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-neutral-400 truncate">
                                  {tx.subtitle}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex-shrink-0 ml-2">
                              {tx.badge}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* 📜 Resolutions Group */}
              {(activeCategory === "all" || activeCategory === "resolutions") &&
                results.resolutions.length > 0 && (
                  <div>
                    <div className="px-3 py-1 text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      {language === "de" ? "Generalversammlungs-Beschlüsse" : "Assembly Resolutions"}
                    </div>
                    <div className="mt-1 space-y-1">
                      {results.resolutions.map((r) => {
                        const itemIdx = flatList.findIndex((i) => i.id === r.id);
                        const isSelected = itemIdx === selectedIndex;
                        return (
                          <div
                            key={r.id}
                            onClick={() => handleSelectResult(r)}
                            onMouseEnter={() => setSelectedIndex(itemIdx)}
                            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                              isSelected
                                ? "bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50"
                                : "hover:bg-gray-50 dark:hover:bg-neutral-800/60 border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="p-2 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400 flex-shrink-0">
                                <Award className="w-4 h-4" />
                              </div>
                              <div className="overflow-hidden">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                  {r.title}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-neutral-400 truncate">
                                  {r.subtitle}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex-shrink-0 ml-2">
                              {r.badge}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </>
          )}
        </div>

        {/* Footer Shortcut Navigation Guide */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 text-xs text-gray-400 dark:text-neutral-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-gray-200 dark:bg-neutral-800 rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-gray-200 dark:bg-neutral-800 rounded">↓</kbd>
              {language === "de" ? "Navigieren" : "Navigate"}
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3" />
              {language === "de" ? "Öffnen" : "Select"}
            </span>
          </div>
          <div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-gray-200 dark:bg-neutral-800 rounded">ESC</kbd>{" "}
            {language === "de" ? "Schließen" : "Close"}
          </div>
        </div>
      </div>
    </div>
  );
}
