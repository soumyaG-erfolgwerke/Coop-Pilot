"use client";

import React from "react";
import SectionWrapper from "./components/SectionWrapper";
import { useLanguage } from "@/contexts/LanguageContext";

const CoopRoot = () => {
  const { language } = useLanguage();

  const principlesData = {
    tag: language === "de" ? "Die Prinzipien, die alles leiten." : "The principles that guide everything.",
    title: language === "de" ? "Die Prinzipien, die alles leiten." : "The principles that guide everything.",
    items: [
      {
        title: language === "de" ? "Transparenz" : "Transparency",
        description: language === "de"
          ? "Open-Source-Werte im Kern. Der Code ist offen, Prozesse sind öffentlich, Entscheidungen sind demokratisch."
          : "Open source values at the core. Code is open, processes are public, decisions are democratic.",
      },
      {
        title: language === "de" ? "Beteiligung" : "Participation",
        description: language === "de"
          ? "Aktive Beteiligung. Wir entwickeln Tools, die Mitglieder zu aktiven Teilnehmern machen, nicht nur zu Konsumenten."
          : "Active participation. We design tools to make members active participants, not just consumers.",
      },
      {
        title: language === "de" ? "Kooperation" : "Cooperation",
        description: language === "de"
          ? "Kooperation unter Genossenschaften. Wir bauen Ökosysteme auf, in denen Genossenschaften sich gegenseitig unterstützen und voneinander lernen."
          : "Cooperation among cooperatives. We build ecosystems where cooperatives support and learn from each other.",
      },
    ],
  };

  return (
    <SectionWrapper
      wrapperClassName="bg-[#fffae5] py-16 md:py-24"
      className="px-6 md:px-12 lg:px-16"
      padding={false}
    >
      <div className="flex flex-col w-full gap-10 md:gap-16">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto gap-3">
          <span className="text-sm sm:text-base font-bold tracking-wider uppercase text-[#a2185b] font-dmsans">
            {principlesData.tag}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium leading-tight text-[#043e44] font-abhaya">
            {principlesData.title}
          </h2>
        </div>

        {/* Principles Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 w-full">
          {principlesData.items.map((item, index) => (
            <div
              key={index}
              className="bg-[#fefdfa] border border-[#e6dfc3] rounded-2xl p-6 sm:p-8 flex flex-col gap-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
            >
              <h3 className="text-xl sm:text-2xl font-medium text-[#043e44] font-abhaya group-hover:text-[#a2185b] transition-colors duration-300">
                {item.title}
              </h3>
              <p className="text-sm sm:text-base leading-relaxed text-gray-600 font-dmsans">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

export default CoopRoot;