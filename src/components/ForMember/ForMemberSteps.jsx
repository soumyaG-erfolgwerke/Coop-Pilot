"use client";

import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowDown } from "lucide-react";

// Import images from assets/images-V2
import step1Icon from "@/assets/images-V2/11856186 1.png";
import step2Icon from "@/assets/images-V2/11856186 1-1.png";
import step3Icon from "@/assets/images-V2/team.png";

// Import SVG arrows from assets/icons-V2
import arrowLeftIcon from "@/assets/icons-V2/Arrow 2.svg";
import arrowRightIcon from "@/assets/icons-V2/Arrow 3.svg";

const localTranslations = {
  de: {
    howItWorksTitlePart1: "Wie die Mitgliedschaft ",
    howItWorksTitlePart2: "einfach wird",
    step1Title: "Digital beitreten",
    step1Desc: "Beantragen Sie Ihre Mitgliedschaft ganz ohne Papierkram digital.",
    step2Title: "Anteile verfolgen",
    step2Desc: "Überwachen Sie Eigentumsrechte, Updates und Beiträge.",
    step3Title: "Abstimmen & Mitwirken",
    step3Desc: "Beteiligen Sie sich an Entscheidungen und Aktivitäten.",
  },
  en: {
    howItWorksTitlePart1: "How membership becomes ",
    howItWorksTitlePart2: "simple",
    step1Title: "Join Digitally",
    step1Desc: "Apply and become a member without paperwork.",
    step2Title: "Track Your Shares",
    step2Desc: "Monitor ownership, updates, and contributions.",
    step3Title: "Vote & Stay Updated",
    step3Desc: "Stay involved in decisions and cooperative activities.",
  }
};

export const ForMemberSteps = () => {
  const { language } = useLanguage();
  const currentLang = language === "de" ? "de" : "en";
  const pageT = (key) => localTranslations[currentLang]?.[key] || key;

  return (
    <section className="py-20 bg-[#eee0ff] dark:bg-indigo-950/20 border-b border-indigo-200/20 dark:border-slate-800 transition-colors duration-300">
      <div className="container px-6 mx-auto sm:px-8 lg:px-12 max-w-7xl">

        {/* Section Header */}
        <h2 className="mb-20 font-serif text-4xl sm:text-5xl font-normal text-center text-[#263238] dark:text-slate-100 leading-tight">
          {pageT("howItWorksTitlePart1")}
          <span className="font-sans font-black text-4xl sm:text-5xl text-[#7d0434] dark:text-[#ff7aa3] block sm:inline mt-2 sm:mt-0">
            {pageT("howItWorksTitlePart2")}
          </span>
        </h2>

        {/* Steps Grid */}
        <div className="flex flex-col items-center justify-between max-w-5xl gap-8 mx-auto md:flex-row md:gap-4">

          {/* Step 1 */}
          <div className="flex flex-col items-center text-center space-y-4 max-w-[280px] w-full group">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-sans group-hover:text-[#7d0434] dark:group-hover:text-[#ff7aa3] transition-colors duration-300">
              {pageT("step1Title")}
            </h3>
            <div className="flex items-center justify-center p-4 transition-all duration-300 shadow-sm w-28 h-28 shrink-0 bg-white/40 dark:bg-slate-800/40 rounded-3xl group-hover:scale-105 group-hover:shadow-md">
              <img
                className="object-contain w-full h-full"
                alt="Join Digitally"
                src={step3Icon.src || step3Icon}
              />
            </div>
            <p className="font-sans text-base leading-relaxed text-slate-700 dark:text-slate-350">
              {pageT("step1Desc")}
            </p>
          </div>

          {/* Arrow 1 */}
          <div className="items-center justify-center hidden w-20 md:flex shrink-0 lg:w-28">
            <img
              className="object-contain w-full opacity-70 dark:invert dark:opacity-50"
              alt="Next"
              src={arrowLeftIcon.src || arrowLeftIcon}
            />
          </div>
          {/* Mobile Arrow 1 */}
          <div className="flex items-center justify-center py-2 md:hidden text-slate-400 dark:text-slate-500">
            <ArrowDown className="w-6 h-6 animate-bounce" />
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center space-y-4 max-w-[280px] w-full group">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-sans group-hover:text-[#7d0434] dark:group-hover:text-[#ff7aa3] transition-colors duration-300">
              {pageT("step2Title")}
            </h3>
            <div className="flex items-center justify-center p-4 transition-all duration-300 shadow-sm w-28 h-28 shrink-0 bg-white/40 dark:bg-slate-800/40 rounded-3xl group-hover:scale-105 group-hover:shadow-md">
              <img
                className="object-contain w-full h-full"
                alt="Track Your Shares"
                src={step2Icon.src || step2Icon}
              />
            </div>
            <p className="font-sans text-base leading-relaxed text-slate-700 dark:text-slate-350">
              {pageT("step2Desc")}
            </p>
          </div>

          {/* Arrow 2 */}
          <div className="items-center justify-center hidden w-20 md:flex shrink-0 lg:w-28">
            <img
              className="object-contain w-full opacity-70 dark:invert dark:opacity-50"
              alt="Next"
              src={arrowRightIcon.src || arrowRightIcon}
            />
          </div>
          {/* Mobile Arrow 2 */}
          <div className="flex items-center justify-center py-2 md:hidden text-slate-400 dark:text-slate-500">
            <ArrowDown className="w-6 h-6 animate-bounce" />
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center space-y-4 max-w-[290px] w-full group">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-sans group-hover:text-[#7d0434] dark:group-hover:text-[#ff7aa3] transition-colors duration-300">
              {pageT("step3Title")}
            </h3>
            <div className="flex items-center justify-center p-4 transition-all duration-300 shadow-sm w-28 h-28 shrink-0 bg-white/40 dark:bg-slate-800/40 rounded-3xl group-hover:scale-105 group-hover:shadow-md">
              <img
                className="object-contain w-full h-full"
                alt="Vote & Stay Updated"
                src={step1Icon.src || step1Icon}
              />
            </div>
            <p className="font-sans text-base leading-relaxed text-slate-700 dark:text-slate-350">
              {pageT("step3Desc")}
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ForMemberSteps;
