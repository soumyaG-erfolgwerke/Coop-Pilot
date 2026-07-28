"use client";

import React from "react";
import SectionWrapper from "./components/SectionWrapper";
import { useLanguage } from "@/contexts/LanguageContext";

const HowWeStart = () => {
  const { language } = useLanguage();

  const timelineData = {
    tag: language === "de" ? "Unsere Geschichte (Kurz)" : "Our Story (Brief)",
    title: language === "de" ? "Die Wurzeln der Kooperation." : "The roots of cooperation.",
    description: language === "de"
      ? "Wir haben mit einer einfachen Idee begonnen: Genossenschaften verdienen moderne Tools, die ihre besonderen Werte respektieren."
      : "We began with a simple idea: that cooperatives deserve modern tools that respect their unique values.",
    events: [
      {
        year: "2021",
        title: language === "de" ? "Der Funke & Die Vision" : "The Spark & Vision",
        description: language === "de"
          ? "CoopPilot begann mit einer Gruppe technologiebegeisterter Genossenschaftsorganisatoren, denen eine eklatante Lücke auffiel: Moderne Software ist für Konzerne gebaut, nicht für Gemeinschaften."
          : "CoopPilot began with a group of tech-savvy cooperative organizers who noticed a gaping hole: modern software is built for corporations, not communities.",
      },
      {
        year: "2022",
        title: language === "de" ? "Das Fundament legen" : "Building the Foundation",
        description: language === "de"
          ? "Entwicklung von Kernmodulen für Mitgliederregister, Abstimmungssysteme und Anteilsverwaltung mit Feedback von Beta-Testern."
          : "Developed core modules for member registries, voting systems, and share management with feedback from beta testers.",
      },
      {
        year: "2023",
        title: language === "de" ? "Start & Expansion" : "Launch & Expansion",
        description: language === "de"
          ? "Einführung unserer ersten öffentlichen Version, die Dutzenden von Agrar- und Wohnungsgenossenschaften bei der Digitalisierung ihrer Abläufe half."
          : "Launched our first public version, helping dozens of agricultural and housing co-ops digitize operations.",
      },
      {
        year: "2024",
        title: language === "de" ? "Die moderne Ära" : "Modern Era",
        description: language === "de"
          ? "Einführung fortschrittlicher Governance-Tools, mobilem Zugriff und Integrationen, um CoopPilot zur weltweiten Plattform für Genossenschaften zu machen."
          : "Introducing advanced governance tools, mobile access, and integrations to make CoopPilot the global platform for co-ops.",
      },
    ],
  };

  return (
    <SectionWrapper
      wrapperClassName="bg-[#043e44] text-white py-16 md:py-24"
      className="px-6 md:px-12 lg:px-16"
      padding={false}
    >
      <div className="flex flex-col w-full gap-12 md:gap-16">
        {/* Header */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto gap-4">
          <span className="text-sm sm:text-base font-bold tracking-wider uppercase text-[#facc15] font-dmsans">
            {timelineData.tag}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium leading-tight font-abhaya">
            {timelineData.title}
          </h2>
          <p className="text-base sm:text-lg text-teal-100/70 font-dmsans max-w-xl">
            {timelineData.description}
          </p>
        </div>

        {/* Timeline Layout */}
        <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center mt-4">
          {/* Vertical Connecting Line */}
          <div className="absolute left-4 md:left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-0.5 bg-teal-800" />

          {timelineData.events.map((event, index) => {
            const isEven = index % 2 === 0;
            return (
              <div
                key={index}
                className={`relative flex flex-col md:flex-row w-full mb-10 md:mb-12 last:mb-0 justify-between items-start md:items-center ${
                  isEven ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* Timeline Card */}
                <div className="w-full md:w-[45%] pl-10 md:pl-0">
                  <div className="bg-[#054b52] border border-teal-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-3 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <span className="text-xl sm:text-2xl font-bold text-[#facc15] font-dmsans">
                      {event.year} — {event.title}
                    </span>
                    <p className="text-sm sm:text-base leading-relaxed text-teal-50/80 font-dmsans">
                      {event.description}
                    </p>
                  </div>
                </div>

                {/* Timeline Bullet Point */}
                <div className="absolute left-4 md:left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#facc15] border-4 border-[#043e44] shadow-[0_0_0_4px_rgba(250,204,21,0.2)]" />
                </div>

                {/* Empty block on the opposite side for spacing on desktop */}
                <div className="hidden md:block w-[45%]" />
              </div>
            );
          })}
        </div>
      </div>
    </SectionWrapper>
  );
};

export default HowWeStart;