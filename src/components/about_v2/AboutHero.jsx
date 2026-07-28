"use client";

import React from "react";
import SectionWrapper from "./components/SectionWrapper";
import TagName from "./components/ui/TagName";
import { ButtonFlippedReveal } from "../ui/Buttons";
import AboutHeroImage from "@/assets/images/about/about_hero.png";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ArrowRightCircle,
  CheckCheck,
  CirclePlay,
  Headset,
  SquarePlay,
  X,
} from "lucide-react";
import Image from "next/image";

const AboutHero = () => {
  const { language } = useLanguage();

  const aboutData = {
    tag: language === "de" ? "Über uns" : "About us",
    title: language === "de" 
      ? "Auf genossenschaftlichen Werten aufgebaut. Für modernes Wachstum entwickelt."
      : "Built on cooperative values. Designed for modern growth.",
    description: language === "de"
      ? "Genossenschaften sind mehr als nur eine Rechtsform - sie sind eine zeitlose Idee, die auf Vertrauen, gemeinschaftlichem Eigentum und Verantwortung basiert. Wir helfen dabei, diese Idee in das digitale Zeitalter zu übertragen."
      : "Cooperatives are more than a legal structure - they are a timeless idea built on trust, shared ownership, and responsibility. We help bring that idea into the digital age.",
    support: [
      {
        text: language === "de" ? "Für Genossenschaften entwickelt" : "Built for cooperatives",
        color: "primary",
        hidden: false,
        valid: true,
      },
      {
        text: language === "de" ? "Sicher & konform" : "Secure & compliant",
        color: "primary",
        hidden: false,
        valid: true,
      },
      {
        text: language === "de" ? "Langfristige Stabilität" : "Long-term stability",
        color: "primary",
        hidden: false,
        valid: true,
      },
    ],
  };

  return (
    <SectionWrapper
      wrapperClassName="relative bg-[#fffae5] min-h-[100vh] md:min-h-[80vh] overflow-hidden"
      className="grid grid-cols-1 gap-0 h-full md:grid-cols-2 md:min-h-[80vh]"
      padding={false}
    >
      {/* Image Section - Full bleed on mobile, half on desktop */}
      <div className="relative w-full h-[50vh] md:h-full md:w-full md:col-span-1 overflow-hidden">
        {/* Mobile Text Overlay - Centered */}
        <div className="absolute inset-0 z-40 flex items-center justify-center px-6 md:hidden">
          <h3 className="text-3xl font-medium leading-tight text-center text-white sm:text-4xl font-abhaya">
            {aboutData.title}
          </h3>
        </div>

        {/* Dark Overlay */}
        <div className="absolute inset-0 z-20 bg-black/50 md:bg-black/40" />

        {/* Image */}
        <Image
          src={AboutHeroImage}
          alt="about_hero"
          fill
          priority
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* Content Section - Below image on mobile, right side on desktop */}
      <div className="flex flex-col justify-center w-full h-full gap-10 px-6 py-8 text-center sm:px-8 sm:py-10 md:px-10 md:py-14 md:text-right sm:gap-12 md:gap-14">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex justify-center md:justify-end">
            <TagName />
          </div>
          {/* Desktop Title - Hidden on mobile, styled in dark green */}
          <h3 className="hidden text-4xl font-medium leading-tight text-[#043e44] md:block lg:text-5xl xl:text-6xl font-abhaya">
            {aboutData.title}
          </h3>
        </div>

        <p className="text-base leading-relaxed text-gray-600 sm:text-lg md:text-xl lg:text-2xl font-dmsans">
          {aboutData.description}
        </p>

        {/* Buttons */}
        <div className="flex flex-col justify-center w-full gap-3 sm:flex-row sm:gap-4 md:flex-col lg:flex-row md:gap-4 lg:gap-5 md:justify-end">
          <ButtonFlippedReveal
            variant="contained"
            size="large"
            className="flex items-center justify-center w-full gap-2 px-4 py-3 sm:py-2.5 text-base sm:text-lg font-medium capitalize bg-white !rounded-lg text-black sm:w-auto md:w-full lg:w-auto"
            icon={<SquarePlay className="w-5 h-5 sm:w-6 sm:h-6" />}
            hoverIcon={<CirclePlay className="w-5 h-5 sm:w-6 sm:h-6" />}
            isBorder={true}
            innerPadding={2}
            rounded="xl"
          >
            {language === "de" ? "produkt-tour" : "product tour"}
          </ButtonFlippedReveal>
          <ButtonFlippedReveal
            variant="text"
            size="large"
            className="flex items-center justify-center w-full gap-2 px-4 py-3 sm:py-2.5 text-base sm:text-lg font-medium text-white capitalize bg-black text-light sm:w-auto md:w-full lg:w-auto"
            icon={<Headset className="w-5 h-5 sm:w-6 sm:h-6" />}
            hoverIcon={<ArrowRightCircle className="w-5 h-5 sm:w-6 sm:h-6" />}
            rounded="xl"
          >
            {language === "de" ? "kontakt aufnehmen" : "get in touch"}
          </ButtonFlippedReveal>
        </div>

        {/* Support Tags */}
        <div className="grid items-center justify-center w-full grid-cols-1 gap-4 text-base sm:text-base md:text-lg font-abhaya sm:grid-cols-2 min-[1250px]:grid-cols-3 sm:mx-auto md:items-center">
          {aboutData.support.map((item, index) => {
            return (
              !item.hidden && (
                <div
                  className="flex items-center justify-center space-x-2 text-primary"
                  key={index}
                >
                  <span>
                    {item.valid ? (
                      <CheckCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </span>
                  <span className="whitespace-nowrap">{item.text}</span>
                </div>
              )
            );
          })}
        </div>
      </div>
    </SectionWrapper>
  );
};

export default AboutHero;
