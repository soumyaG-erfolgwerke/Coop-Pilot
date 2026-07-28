"use client";

import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

// Import images from assets/images-V2
import chartIcon from "@/assets/images-V2/7867852 1.png";
import docFailedIcon from "@/assets/images-V2/8596974-removebg-preview 1.png";
import openVotesIcon from "@/assets/images-V2/images__1_-removebg-preview (3) 7.png";
import allDocsIcon from "@/assets/images-V2/images__6_-removebg-preview 1-2.png";

// Import SVGs from assets/icons-V2
import sunIcon from "@/assets/icons-V2/glyphs-poly_sun-1.svg";
import treeIcon from "@/assets/icons-V2/glyphs-poly_tree.svg";
import educationIcon from "@/assets/icons-V2/streamline-color_quality-education-flat.svg";
import moneyBagIcon from "@/assets/icons-V2/streamline-ultimate-color_money-bag-dollar.svg";
import { CalendarClock, Vote } from "lucide-react";

const localTranslations = {
  de: {
    secPortalTitle: "IHR MITGLIEDERPORTAL",
    secPortalSubtitle: "Ihr Genossenschaftsleben - wunderschön organisiert",
    secPortalDesc: "Entdecken Sie Genossenschaften in Ihrer Nähe. Treten Sie digital in wenigen Minuten bei. Verfolgen Sie Ihre Anteile, stimmen Sie über Entscheidungen ab und besitzen Sie einen Teil davon selbst.",

    feature1Title: "Echtzeit-Anteilsübersicht",
    feature1Desc: "Sehen Sie genau, wie viele Anteile Sie besitzen, was diese wert sind und Ihre Transaktionshistorie.",
    feature2Title: "Abstimmen in jeder Versammlung",
    feature2Desc: "Nehmen Sie von jedem Gerät aus an digitalen Generalversammlungen teil. Vertretungsvollmachten werden unterstützt.",
    feature3Title: "Alle Ihre Dokumente",
    feature3Desc: "Jahresberichte, Mitgliedsurkunden, Protokolle — immer griffbereit.",

    mockPortalTitle: "Cooppilot Mitgliederportal",
    mockWelcome: "Willkommen zurück",
    mockShareValue: "Mein Anteilswert",
    mockMemberId: "Mitglieds-ID",
    mockDividend: "Jährliche Dividende",
    mockReturn: "Portfolio-Rendite",
    mockOpenVotes: "Offene Abstimmungen",
    mockActive: "Aktiv",
    mockMyDocs: "Meine Dokumente",
    mockFailed: "Fehlgeschlagen",
    mockInvestedProjects: "Meine investierten Projekte",
    mockViewAll: "Alle anzeigen →",
    mockSolar: "Solarpark Italien",
    mockTree: "Baumpflanzung",
    mockEducation: "Kinderbildung"
  },
  en: {
    secPortalTitle: "YOUR MEMBER PORTAL",
    secPortalSubtitle: "Your cooperative life - beautifully organized",
    secPortalDesc: "Discover cooperatives near you. Join digitally in minutes. Track your shares, vote on decisions, and be part of something you own.",

    feature1Title: "Real-time share overview",
    feature1Desc: "See exactly how many shares you hold, what they're worth, and your transaction history.",
    feature2Title: "Vote in every assembly",
    feature2Desc: "Participate in digital general assemblies from any device. Proxy delegation supported.",
    feature3Title: "All your documents",
    feature3Desc: "Annual reports, membership certificates, meeting minutes — always accessible.",

    mockPortalTitle: "Cooppilot Member Portal",
    mockWelcome: "Welcome back",
    mockShareValue: "My share value",
    mockMemberId: "Member ID",
    mockDividend: "Annual dividend",
    mockReturn: "Portfolio return",
    mockOpenVotes: "Open Votes",
    mockActive: "Active",
    mockMyDocs: "My Documents",
    mockFailed: "Failed",
    mockInvestedProjects: "My Invested Projects",
    mockViewAll: "View all →",
    mockSolar: "Solar Farm Italy",
    mockTree: "Tree plantation",
    mockEducation: "Child Education"
  }
};

export const ForMemberFeatures = () => {
  const { language } = useLanguage();
  const currentLang = language === "de" ? "de" : "en";
  const pageT = (key) => localTranslations[currentLang]?.[key] || key;

  return (
    <section className="bg-[#f4f1ec] py-20 transition-colors duration-300 border-b bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800">
      <div className="container px-6 mx-auto sm:px-8 lg:px-12 max-w-7xl">
        <div className="grid items-center grid-cols-1 gap-16 lg:grid-cols-12">

          {/* Features Left Column (lg:col-span-5) */}
          <div className="space-y-8 lg:col-span-5">
            <div className="space-y-4">
              <span className="text-xs font-bold text-[#c80652] dark:text-[#ff4e88] tracking-widest uppercase block">
                {pageT("secPortalTitle")}
              </span>
              <h2 className="font-serif text-4xl font-extrabold text-[#263238] dark:text-slate-100 leading-tight">
                {pageT("secPortalSubtitle")}
              </h2>
              <p className="font-sans text-base leading-relaxed text-[#4e4c4c] dark:text-slate-400">
                {pageT("secPortalDesc")}
              </p>
            </div>

            <div className="space-y-6">
              {/* Feature 1 */}
              <div className="flex items-start gap-5 group">
                <div className="flex items-center justify-center w-16 h-16 overflow-hidden transition-transform border rounded-full shadow-sm bg-pink-50 dark:bg-pink-950/20 shrink-0 border-pink-100/50 dark:border-pink-900/10 group-hover:scale-105 duration-350">
                  <CalendarClock className="text-[#cc5959]" />
                </div>
                <div>
                  <h3 className="font-sans text-xl font-semibold text-black dark:text-slate-100">
                    {pageT("feature1Title")}
                  </h3>
                  <p className="text-sm text-[#4e4c4c] dark:text-slate-400 mt-1 leading-relaxed">
                    {pageT("feature1Desc")}
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-5 group">
                <div className="flex items-center justify-center w-16 h-16 overflow-hidden transition-transform border rounded-full shadow-sm bg-pink-40 dark:bg-pink-950/20 shrink-0 border-pink-100/50 dark:border-pink-900/10 group-hover:scale-105 duration-350">
                  <Vote className="text-[#48A14D]" />
                </div>
                <div>
                  <h3 className="font-sans text-xl font-semibold text-black dark:text-slate-100">
                    {pageT("feature2Title")}
                  </h3>
                  <p className="text-sm text-[#4e4c4c] dark:text-slate-400 mt-1 leading-relaxed">
                    {pageT("feature2Desc")}
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-5 group">
                <div className="flex items-center justify-center w-16 h-16 overflow-hidden transition-transform border rounded-full shadow-sm bg-pink-50 dark:bg-pink-950/20 shrink-0 border-pink-100/50 dark:border-pink-900/10 group-hover:scale-105 duration-350">
                  <img
                    className="w-10 h-10 aspect-[1] object-contain"
                    alt="All your documents"
                    src={allDocsIcon.src || allDocsIcon}
                  />
                </div>
                <div>
                  <h3 className="font-sans text-xl font-semibold text-black dark:text-slate-100">
                    {pageT("feature3Title")}
                  </h3>
                  <p className="text-sm text-[#4e4c4c] dark:text-slate-400 mt-1 leading-relaxed">
                    {pageT("feature3Desc")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* High-Fidelity Mock Portal Right Column (lg:col-span-7) */}
          <div className="flex justify-center w-full lg:col-span-7">
            <div className="w-full max-w-[620px] bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0px_4px_24px_rgba(0,0,0,0.3)] overflow-hidden transition-all duration-300">

              {/* App Bar Header */}
              <div className="flex justify-between items-center px-6 py-4 bg-[#2a2a2a] text-white">
                <span className="text-sm font-semibold tracking-wide">
                  {pageT("mockPortalTitle")}
                </span>
                <span className="font-sans text-sm font-semibold text-slate-300">
                  W.White
                </span>
              </div>

              {/* Portal Content Area */}
              <div className="p-6 space-y-6 bg-slate-50/30 dark:bg-slate-900/20">

                {/* Welcome Card & Share Value Overview */}
                <div className="bg-gradient-to-br from-[#7d0434] to-[#5a0225] text-white p-6 rounded-[20px] shadow-[0px_4px_12px_rgba(0,0,0,0.15)] space-y-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-pink-200 uppercase tracking-wider block">
                        {pageT("mockWelcome")}
                      </span>
                      <h4 className="font-sans text-2xl font-bold tracking-tight">
                        Walter White
                      </h4>
                      <span className="block pt-1 font-mono text-xs text-pink-200/80">
                        {pageT("mockMemberId")} - 16852KDCP
                      </span>
                    </div>
                    <div className="space-y-1 text-right">
                      <span className="text-[11px] font-medium text-pink-200 uppercase tracking-wider block">
                        {pageT("mockShareValue")}
                      </span>
                      <span className="block font-mono text-2xl font-bold tracking-tight">
                        $4,552
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metrics 2x2 Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Card 1: Annual Dividend */}
                  <div className="bg-white dark:bg-slate-850 p-5 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-[0px_4px_10px_rgba(0,0,0,0.02)] flex justify-between items-center hover:-translate-y-0.5 transition-all duration-300 group">
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-[#455a64] dark:text-slate-400 uppercase tracking-wider block">
                        {pageT("mockDividend")}
                      </span>
                      <span className="text-xl font-bold text-[#263238] dark:text-slate-100 font-mono">
                        $4,552
                      </span>
                    </div>
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/20 shrink-0">
                      <img
                        className="object-contain w-6 h-6"
                        alt="Dividend"
                        src={moneyBagIcon.src || moneyBagIcon}
                      />
                    </div>
                  </div>

                  {/* Card 2: Portfolio Return */}
                  <div className="bg-white dark:bg-slate-850 p-5 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-[0px_4px_10px_rgba(0,0,0,0.02)] flex justify-between items-center hover:-translate-y-0.5 transition-all duration-300 group">
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-[#455a64] dark:text-slate-400 uppercase tracking-wider block">
                        {pageT("mockReturn")}
                      </span>
                      <span className="text-xl font-bold text-[#35a833] font-mono">
                        + 2.3%
                      </span>
                    </div>
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 shrink-0">
                      <img
                        className="object-contain w-6 h-6"
                        alt="Portfolio return"
                        src={chartIcon.src || chartIcon}
                      />
                    </div>
                  </div>

                  {/* Card 3: Open Votes */}
                  <div className="bg-white dark:bg-slate-850 p-5 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-[0px_4px_10px_rgba(0,0,0,0.02)] flex justify-between items-center hover:-translate-y-0.5 transition-all duration-300 group">
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-[#455a64] dark:text-slate-400 uppercase tracking-wider block">
                        {pageT("mockOpenVotes")}
                      </span>
                      <span className="text-xl font-bold text-[#263238] dark:text-slate-100 font-sans">
                        2 {pageT("mockActive")}
                      </span>
                    </div>
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 shrink-0">
                      <img
                        className="object-contain w-6 h-6"
                        alt="Open votes"
                        src={openVotesIcon.src || openVotesIcon}
                      />
                    </div>
                  </div>

                  {/* Card 4: My Documents */}
                  <div className="bg-white dark:bg-slate-850 p-5 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-[0px_4px_10px_rgba(0,0,0,0.02)] flex justify-between items-center hover:-translate-y-0.5 transition-all duration-300 group">
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-[#455a64] dark:text-slate-400 uppercase tracking-wider block">
                        {pageT("mockMyDocs")}
                      </span>
                      <span className="text-xl font-bold text-[#c50000] font-sans">
                        3 {pageT("mockFailed")}
                      </span>
                    </div>
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/20 shrink-0">
                      <img
                        className="object-contain w-6 h-6"
                        alt="Failed documents"
                        src={docFailedIcon.src || docFailedIcon}
                      />
                    </div>
                  </div>
                </div>

                {/* My Invested Projects Panel */}
                <div className="bg-white dark:bg-slate-850 p-6 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-[0px_4px_10px_rgba(0,0,0,0.02)] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-[#263238] dark:text-slate-350 uppercase tracking-wider">
                      {pageT("mockInvestedProjects")}
                    </span>
                    <span className="cursor-default text-xs font-semibold text-[#96063e] dark:text-pink-400">
                      {pageT("mockViewAll")}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Project 1: Solar Farm */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-5 h-5 shrink-0">
                            <img
                              className="object-contain w-full h-full"
                              alt="Solar Farm"
                              src={sunIcon.src || sunIcon}
                            />
                          </div>
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {pageT("mockSolar")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="text-slate-600 dark:text-slate-400">$456</span>
                          <span className="text-[#35a833] font-bold">+12.6%</span>
                        </div>
                      </div>
                      <div className="flex w-full h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="bg-[#35a833] h-full rounded-full" style={{ width: "80%" }} />
                      </div>
                    </div>

                    {/* Project 2: Tree Plantation */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-5 h-5 shrink-0">
                            <img
                              className="object-contain w-full h-full"
                              alt="Tree plantation"
                              src={treeIcon.src || treeIcon}
                            />
                          </div>
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {pageT("mockTree")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="text-slate-600 dark:text-slate-400">$115</span>
                          <span className="text-[#35a833] font-bold">+9.7%</span>
                        </div>
                      </div>
                      <div className="flex w-full h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="bg-[#f2c94c] h-full rounded-full" style={{ width: "60%" }} />
                      </div>
                    </div>

                    {/* Project 3: Child Education */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-5 h-5 shrink-0">
                            <img
                              className="object-contain w-5 h-5"
                              alt="Child education"
                              src={educationIcon.src || educationIcon}
                            />
                          </div>
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {pageT("mockEducation")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="text-slate-600 dark:text-slate-400">$165</span>
                          <span className="text-[#35a833] font-bold">+4.7%</span>
                        </div>
                      </div>
                      <div className="flex w-full h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="bg-[#c50000] h-full rounded-full" style={{ width: "40%" }} />
                      </div>
                    </div>
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
export default ForMemberFeatures;
