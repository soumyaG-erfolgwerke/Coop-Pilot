"use client";

import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import ForMemberHero from "@/components/ForMember/ForMemberHero";
import ForMemberFeatures from "@/components/ForMember/ForMemberFeatures";
import ForMemberSteps from "@/components/ForMember/ForMemberSteps";
import ForMemberTrust from "@/components/ForMember/ForMemberTrust";
import ForMemberCTA from "@/components/ForMember/ForMemberCTA";



import {
  Sun,
  Apple,
  Home as HomeIcon,
} from "lucide-react";

// Localized translation dictionaries for the landing page
const localTranslations = {
  de: {
    breadcrumb: "Cooppilot > Für Mitglieder",
    heroTitle: "Nicht nur Kunde. Sondern Miteigentümer.",
    heroSubtitle: "Entdecken Sie Genossenschaften in Ihrer Nähe. Treten Sie digital in wenigen Minuten bei. Verfolgen Sie Ihre Anteile, stimmen Sie über Entscheidungen ab und besitzen Sie einen Teil davon selbst.",
    btnExplorePortal: "Mitgliederportal erkunden",
    btnHowItWorks: "Wie es funktioniert",

    floatingRecord1: "Transparente Anteile",
    floatingRecord2: "Anteilsverfolgung",
    floatingRecord3: "Benachrichtigungen & Updates",
    floatingRecord4: "Mitbestimmung & Governance",
    floatingRecordTitle: "Transparente Anteile",
    recordBreakdown: "Aufteilung der Anteile",

    secPortalTitle: "IHR MITGLIEDERPORTAL",
    secPortalSubtitle: "Ihr Genossenschaftsleben - wunderschön organisiert",
    secPortalDesc: "Mit CoopPilot haben Sie alle Ihre genossenschaftlichen Aktivitäten an einem zentralen Ort gebündelt. Keine verstreuten Briefe oder E-Mails mehr.",

    feature1Title: "Echtzeit-Anteilsübersicht",
    feature1Desc: "Sehen Sie genau, wie viele Anteile Sie besitzen, was diese wert sind und Ihre Transaktionshistorie.",
    feature2Title: "Abstimmen in jeder Versammlung",
    feature2Desc: "Nehmen Sie von jedem Gerät aus an digitalen Generalversammlungen teil. Vertretungsvollmachten werden unterstützt.",
    feature3Title: "Alle Ihre Dokumente",
    feature3Desc: "Jahresberichte, Mitgliedsurkunden, Protokolle — immer griffbereit.",

    mockWelcome: "Willkommen zurück",
    mockShareValue: "Mein Anteilswert",
    mockMemberId: "Mitglieds-ID",
    mockDividend: "Jährliche Dividende",
    mockReturn: "Portfolio-Rendite",
    mockOpenVotes: "Offene Abstimmungen",
    mockActive: "Aktiv",
    mockMyDocs: "Meine Dokumente",
    mockFailed: "Aktion nötig",
    mockInvestedProjects: "Meine investierten Projekte",
    mockViewAll: "Alle anzeigen →",
    mockSolar: "Solarpark Bayern",
    mockTree: "Aufforstung",
    mockEducation: "Kinderbildung",

    howItWorksTitle: "Wie die Mitgliedschaft einfach wird",
    step1Title: "Digital beitreten",
    step1Desc: "Beantragen Sie Ihre Mitgliedschaft ganz ohne Papierkram digital.",
    step2Title: "Anteile verfolgen",
    step2Desc: "Behalten Sie Ihre Dividenden und Anteilsentwicklungen im Blick.",
    step3Title: "Abstimmen & Mitwirken",
    step3Desc: "Stimmen Sie digital ab und gestalten Sie Ihre Genossenschaft.",

    prodActionTitle: "PRODUKT IN AKTION",
    prodActionSubtitle: "Investieren Sie in Dinge, die Ihnen wichtig sind.",

    energyCoop: "ENERGIEGENOSSENSCHAFT",
    energyCoopDesc: "Bürgersolarpark in Bayern. 2,4 MW saubere Energiekapazität auf 3 Dachanlagen. Reguliert nach GenG.",
    housingCoop: "Wohnungsgenossenschaft",
    housingCoopDesc: "Bezahlbares genossenschaftliches Wohnen in Hamburg. Mitglieder erhalten lebenslanges Wohnrecht und Mitspracherecht bei allen Immobilienentscheidungen.",
    consumerCoop: "Konsumgenossenschaft",
    consumerCoopDesc: "Bio-Lebensmittelgenossenschaft in München. Mitglieder bündeln ihre Kaufkraft, erhalten Vorzugspreise und stimmen über das Sortiment ab.",

    minShare: "Mindestanteil",
    members: "Mitglieder",
    benefitType: "Vorteilsart",
    benefitTypeEnergy: "Ausschüttung p.a.",
    tenancy: "Wohnrecht",
    discount: "Rabatt",
    organicFood: "Bio-Lebensmittel",

    ctaTitle: "Bereit, Miteigentümer zu werden?",
    ctaSubtitle: "Kostenlose Registrierung. Entdecken Sie Genossenschaften in Ihrer Nähe in wenigen Minuten.",
    btnExploreCoops: "Genossenschaften erkunden",
    btnRegisterFree: "Kostenlos registrieren",
    ctaFooterText: "Kostenlose Registrierung · Keine versteckten Gebühren · Ihre Daten gehören Ihnen"
  },
  en: {
    breadcrumb: "Cooppilot > For Members",
    heroTitle: "Not just a customer. A co-owner.",
    heroSubtitle: "Discover cooperatives near you. Join digitally in minutes. Track your shares, vote on decisions, and be part of something you own.",
    btnExplorePortal: "Explore Member Portal",
    btnHowItWorks: "How It Works",

    floatingRecord1: "Transparent Share Records",
    floatingRecord2: "Share Tracking",
    floatingRecord3: "Notifications & Updates",
    floatingRecord4: "Governance Participation",
    floatingRecordTitle: "Transparent Shares",
    recordBreakdown: "Share allocation breakdown",

    secPortalTitle: "YOUR MEMBER PORTAL",
    secPortalSubtitle: "Your cooperative life - beautifully organized",
    secPortalDesc: "With CoopPilot, all your cooperative activities are consolidated in one secure, modern interface. No more lost paperwork or complex forms.",

    feature1Title: "Real-time share overview",
    feature1Desc: "See exactly how many shares you hold, what they're worth, and your transaction history.",
    feature2Title: "Vote in every assembly",
    feature2Desc: "Participate in digital general assemblies from any device. Proxy delegation supported.",
    feature3Title: "All your documents",
    feature3Desc: "Annual reports, membership certificates, meeting minutes — always accessible.",

    mockWelcome: "Welcome back",
    mockShareValue: "My share value",
    mockMemberId: "Member ID",
    mockDividend: "Annual dividend",
    mockReturn: "Portfolio return",
    mockOpenVotes: "Open Votes",
    mockActive: "Active",
    mockMyDocs: "My Documents",
    mockFailed: "Action Required",
    mockInvestedProjects: "My Invested Projects",
    mockViewAll: "View all →",
    mockSolar: "Solar Farm Bayern",
    mockTree: "Reforestation",
    mockEducation: "Child Education",

    howItWorksTitle: "How membership becomes simple",
    step1Title: "Join Digitally",
    step1Desc: "Apply and become a member without paperwork in minutes.",
    step2Title: "Track Your Shares",
    step2Desc: "Track your shares, dividends, and earnings in real-time.",
    step3Title: "Vote and Participate",
    step3Desc: "Cast your vote digitally and shape the future of your cooperative.",

    prodActionTitle: "PRODUCT IN ACTION",
    prodActionSubtitle: "Invest in things that matter to you.",

    energyCoop: "ENERGY COOPERATIVE",
    energyCoopDesc: "Community-owned solar park in Bavaria. 2.4 MW clean energy capacity across 3 rooftop installations. Regulated under GenG.",
    housingCoop: "Housing Cooperative",
    housingCoopDesc: "Affordable co-owned housing in Hamburg. Members gain permanent tenancy rights and democratic say in all property decisions.",
    consumerCoop: "CONSUMER COOPERATIVE",
    consumerCoopDesc: "Organic food cooperative in Munich. Members share purchasing power, get preferential pricing, and vote on product selection.",

    minShare: "Min share",
    members: "Members",
    benefitType: "Benefit type",
    benefitTypeEnergy: "Distribution p.a.",
    tenancy: "Tenancy",
    discount: "Discount",
    organicFood: "Organic food",

    ctaTitle: "Ready to become a co-owner?",
    ctaSubtitle: "Free to register. Discover cooperatives near you in minutes.",
    btnExploreCoops: "Explore Cooperatives",
    btnRegisterFree: "Register Free",
    ctaFooterText: "Free to register · No hidden fees · Your data belongs to you"
  }
};

const ForMember = () => {
  const { language } = useLanguage();

  const currentLang = language === "de" ? "de" : "en";
  const pageT = (key) => localTranslations[currentLang]?.[key] || key;

  return (
    <div className="w-full transition-colors duration-300 bg-white dark:bg-slate-900 font-inter">

      {/* HERO SECTION */}
      <ForMemberHero />

      {/* FEATURES & MOCK DASHBOARD SECTION */}
      <ForMemberFeatures />

      {/* HOW IT WORKS SECTION */}
      <ForMemberSteps />

      {/* TRUST AND TRANSPARENCY SECTION */}
      <ForMemberTrust />

      {/* COOPERATIVES IN ACTION (PRODUCT IN ACTION) */}
      <section className="bg-[#d8d4d484] py-20 bg-white border-b dark:bg-slate-900 border-slate-100 dark:border-slate-800">
        <div className="container px-6 mx-auto sm:px-8 lg:px-12">

          <div className="mb-16 space-y-3 text-center">
            <span className="text-xs font-bold text-[#c80652] tracking-widest uppercase block">
              {pageT("prodActionTitle")}
            </span>
            <h2 className="font-serif text-3xl font-extrabold sm:text-4xl text-slate-900 dark:text-slate-100">
              {pageT("prodActionSubtitle")}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">

            {/* Card 1: Energy */}
            <div className="flex flex-col justify-between overflow-hidden transition-all duration-300 bg-white border shadow-lg dark:bg-slate-800 rounded-3xl border-slate-200/50 dark:border-slate-700/50 hover:-translate-y-1 hover:shadow-xl">
              <div>
                <div className="relative flex items-end p-6 h-28 bg-gradient-to-br from-amber-400 to-amber-500/40">
                  <div className="absolute flex items-center justify-center p-2 rounded-full top-4 right-4 bg-white/20 backdrop-blur-sm shrink-0">
                    <Sun className="w-5 h-5 text-amber-950" />
                  </div>
                  <span className="block px-3 py-1 text-xs font-bold tracking-wider uppercase rounded-full text-amber-950 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
                    {pageT("energyCoop")}
                  </span>
                </div>
                <div className="p-6 space-y-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    EnergieCoop Bayern eG
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {pageT("energyCoopDesc")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-6 text-xs text-center border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <span className="block font-mono text-sm font-extrabold text-slate-800 dark:text-slate-200">$100</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{pageT("minShare")}</span>
                </div>
                <div>
                  <span className="block font-mono text-sm font-extrabold text-slate-800 dark:text-slate-200">820</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{pageT("members")}</span>
                </div>
                <div>
                  <span className="block font-mono text-sm font-extrabold text-slate-800 dark:text-slate-200 text-emerald-500">2.4%</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate block">{pageT("benefitTypeEnergy")}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Housing */}
            <div className="flex flex-col justify-between overflow-hidden transition-all duration-300 bg-white border shadow-lg dark:bg-slate-800 rounded-3xl border-slate-200/50 dark:border-slate-700/50 hover:-translate-y-1 hover:shadow-xl">
              <div>
                <div className="relative flex items-end p-6 h-28 bg-gradient-to-br from-indigo-500 to-indigo-650/40">
                  <div className="absolute flex items-center justify-center p-2 rounded-full top-4 right-4 bg-white/20 backdrop-blur-sm shrink-0">
                    <HomeIcon className="w-5 h-5 text-indigo-950" />
                  </div>
                  <span className="block px-3 py-1 text-xs font-bold tracking-wider uppercase rounded-full text-indigo-950 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
                    {pageT("housingCoop")}
                  </span>
                </div>
                <div className="p-6 space-y-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Paradise Society
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {pageT("housingCoopDesc")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-6 text-xs text-center border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <span className="block font-mono text-sm font-extrabold text-slate-800 dark:text-slate-200">$500</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{pageT("minShare")}</span>
                </div>
                <div>
                  <span className="block font-mono text-sm font-extrabold text-slate-800 dark:text-slate-200">1,400</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{pageT("members")}</span>
                </div>
                <div>
                  <span className="block text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{pageT("tenancy")}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate block">{pageT("benefitType")}</span>
                </div>
              </div>
            </div>

            {/* Card 3: Organic Food */}
            <div className="flex flex-col justify-between overflow-hidden transition-all duration-300 bg-white border shadow-lg dark:bg-slate-800 rounded-3xl border-slate-200/50 dark:border-slate-700/50 hover:-translate-y-1 hover:shadow-xl">
              <div>
                <div className="relative flex items-end p-6 h-28 bg-gradient-to-br from-emerald-500 to-emerald-650/40">
                  <div className="absolute flex items-center justify-center p-2 rounded-full top-4 right-4 bg-white/20 backdrop-blur-sm shrink-0">
                    <Apple className="w-5 h-5 text-emerald-950" />
                  </div>
                  <span className="block px-3 py-1 text-xs font-bold tracking-wider uppercase rounded-full text-emerald-950 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
                    {pageT("consumerCoop")}
                  </span>
                </div>
                <div className="p-6 space-y-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {pageT("organicFood")}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {pageT("consumerCoopDesc")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-6 text-xs text-center border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <span className="block font-mono text-sm font-extrabold text-slate-800 dark:text-slate-200">$250</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{pageT("minShare")}</span>
                </div>
                <div>
                  <span className="block font-mono text-sm font-extrabold text-slate-800 dark:text-slate-200">340</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{pageT("members")}</span>
                </div>
                <div>
                  <span className="block text-sm font-extrabold text-emerald-600 dark:text-emerald-450">{pageT("discount")}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate block">{pageT("benefitType")}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA FINAL SIGNUP SECTION */}
      <ForMemberCTA />

    </div>
  );
};

export default ForMember;