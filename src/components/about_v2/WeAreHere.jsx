"use client";

import React from "react";
import SectionWrapper from "./components/SectionWrapper";
import WhoWeAreImage from "@/assets/images/about/who_we_are.png";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";

const WeAreHere = () => {
  const { language } = useLanguage();

  const whoWeAreData = {
    title: language === "de" ? "Wer wir sind" : "Who we are",
    description: language === "de"
      ? "CoopPilot wird von einem Team aus Genossenschaftsexperten, Softwareentwicklern und Community-Leadern entwickelt, die daran glauben, dass die Zukunft der Genossenschaften digital ist. Gemeinsam bauen wir die passende Technologie für die nächste Generation von Genossenschaften."
      : "CoopPilot is built by a team of co-op experts, tech developers, and community leaders who believe that the future of cooperatives is digital. Together, we are building the right technology for the next generation of cooperatives.",
  };

  return (
    <SectionWrapper
      wrapperClassName="bg-white min-h-[50vh] flex items-center py-12 md:py-20"
      className="px-6 md:px-12 lg:px-16"
      padding={false}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 lg:gap-16 items-center w-full">
        {/* Text Column */}
        <div className="md:col-span-6 flex flex-col gap-4 text-left order-2 md:order-1">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium leading-tight text-[#043e44] font-abhaya">
            {whoWeAreData.title}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl leading-relaxed text-gray-600 font-dmsans max-w-xl">
            {whoWeAreData.description}
          </p>
        </div>

        {/* Image Column */}
        <div className="md:col-span-6 flex justify-center items-center order-1 md:order-2">
          <div className="relative w-full aspect-[4/3] max-w-[500px] overflow-hidden rounded-2xl">
            <Image
              src={WhoWeAreImage}
              alt="Who We Are"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default WeAreHere;