"use client";

import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";

// Import the CTA image from assets/images-V2
import ctaMemberImage from "@/assets/images-V2/ctaMember.png";

const localTranslations = {
  de: {
    ctaTitle: "Bereit, Miteigentümer zu",
    ctaT2: "werden?",
    ctaSubtitle: "Kostenlose Registrierung. Entdecken Sie Genossenschaften in Ihrer Nähe in wenigen Minuten.",
    btnExploreCoops: "Genossenschaften erkunden",
    btnRegisterFree: "Kostenlos registrieren",
    ctaFooterText: "Kostenlose Registrierung · Keine versteckten Gebühren · Ihre Daten gehören Ihnen"
  },
  en: {
    ctaTitle: "Ready to become a",
    ctaT2: "co-owner?",
    ctaSubtitle: "Free to register. Discover cooperatives near you in minutes.",
    btnExploreCoops: "Explore Cooperatives",
    btnRegisterFree: "Register Free",
    ctaFooterText: "Free to register · No hidden fees · Your data belongs to you"
  }
};

export const ForMemberCTA = () => {
  const { language } = useLanguage();
  const currentLang = language === "de" ? "de" : "en";
  const pageT = (key) => localTranslations[currentLang]?.[key] || key;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#9c003e] to-[#7d0434] dark:from-[#7a0030] dark:to-[#4e0220] transition-colors duration-300">
      {/* Background grid overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-grid-pattern opacity-10" />

      <div className="container relative z-10 px-6 mx-auto sm:px-8 lg:px-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center lg:min-h-[420px]">

          {/* Left Side: Call to Action Details */}
          <div className="py-12 space-y-6 text-left lg:py-0 lg:col-span-7">
            <h2 className="font-serif text-4xl font-bold leading-tight text-white sm:text-5xl">
              {pageT("ctaTitle")}
              <br />
              <span className="text-white">{pageT("ctaT2")}</span>
            </h2>
            <p className="max-w-xl text-lg font-medium leading-relaxed text-pink-200/90">
              {pageT("ctaSubtitle")}
            </p>

            <div className="flex flex-col items-start gap-4 pt-2 sm:flex-row">
              <Link
                href="/explore"
                className="w-full sm:w-auto px-8 py-3 bg-[#e0e0e0] hover:bg-white text-slate-900 font-bold rounded-xl transition-all duration-300 text-center shadow-lg hover:-translate-y-0.5 active:scale-95"
              >
                {pageT("btnExploreCoops")}
              </Link>
              <Link
                href="/choose-role"
                className="w-full sm:w-auto px-8 py-3 border-2 border-white hover:bg-white hover:text-[#7d0434] text-white font-bold rounded-xl transition-all duration-300 text-center hover:-translate-y-0.5 active:scale-95"
              >
                {pageT("btnRegisterFree")}
              </Link>
            </div>

            <p className="pt-2 text-xs font-semibold tracking-wide text-white/70">
              {pageT("ctaFooterText")}
            </p>
          </div>

          {/* Right Side: Member Image */}
          <div className="flex self-end justify-center h-full lg:col-span-5 lg:justify-end">
            <div className="relative max-h-[380px] lg:max-h-[420px] overflow-hidden flex items-end">
              <img
                className="w-auto h-[320px] sm:h-[380px] lg:h-[420px] object-cover object-bottom"
                alt="Co-owner Member"
                src={ctaMemberImage.src || ctaMemberImage}
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ForMemberCTA;
