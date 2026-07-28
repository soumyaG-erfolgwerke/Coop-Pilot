"use client";

import React from "react";
import SectionWrapper from "./components/SectionWrapper";
import { useLanguage } from "@/contexts/LanguageContext";

const OurVision = () => {
  const { language } = useLanguage();

  const visionData = {
    tag: language === "de" ? "Unsere Vision" : "Our Vision",
    title: language === "de" 
      ? "Entwickelt, um genossenschaftliche Werte in die Zukunft zu tragen."
      : "Built to carry cooperative values forward.",
    description: language === "de"
      ? "Wir glauben, dass genossenschaftliche Werte nicht in veralteten Systemen, Papierkram und unzusammenhängenden Workflows verloren gehen sollten. CoopPilot überführt diese Werte in moderne digitale Abläufe — entwickelt für Klarheit, Teilhabe und langfristiges Wachstum."
      : "We believe cooperative values shouldn't be lost in outdated systems, paperwork, and disconnected workflows. CoopPilot transforms these values into modern digital operations — built for clarity, participation, and long-term growth.",
  };

  return (
    <SectionWrapper
      wrapperClassName="bg-[#7c0a29] text-white py-16 md:py-24"
      className="px-6 md:px-12 lg:px-16"
      padding={false}
    >
      <div className="flex flex-col items-center text-center max-w-4xl mx-auto gap-5 md:gap-7">
        {/* Tag */}
        <span className="text-sm sm:text-base font-bold tracking-wider uppercase text-[#facc15] font-dmsans">
          {visionData.tag}
        </span>

        {/* Title */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium leading-tight font-abhaya max-w-3xl">
          {visionData.title}
        </h2>

        {/* Description */}
        <p className="text-base sm:text-lg lg:text-xl leading-relaxed text-amber-50/80 font-dmsans max-w-3xl">
          {visionData.description}
        </p>
      </div>
    </SectionWrapper>
  );
};

export default OurVision;