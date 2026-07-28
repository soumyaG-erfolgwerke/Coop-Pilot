"use client";

import React from "react";
import SectionWrapper from "./components/SectionWrapper";
import Image from "next/image";
import BundesministeriumLogo from "@/assets/icons-V2/partner1.svg";
import ImmateriellesKulturerbeLogo from "@/assets/icons-V2/partner3.svg";
import { useLanguage } from "@/contexts/LanguageContext";

const OurPartners = () => {
  const { language } = useLanguage();

  const partnerData = {
    title: language === "de" ? "Unsere Partner" : "Our Partners",
    partners: [
      {
        name: "Bundesministerium für Wirtschaft und Klimaschutz",
        type: "svg_file",
        src: BundesministeriumLogo,
        alt: "Bundesministerium für Wirtschaft und Klimaschutz",
      },
      {
        name: "IBYUS",
        type: "inline_svg",
        render: () => (
          <svg
            viewBox="0 0 140 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full max-h-12"
          >
            <path
              d="M10 25C10 15 22 15 22 25"
              stroke="#A2185B"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M16 20C16 12 32 12 32 25"
              stroke="#D48CB9"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <text
              x="42"
              y="26"
              fill="#A2185B"
              fontFamily="system-ui, sans-serif"
              fontWeight="900"
              fontSize="20"
              letterSpacing="0.8"
            >
              IBYUS
            </text>
          </svg>
        ),
      },
      {
        name: "Immaterielles Kulturerbe",
        type: "svg_file",
        src: ImmateriellesKulturerbeLogo,
        alt: "Immaterielles Kulturerbe",
      },
      {
        name: "SAARLAND",
        type: "inline_svg",
        render: () => (
          <svg
            viewBox="0 0 150 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full max-h-12"
          >
            <path
              d="M5 8 Q 40 2, 75 8 T 145 6"
              stroke="#007ED6"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M8 12 Q 43 6, 78 12 T 148 10"
              stroke="#FACC15"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M11 16 Q 46 10, 81 16 T 151 14"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <text
              x="5"
              y="32"
              fill="#0F172A"
              fontFamily="system-ui, sans-serif"
              fontWeight="800"
              fontSize="16"
              letterSpacing="1"
            >
              SAARLAND
            </text>
          </svg>
        ),
      },
    ],
  };

  // Duplicate the list of partners to create a seamless infinite loop
  const scrollList = [...partnerData.partners, ...partnerData.partners];

  return (
    <SectionWrapper
      wrapperClassName="bg-white py-12 md:py-16 overflow-hidden"
      className="px-6 md:px-12 lg:px-16"
      padding={false}
    >
      <div className="flex flex-col items-center w-full gap-8 md:gap-10">
        {/* Title */}
        <h2 className="text-2xl font-medium tracking-wide text-center text-gray-500 sm:text-3xl font-abhaya">
          {partnerData.title}
        </h2>

        {/* Outer Scrolling Container */}
        <div className="relative w-full max-w-5xl py-4 overflow-hidden mask-gradient-x">
          {/* Fading side gradients for smooth fade-in/out appearance */}
          <div className="absolute inset-y-0 left-0 z-10 w-8 pointer-events-none sm:w-16 bg-gradient-to-r from-white to-transparent" />
          <div className="absolute inset-y-0 right-0 z-10 w-8 pointer-events-none sm:w-16 bg-gradient-to-l from-white to-transparent" />

          {/* Inner Animated Track */}
          <div className="flex w-max animate-marquee hover:[animation-play-state:paused] gap-12 sm:gap-20">
            {scrollList.map((partner, index) => (
              <div
                key={index}
                className="flex justify-center items-center w-[150px] sm:w-[200px] h-12 sm:h-16 grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all duration-300 transform hover:scale-105 flex-shrink-0 cursor-pointer"
                title={partner.name}
              >
                {partner.type === "svg_file" ? (
                  <div className="relative w-full h-full max-h-12 aspect-[4/1]">
                    <Image
                      src={partner.src}
                      alt={partner.alt}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  partner.render()
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default OurPartners;