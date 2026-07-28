"use client";

import React from "react";
import SectionWrapper from "./components/SectionWrapper";
import { useLanguage } from "@/contexts/LanguageContext";

const Legacy = () => {
  const { language } = useLanguage();

  const legacyData = {
    tag: language === "de" ? "Erbe" : "Legacy",
    title: language === "de" ? "Die Menschen, die die Bewegung geprägt haben." : "The people who shaped the movement.",
    people: [
      {
        name: "Charles Fourier",
        description: language === "de"
          ? "Früher Theoretiker, der sich selbstverwaltete Gemeinschaften vorstellte und damit den Grundstein für die moderne Genossenschaftstheorie legte."
          : "Early theorist who envisioned self-governing communities, laying the groundwork for modern cooperative theory.",
        bgColor: "bg-[#e5fcf4]",
        textColor: "text-[#0e5c46]",
        borderColor: "border-[#b5ecd8]",
      },
      {
        name: "William King",
        description: language === "de"
          ? "Genossenschaftlicher Arzt, der die praktische Verbraucherkooperation förderte und einflussreiche Zeitschriften zur Aufklärung von Mitgliedergemeinschaften herausgab."
          : "Cooperative physician who promoted practical consumer cooperation, publishing influential journals to educate member communities.",
        bgColor: "bg-[#f5eefc]",
        textColor: "text-[#581c87]",
        borderColor: "border-[#ebdcf9]",
      },
      {
        name: "Robert Owen",
        description: language === "de"
          ? "Pionier früher Arbeits- und Wohnungsreformen, der zeigte, dass genossenschaftliche Unternehmen florieren und gleichzeitig die Menschenwürde achten können."
          : "Pioneered early labor and housing reforms, demonstrating that cooperative businesses could thrive while respecting human dignity.",
        bgColor: "bg-[#eaf1ff]",
        textColor: "text-[#1d4ed8]",
        borderColor: "border-[#d1e3ff]",
      },
    ],
  };

  return (
    <SectionWrapper
      wrapperClassName="bg-white py-16 md:py-24"
      className="px-6 md:px-12 lg:px-16"
      padding={false}
    >
      <div className="flex flex-col w-full gap-10 md:gap-16">
        {/* Header */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto gap-3">
          <span className="text-sm sm:text-base font-bold tracking-wider uppercase text-[#a2185b] font-dmsans">
            {legacyData.tag}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium leading-tight text-[#043e44] font-abhaya">
            {legacyData.title}
          </h2>
        </div>

        {/* Legacy Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 w-full">
          {legacyData.people.map((person, index) => (
            <div
              key={index}
              className={`border ${person.borderColor} ${person.bgColor} ${person.textColor} rounded-2xl p-6 sm:p-8 flex flex-col gap-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300`}
            >
              <h3 className="text-xl sm:text-2xl font-bold font-abhaya">
                {person.name}
              </h3>
              <p className="text-sm sm:text-base leading-relaxed opacity-90 font-dmsans">
                {person.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

export default Legacy;