"use client";
import React, { useState } from "react";
import SectionWrapper from "@/components/about_v2/components/SectionWrapper";
import { useLanguage } from "@/contexts/LanguageContext";

const ROICalculator = () => {
  // Default values to match the mockup examples:
  // Members = 286, Hours = 32
  const [members, setMembers] = useState(286);
  const [hours, setHours] = useState(32);
  const { language } = useLanguage();

  // Formulas based on provided guidelines:
  // 1. Total current admin cost (labor) = Members * Hours/member * €30
  const totalAdminCost = members * hours * 30;

  // 2. Hours saved per year = Members * Hours/member * 0.72 (≈72% automation)
  const hoursSaved = Math.round(members * hours * 0.72);

  // 3. € value of hours saved = Hours saved * €30
  const savingsValue = hoursSaved * 30;

  return (
    <SectionWrapper
      wrapperClassName="bg-[#fceae2]/60 py-16 md:py-24 border-t border-b border-[#fceae2]"
      className="px-6 md:px-12 lg:px-16"
      padding={false}
    >
      <div className="flex flex-col items-center w-full max-w-5xl gap-10 mx-auto">
        {/* Header */}
        <div className="flex flex-col max-w-2xl gap-3 text-center">
          <span className="text-xs font-bold tracking-wider uppercase text-primary sm:text-sm">
            {language === "de" ? "Effizienz- & ROI-Rechner" : "ROI & Efficiency Calculator"}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-[#043e44] font-abhaya leading-tight">
            {language === "de" ? "Was kostet analoge Verwaltung wirklich?" : "What does analogue administration really cost?"}
          </h2>
          <p className="text-sm text-gray-500 sm:text-base font-dmsans">
            {language === "de"
              ? "Vergleichen Sie den aktuellen Verwaltungsaufwand Ihrer Genossenschaft mit der Automatisierungskraft von CoopPilot."
              : "See your cooperative's current administrative overhead compared with the automation power of CoopPilot."}
          </p>
        </div>

        {/* Calculator Widget Box */}
        <div className="flex flex-col w-full gap-8 p-6 bg-white border shadow-xl rounded-2xl border-slate-100 sm:p-8 md:p-10 sm:gap-10">
          {/* Sliders Container */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 sm:gap-10">
            {/* Slider 1: Members */}
            <div className="flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between font-dmsans">
                <label className="text-sm font-bold text-[#043e44] tracking-wide uppercase">
                  {language === "de" ? "Anzahl der Mitglieder" : "Number of Members"}
                </label>
                <span className="text-lg font-bold text-primary bg-[#ffeff5] px-3 py-1 rounded-lg border border-primary/10">
                  {members}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                value={members}
                onChange={(e) => setMembers(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#7c0a29] transition-all hover:bg-slate-200"
              />
              <div className="flex justify-between text-xs font-medium text-gray-400">
                <span>{language === "de" ? "10 Mitglieder" : "10 members"}</span>
                <span>{language === "de" ? "1.000 Mitglieder" : "1,000 members"}</span>
              </div>
            </div>

            {/* Slider 2: Hours */}
            <div className="flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between font-dmsans">
                <label className="text-sm font-bold text-[#043e44] tracking-wide uppercase">
                  {language === "de" ? "Durchschnittlich aufgewendete Stunden" : "Average Hours Spent"}
                </label>
                <span className="text-lg font-bold text-primary bg-[#ffeff5] px-3 py-1 rounded-lg border border-primary/10">
                  {hours}h
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="100"
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#7c0a29] transition-all hover:bg-slate-200"
              />
              <div className="flex justify-between text-xs font-medium text-gray-400">
                <span>{language === "de" ? "2 Stunden / Mitglied / Jahr" : "2 hours / member / yr"}</span>
                <span>{language === "de" ? "100 Stunden / Mitglied / Jahr" : "100 hours / member / yr"}</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-slate-100" />

          {/* Results Container */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 font-dmsans">
            {/* Card 1: Total current admin cost */}
            <div className="flex flex-col justify-between p-5 transition-shadow border rounded-2xl bg-red-50/40 border-red-100/60 hover:shadow-md">
              <div className="flex flex-col gap-1">
                <span className="text-2xl sm:text-3xl font-bold text-[#7c0a29] font-abhaya tracking-tight">
                  €{totalAdminCost.toLocaleString(language === "de" ? "de-DE" : "en-US")}
                </span>
                <span className="mt-1 text-xs font-bold tracking-wider text-gray-700 uppercase">
                  {language === "de" ? "Aktuelle Verwaltungskosten" : "Current Admin Cost"}
                </span>
                <span className="text-[11px] text-gray-400 font-medium leading-normal mt-0.5">
                  {language === "de"
                    ? "Geschätzter Arbeitsaufwand ohne digitale Automatisierung."
                    : "Estimated labor expense without digital automation."}
                </span>
              </div>
            </div>

            {/* Card 2: Hours saved per year */}
            <div className="flex flex-col justify-between p-5 transition-shadow border rounded-2xl bg-emerald-50/40 border-emerald-100/60 hover:shadow-md">
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold tracking-tight sm:text-3xl text-emerald-600 font-abhaya">
                  {hoursSaved.toLocaleString(language === "de" ? "de-DE" : "en-US")}h
                </span>
                <span className="mt-1 text-xs font-bold tracking-wider text-gray-700 uppercase">
                  {language === "de" ? "Eingesparte Stunden / Jahr" : "Hours Saved / Year"}
                </span>
                <span className="text-[11px] text-gray-400 font-medium leading-normal mt-0.5">
                  {language === "de"
                    ? "Eingesparte Zeit durch automatisierte Verwaltungsabläufe (≈72%)."
                    : "Time reclaimed through automated administrative workflows (≈72%)."}
                </span>
              </div>
            </div>

            {/* Card 3: Value of hours saved */}
            <div className="flex flex-col justify-between p-5 transition-shadow border rounded-2xl bg-emerald-50/40 border-emerald-100/60 hover:shadow-md">
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold tracking-tight sm:text-3xl text-emerald-600 font-abhaya">
                  €{savingsValue.toLocaleString(language === "de" ? "de-DE" : "en-US")}
                </span>
                <span className="mt-1 text-xs font-bold tracking-wider text-gray-700 uppercase">
                  {language === "de" ? "Jährliche Einsparungen (€)" : "Annual Savings (€)"}
                </span>
                <span className="text-[11px] text-gray-400 font-medium leading-normal mt-0.5">
                  {language === "de"
                    ? "Finanzieller Gegenwert der eingesparten Stunden, freigesetzt für das Genossenschaftswachstum."
                    : "Financial value of hours saved, reallocated to cooperative growth."}
                </span>
              </div>
            </div>

            {/* Card 4: Cost per member (platform fee) */}
            <div className="flex flex-col justify-between p-5 transition-shadow border rounded-2xl bg-slate-50/60 border-slate-200/60 hover:shadow-md">
              <div className="flex flex-col gap-1">
                <span className="text-2xl sm:text-3xl font-bold text-[#043e44] font-abhaya tracking-tight">
                  {language === "de" ? "1 Monat" : "1 Month"}
                </span>
                <span className="mt-1 text-xs font-bold tracking-wider text-gray-700 uppercase">
                  {language === "de" ? "Onboarding- & Setup-Zeit" : "Onboarding & Setup Time"}
                </span>
                <span className="text-[11px] text-gray-400 font-medium leading-normal mt-0.5">
                  {language === "de"
                    ? "Durchschnittliche Übergangsgeschwindigkeit zum digitalen OS"
                    : "Average transition speed to digital OS"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default ROICalculator;
