"use client";

import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";

import onboardIcon from "@/assets/images-V2/onboard.png";
import trackIcon from "@/assets/images-V2/data-2.png";
import runIcon from "@/assets/images-V2/clock.png";
import decisionIcon from "@/assets/images-V2/shield.png";

export default function HowItWorksSection() {
  const { language } = useLanguage();

  const steps = [
    {
      title: language === "de" ? "SCHNELLER ONBOARDEN" : "ONBOARD FASTER",
      subtitle: language === "de" ? "Vom ersten Klick zur vollen Mitgliedschaft — in wenigen Minuten." : "From first click to full membership — in minutes.",
      description: language === "de"
        ? "Ersetzen Sie langsames, manuelles Onboarding durch einen einfachen digitalen Fluss. Erfassen Sie Mitgliederdetails, verifizieren Sie sofort."
        : "Replace slow, manual onboarding with a simple digital flow. Capture member details, verify instantly.",
      stat: "70%",
      statLabel: language === "de" ? "SCHNELLERES ONBOARDING" : "FASTER ONBOARDING",
      bg: "bg-white",
      subtitleColor: "text-[#5E6B7E]",
      desktopHeight: "lg:h-[500px]",
      icon: onboardIcon,
    },
    {
      title: language === "de" ? "ALLES TRACKEN" : "TRACK EVERYTHING",
      subtitle: language === "de" ? "Echtzeit-Sichtbarkeit in Ihrer gesamten Genossenschaft." : "Real-time visibility across your cooperative.",
      description: language === "de"
        ? "Ersetzen Sie langsames, manuelles Onboarding durch einen einfachen digitalen Fluss. Erfassen Sie Mitgliederdetails, verifizieren Sie sofort."
        : "Replace slow, manual onboarding with a simple digital flow. Capture member details, verify instantly.",
      stat: "95%",
      statLabel: language === "de" ? "DATENKAPAZITÄT" : "DATA CAPACITY",
      bg: "bg-[#D9F8E5]",
      subtitleColor: "text-[#3D6E4C]",
      desktopHeight: "lg:h-[580px]",
      icon: trackIcon,
    },
    {
      title: language === "de" ? "INTELLIGENTER ARBEITEN" : "RUN SMARTER",
      subtitle: language === "de" ? "Arbeiten Sie mit Klarheit statt Chaos." : "Operate with clarity, not chaos.",
      description: language === "de"
        ? "Ersetzen Sie langsames, manuelles Onboarding durch einen einfachen digitalen Fluss. Erfassen Sie Mitgliederdetails, verifizieren Sie sofort."
        : "Replace slow, manual onboarding with a simple digital flow. Capture member details, verify instantly.",
      stat: "80%",
      statLabel: language === "de" ? "WENIGER MANUELLE ARBEIT" : "LESS MANUAL WORK",
      bg: "bg-[#DDD4FF]",
      subtitleColor: "text-[#544780]",
      desktopHeight: "lg:h-[660px]",
      icon: runIcon,
    },
    {
      title: language === "de" ? "BESSERE ENTSCHEIDUNGEN TREFFEN" : "MAKE BETTER DECISIONS",
      subtitle: language === "de" ? "Klarheit in jedem Teil Ihrer Genossenschaft." : "Clarity across every part of your cooperative.",
      description: language === "de"
        ? "Ersetzen Sie langsames, manuelles Onboarding durch einen einfachen digitalen Fluss. Erfassen Sie Mitgliederdetails, verifizieren Sie sofort."
        : "Replace slow, manual onboarding with a simple digital flow. Capture member details, verify instantly.",
      stat: "3X",
      statLabel: language === "de" ? "SCHNELLERE ENTSCHEIDUNGEN" : "FASTER DECISIONS",
      bg: "bg-[#FFD8E6]",
      subtitleColor: "text-[#6B4654]",
      desktopHeight: "lg:h-[740px]",
      icon: decisionIcon,
    },
  ];

  return (
    <section className="bg-[#F8F7FB] py-12 md:py-24 pb-0 md:pb-0">
      <div className="px-4 pb-0 mx-auto max-w-7xl sm:px-6 md:px-10 lg:px-16">
        {/* Heading Section */}
        <div className="mb-10 lg:mb-20">
          <span className="text-xs font-bold tracking-wider text-gray-900 uppercase md:text-sm">
            {language === "de" ? "Wie es funktioniert" : "How it works"}
          </span>
          <h2 className="mt-3 max-w-2xl font-serif text-2xl md:text-4xl lg:text-5xl leading-[1.2] text-[#111625]">
            {language === "de"
              ? "Führen Sie Ihre gesamte Genossenschaft in einem nahtlosen Ablauf"
              : "Run your entire cooperative in one seamless flow"}
          </h2>
        </div>

        {/* Responsive Grid/Flex Container */}
        {/* Mobile: Space-separated bars | Desktop: Seamless attached blocks */}
        <div className="flex flex-col w-full gap-3 lg:flex-row lg:items-end lg:gap-0 lg:overflow-hidden lg:shadow-sm">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`
                ${step.bg}
                ${step.desktopHeight}
                w-full
                h-auto
                lg:flex-1
                flex
                flex-row
                lg:flex-col
                items-center
                lg:items-stretch
                justify-between
                p-5
                md:p-6
                lg:p-10
                
                lg:rounded-none
                shadow-sm
                lg:shadow-none
                transition-all
                duration-300
                hover:relative
                hover:z-10
                hover:shadow-xl
                lg:hover:-translate-y-2
              `}
            >
              {/* Text Area */}
              <div className="flex-1 pr-4 lg:pr-0">
                {/* Title */}
                <h3 className="text-sm md:text-base lg:text-lg font-extrabold tracking-tight leading-tight text-[#111625]">
                  {step.title}
                </h3>

                {/* Subtitle */}
                <p className={`mt-1 lg:mt-6 text-xs md:text-sm lg:text-base font-semibold leading-snug ${step.subtitleColor}`}>
                  {step.subtitle}
                </p>

                {/* Description - Completely hidden on mobile bars */}
                <p className="hidden lg:block mt-6 text-[14px] leading-relaxed text-gray-600 font-normal">
                  {step.description}
                </p>
              </div>

              {/* Action/Stats Area */}
              {/* Mobile: Aligns horizontally next to text | Desktop: Pushed to the bottom */}
              <div className="flex flex-row items-center gap-4 mt-0 lg:mt-auto lg:flex-col lg:items-stretch md:gap-6 lg:gap-0 shrink-0">
                {/* Statistics Block */}
                <div className="flex items-end gap-1 lg:gap-2 text-[#111625]">
                  <span className="text-2xl font-black leading-none tracking-tight md:text-3xl lg:text-5xl">
                    {step.stat}
                  </span>
                  <span className="max-w-[55px] md:max-w-[70px] lg:max-w-[90px] text-[8px] md:text-[9px] lg:text-[10px] font-extrabold leading-3 tracking-wide uppercase mb-0.5">
                    {step.statLabel}
                  </span>
                </div>

                {/* Graphical Icon */}
                <div className="flex justify-center lg:mt-8 shrink-0">
                  <Image
                    src={step.icon}
                    alt={step.title}
                    width={50}
                    height={50}
                    className="object-contain w-8 h-8 opacity-90 md:w-10 md:h-10 lg:w-16 lg:h-16"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}