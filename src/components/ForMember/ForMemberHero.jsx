"use client";

import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import F180164829Skbt3Pwk2Lflab1WigcwmapxvftlypcqRemovebgPreview1 from "@/assets/images-V2/1000-f-180164829-skbt3pwk2lflab1wigcwmapxvftlypcq-removebg-preview-1.png";
import download11 from "@/assets/images-V2/download-1-1.png";
import screenshot20260425163105RemovebgPreview1 from "@/assets/images-V2/screenshot-2026-04-25-163105-removebg-preview-1.png";
import { ArrowRight } from "lucide-react";
const localTranslations = {
  de: {
    breadcrumb1: "Cooppilot",
    breadcrumb2: "Für Mitglieder",
    heroTitlePart1: "Nicht nur Kunde. ",
    heroTitlePart2: "Sondern Miteigentümer.",
    heroSubtitle: "Entdecken Sie Genossenschaften in Ihrer Nähe. Treten Sie digital in wenigen Minuten bei. Verfolgen Sie Ihre Anteile, stimmen Sie über Entscheidungen ab und besitzen Sie einen Teil davon selbst.",
    btnExplorePortal: "Mitgliederportal erkunden",
    btnHowItWorks: "Wie es funktioniert",
    floatingRecord1: "Transparente Anteile",
    floatingRecord2: "Anteilsverfolgung",
    floatingRecord3: "Benachrichtigungen & Updates",
    floatingRecord4: "Mitbestimmung & Governance",
    floatingRecordTitle: "Transparente Anteile",
  },
  en: {
    breadcrumb1: "Cooppilot",
    breadcrumb2: "For Members",
    heroTitlePart1: "Not just a customer. ",
    heroTitlePart2: "A co-owner.",
    heroSubtitle: "Discover cooperatives near you. Join digitally in minutes. Track your shares, vote on decisions, and be part of something you own.",
    btnExplorePortal: "Explore Member Portal",
    btnHowItWorks: "How It Works",
    floatingRecord1: "Transparent Share Records",
    floatingRecord2: "Share Tracking",
    floatingRecord3: "Notifications & Updates",
    floatingRecord4: "Governance Participation",
    floatingRecordTitle: "Transparent Shares",
  }
};

export const ForMemberHero = () => {
  const { language } = useLanguage();
  const currentLang = language === "de" ? "de" : "en";
  const pageT = (key) => localTranslations[currentLang]?.[key] || key;

  return (
    <section className="relative w-full min-h-[580px] lg:h-[calc(100vh-64px)] bg-[#ffe3c5] dark:bg-amber-950/15 overflow-hidden flex items-center transition-colors duration-300">

      {/* Background radial highlight */}
      <div className="absolute top-[20%] right-[-5%] w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-[#c80652]/70 to-[#7d0534]/70 blur-3xl opacity-20 pointer-events-none" />

      <div className="container relative z-10 w-full h-full px-6 mx-auto sm:px-12 lg:px-16">
        <div className="grid items-center h-full grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">

          {/* Left text column */}
          <div className="py-12 space-y-6 lg:col-span-7 lg:py-0">
            {/* Breadcrumb */}
            <div className="text-sm font-semibold text-[#8b8a8a] dark:text-slate-400 font-sans tracking-wide flex items-center">
              <Link href="/" className="pr-2 text-[#8b8a8a] dark:text-slate-400 hover:text-black hover:dark:text-slate-100 transition-colors">
                {pageT("breadcrumb1")}
              </Link>
              <ArrowRight className="w-4 h-4 text-[#8b8a8a] dark:text-slate-400" />
              <span className="pl-2 text-[#935385] dark:text-slate-100">{pageT("breadcrumb2")}</span>
            </div>

            {/* Heading */}
            <h1 className="font-serif text-4xl font-extrabold leading-tight tracking-tight text-black sm:text-5xl lg:text-6xl dark:text-slate-100">
              <span className="block">{pageT("heroTitlePart1")}</span>
              <span className="block text-5xl sm:text-6xl lg:text-7xl text-[#7d0434] dark:text-[#ff7aa3] mt-2 font-sans font-black">
                {pageT("heroTitlePart2")}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-[#626262] dark:text-slate-350 leading-relaxed font-sans max-w-xl">
              {pageT("heroSubtitle")}
            </p>

            {/* Buttons Row */}
            <div className="flex flex-col items-stretch gap-4 pt-4 sm:flex-row sm:items-center">
              <Link
                href="/signinpage"
                className="px-8 py-4 bg-[#ffc301] hover:bg-[#e6b000] text-black font-semibold text-lg rounded-[15px] transition-all duration-300 shadow-md hover:-translate-y-0.5 active:scale-95 text-center"
              >
                {pageT("btnExplorePortal")}
              </Link>
              <a
                href="/for-member"
                className="px-8 py-4 border-[3px] border-solid border-black dark:border-slate-200 hover:bg-black hover:text-white dark:hover:bg-slate-200 dark:hover:text-black text-black dark:text-slate-200 font-semibold text-lg rounded-[15px] transition-all duration-300 hover:-translate-y-0.5 active:scale-95 text-center"
              >
                {pageT("btnHowItWorks")}
              </a>
            </div>
          </div>

          {/* Right column: Layered Visuals with Absolute Positions on Desktop */}
          <div className="lg:col-span-5 self-end relative h-[380px] sm:h-[480px] lg:h-[90%] w-full flex items-end justify-center lg:justify-end overflow-visible">

            {/* Visual wrapper for scaling */}
            <div className="relative w-full max-w-[460px] h-full flex items-end justify-center">

              {/* Large Burgundy Circle Background */}
              <div className="absolute top-[20%] left-[8%] w-[84%] aspect-square rounded-full bg-gradient-to-tr from-[#c80652]/90 to-[#7d0534]/90 dark:from-[#9c003e]/70 dark:to-[#5a0225]/70 shadow-2xl -z-10" />

              {/* Main Person Image */}
              <img
                src={F180164829Skbt3Pwk2Lflab1WigcwmapxvftlypcqRemovebgPreview1.src || F180164829Skbt3Pwk2Lflab1WigcwmapxvftlypcqRemovebgPreview1}
                alt="Member"
                className="relative bottom-0 w-[95%] sm:w-full h-full object-contain z-10 pointer-events-none transform hover:scale-[1.02] transition-transform duration-500"
              />

              {/* Floating Dashboard Widget (Left overlay) */}
              <div className="absolute left-[-8%] top-[40%] w-[42%] z-20 shadow-2xl border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 p-1 transform -rotate-6 hover:rotate-0 hover:scale-105 transition-all duration-300">
                <img
                  src={screenshot20260425163105RemovebgPreview1.src || screenshot20260425163105RemovebgPreview1}
                  alt="Dashboard View"
                  className="object-cover w-full rounded-lg"
                />
              </div>

              {/* Floating Share Allocation Breakdown Card (Right overlay) */}
              <div className="absolute right-[-4%] bottom-[15%] w-[46%] h-[135px] z-20 bg-white dark:bg-slate-850 rounded-[20px] border border-solid border-[#dddddd] dark:border-slate-800 shadow-[0px_4px_4px_rgba(0,0,0,0.25)] p-3 flex flex-col justify-between transform rotate-3 hover:rotate-0 hover:scale-105 transition-all duration-300">

                {/* Center Image */}
                <div className="flex justify-center -mt-8">
                  <img
                    className="object-cover w-16 h-16 bg-white border-4 border-white rounded-full shadow-md dark:border-slate-850"
                    alt="Download"
                    src={download11.src || download11}
                  />
                </div>

                <div className="text-[7.5px] font-semibold text-center text-slate-800 dark:text-slate-100 -mt-1 font-sans">
                  40% Share Records
                </div>

                {/* Progress elements grid */}
                <div className="grid grid-cols-4 gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[9px] font-bold text-black dark:text-slate-100 font-mono">40%</span>
                    <span className="text-[4px] text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider block mt-0.5 leading-tight truncate w-full">
                      {pageT("floatingRecordTitle").split(" ")[0]}
                    </span>
                    <div className="w-[5px] h-[5px] bg-[#7733ff] rounded-full mt-1 shrink-0" />
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[9px] font-bold text-black dark:text-slate-100 font-mono">30%</span>
                    <span className="text-[4px] text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider block mt-0.5 leading-tight truncate w-full">
                      {pageT("floatingRecord2").split(" ")[0]}
                    </span>
                    <div className="w-[5px] h-[5px] bg-[#e3e3e3] rounded-full mt-1 shrink-0" />
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[9px] font-bold text-black dark:text-slate-100 font-mono">20%</span>
                    <span className="text-[4px] text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider block mt-0.5 leading-tight truncate w-full">
                      {pageT("floatingRecord3").split(" ")[0]}
                    </span>
                    <div className="w-[5px] h-[5px] bg-[#00c434] rounded-full mt-1 shrink-0" />
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[9px] font-bold text-black dark:text-slate-100 font-mono">10%</span>
                    <span className="text-[4px] text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider block mt-0.5 leading-tight truncate w-full">
                      {pageT("floatingRecord4").split(" ")[0]}
                    </span>
                    <div className="w-[5px] h-[5px] bg-[#ffc301] rounded-full mt-1 shrink-0" />
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ForMemberHero;
