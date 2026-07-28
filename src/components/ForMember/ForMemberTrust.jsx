"use client";

import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Plus } from "lucide-react";

// Import trust illustration from assets/images-V2
import amicoIllustration from "@/assets/images-V2/amico.svg";

const localTranslations = {
  de: {
    trustTitlePart1: "Gebaut für Vertrauen und ",
    trustTitlePart2: "Transparenz",
    featureSecure: "Sichere Aufzeichnungen",
    featureVerified: "Verifiziertes Eigentum",
    featureInstant: "Sofortige Updates",
    featureClear: "Klare Kommunikation",
  },
  en: {
    trustTitlePart1: "Built for trust and ",
    trustTitlePart2: "transparency",
    featureSecure: "Secure Records",
    featureVerified: "Verified Ownership",
    featureInstant: "Instant Updates",
    featureClear: "Clear Communication",
  }
};

export const ForMemberTrust = () => {
  const { language } = useLanguage();
  const currentLang = language === "de" ? "de" : "en";
  const pageT = (key) => localTranslations[currentLang]?.[key] || key;

  const trustFeatures = [
    { key: "featureSecure", text: pageT("featureSecure") },
    { key: "featureVerified", text: pageT("featureVerified") },
    { key: "featureInstant", text: pageT("featureInstant") },
    { key: "featureClear", text: pageT("featureClear") },
  ];

  return (
    <section className="bg-[#Fffef] min-h-[calc(100vh-64px)] flex items-center py-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
      <div className="container px-6 mx-auto sm:px-8 lg:px-12 max-w-7xl">
        <div className="grid items-center grid-cols-1 gap-16 lg:grid-cols-12">

          {/* Left Column: Title and Features Card */}
          <div className="space-y-10 lg:col-span-6">
            <h2 className="font-serif text-4xl font-normal leading-tight sm:text-5xl text-slate-900 dark:text-slate-100">
              {pageT("trustTitlePart1")}
              <span className="font-sans font-black text-4xl sm:text-5xl text-[#7d0434] dark:text-[#ff7aa3] block sm:inline mt-2 sm:mt-0">
                {pageT("trustTitlePart2")}
              </span>
            </h2>

            {/* Features Container Card */}
            <div className="bg-[#e0e0e0]/40 dark:bg-slate-850 p-8 sm:p-10 rounded-[24px] border border-slate-200/50 dark:border-slate-850/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)] space-y-6 max-w-lg">
              {trustFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-6 group">
                  {/* Plus Icon Badge */}
                  <div className="w-10 h-10 rounded-full bg-[#b5b5b5]/30 dark:bg-slate-700/50 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-[#7d0434]/20 group-hover:text-[#7d0434] dark:group-hover:text-[#ff7aa3] transition-all duration-300">
                    <Plus className="w-5 h-5 text-slate-800 dark:text-slate-200 group-hover:text-inherit" />
                  </div>
                  {/* Feature Text */}
                  <span className="font-sans text-xl font-bold tracking-tight sm:text-2xl text-slate-900 dark:text-slate-100">
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Amico Illustration */}
          <div className="flex justify-center lg:col-span-6 lg:justify-end">
            <div className="w-full max-w-[620px]">
              <img
                className="w-full h-auto object-contain drop-shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
                alt="Mobile login amico"
                src={amicoIllustration.src || amicoIllustration}
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ForMemberTrust;
