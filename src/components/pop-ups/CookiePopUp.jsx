"use client";

import React, { useState, useEffect } from "react";
import { Cookie, ShieldCheck, Check, Lock, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

const CONSENT_KEY = "easycoop_cookie_consent";

export default function CookiePopUp() {
  const { user, isLoading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Only evaluate after auth state check completes
    if (isLoading) return;

    // Check if user is NOT logged in / session not found
    if (!user) {
      try {
        const hasConsented = localStorage.getItem(CONSENT_KEY);
        if (!hasConsented) {
          setIsVisible(true);
          const timer = setTimeout(() => setIsAnimating(true), 50);
          return () => clearTimeout(timer);
        }
      } catch (err) {
        setIsVisible(true);
        setIsAnimating(true);
      }
    } else {
      setIsVisible(false);
      setIsAnimating(false);
    }
  }, [user, isLoading]);

  const handleAccept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, "accepted");
      document.cookie = `${CONSENT_KEY}=accepted; path=/; max-age=31536000; SameSite=Lax`;
    } catch (err) {
      console.error("Failed to save cookie consent", err);
    }

    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-end sm:items-bottom sm:justify-end p-4 sm:p-6 pointer-events-none transition-opacity duration-300 ${isAnimating ? "opacity-100" : "opacity-0"
        }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-popup-title"
    >
      {/* Background backdrop blur */}
      <div
        className={`fixed inset-0 bg-gray-950/25 dark:bg-black/40 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-300 ${isAnimating ? "opacity-100" : "opacity-0"
          }`}
      />

      {/* Main Professional Pop-Up Card */}
      <div
        className={`relative pointer-events-auto w-full max-w-lg bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-[#a2185b]/20 dark:border-[#a2185b]/30 rounded-2xl shadow-2xl shadow-[#a2185b]/10 p-6 overflow-hidden transform transition-all duration-300 ${isAnimating
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-8 scale-95 opacity-0"
          }`}
      >
        {/* Top Decorative #a2185b Brand Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#a2185b] via-[#b7416e] to-[#d48cb9]" />

        {/* Content Container */}
        <div className="space-y-4">
          {/* Header Row */}
          <div className="flex items-center space-x-3.5">
            {/* <div className="relative flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-[#a2185b]/10 dark:bg-[#a2185b]/20 text-[#a2185b] dark:text-[#d48cb9] border border-[#a2185b]/20">
              <Cookie className="w-5 h-5" />
              <span className="absolute flex w-3 h-3 -top-1 -right-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d48cb9] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#a2185b]"></span>
              </span>
            </div> */}

            <div>
              <div className="flex items-center space-x-2">
                <h3
                  id="cookie-popup-title"
                  className="text-base font-semibold tracking-tight text-gray-900 dark:text-white"
                >
                  Cookie & Privacy Preferences
                </h3>
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#a2185b]/10 dark:bg-[#a2185b]/20 text-[#a2185b] dark:text-[#d48cb9] border border-[#a2185b]/30">
                  <ShieldCheck className="w-3 h-3 text-[#a2185b] dark:text-[#d48cb9]" />
                  <span>Essential</span>
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                EasyCoop Platform Security & Performance
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs leading-relaxed text-gray-600 sm:text-sm dark:text-gray-300">
            We use essential cookies and browser local storage to maintain session security, enable user authentication, and ensure normal site operations. By continuing to use our website, you agree to our cookie settings.
          </p>

          {/* Feature Badges */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-300 bg-[#a2185b]/5 dark:bg-[#a2185b]/15 rounded-lg px-2.5 py-1.5 border border-[#a2185b]/15 dark:border-[#a2185b]/30">
              <Lock className="w-3.5 h-3.5 text-[#a2185b] dark:text-[#d48cb9]" />
              <span>Encrypted Sessions</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-300 bg-[#a2185b]/5 dark:bg-[#a2185b]/15 rounded-lg px-2.5 py-1.5 border border-[#a2185b]/15 dark:border-[#a2185b]/30">
              <ShieldCheck className="w-3.5 h-3.5 text-[#a2185b] dark:text-[#d48cb9]" />
              <span>Zero Tracking Ads</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800/80 sm:flex-row sm:items-center">
            <Link
              href="/cookie-policy"
              className="inline-flex items-center space-x-1 text-xs font-medium text-[#a2185b] dark:text-[#d48cb9] hover:text-[#b7416e] dark:hover:text-white transition-colors"
            >
              <span>Read Cookie Policy</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            {/* Single Action Button */}
            <button
              onClick={handleAccept}
              id="cookie-accept-btn"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#a2185b] via-[#b7416e] to-[#a2185b] hover:opacity-95 active:scale-[0.98] rounded-xl shadow-lg shadow-[#a2185b]/25 hover:shadow-[#a2185b]/35 transition-all duration-200 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Accept</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
