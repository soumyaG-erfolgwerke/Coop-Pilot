"use client";
import React from "react";
import SectionWrapper from "@/components/about_v2/components/SectionWrapper";
import TagName from "@/components/about_v2/components/ui/TagName";
import { ButtonFlippedRevealV2 } from "@/components/ui/Buttons";
import { Check } from "lucide-react";
import Image from "next/image";
import AboutHeroImage from "@/assets/images/about/about_hero.png";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

const CoopHero = () => {
  const { language } = useLanguage();

  const title = language === "de"
    ? "Das komplette digitale Betriebssystem für Ihre Genossenschaft — alles unter einem Dach."
    : "The complete digital OS for your cooperative — all under one roof.";

  const description = language === "de"
    ? "Von der Gründung über die Finanzierung bis zur GenG-konformen Prüfung: Das ganzheitliche Genossenschaftstool zur Vereinfachung, Organisation und rechtlichen Absicherung."
    : "From R&D to funding to GenG-compliant audit: Front-to-back cooperative tool to simplify, organize, and legally secure.";

  return (
    <SectionWrapper
      wrapperClassName="relative bg-white min-h-[100vh] md:min-h-[80vh] overflow-hidden"
      className="grid grid-cols-1 gap-0 h-full md:grid-cols-2 md:min-h-[80vh]"
      padding={false}
    >
      {/* Image Section - Full bleed on mobile, half on desktop (exactly like AboutHero) */}
      <div className="relative w-full h-[50vh] md:h-full md:w-full md:col-span-1 overflow-hidden">
        {/* Mobile Text Overlay - Centered */}
        <div className="absolute inset-0 z-40 flex items-center justify-center px-6 md:hidden">
          <h3 className="text-3xl font-medium leading-tight text-center text-white sm:text-4xl font-abhaya">
            {title}
          </h3>
        </div>

        {/* Dark Overlay */}
        <div className="absolute inset-0 z-20 bg-black/50 md:bg-black/40" />

        {/* Image */}
        <Image
          src={AboutHeroImage}
          alt="cooperative_hero"
          fill
          priority
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* Content Section - Keep original buttons, original checks, and left alignment */}
      <div className="flex flex-col justify-center w-full h-full gap-6 px-6 py-8 text-left sm:px-8 sm:py-10 md:px-12 md:py-12">
        <div className="flex justify-start">
          <TagName />
        </div>

        {/* Desktop Title - Hidden on mobile */}
        <h1 className="hidden md:block text-4xl sm:text-5xl lg:text-6xl font-medium leading-tight text-[#043e44] font-abhaya tracking-tight">
          {title}
        </h1>

        <p className="max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl font-dmsans">
          {description}
        </p>

        {/* Action Buttons (Original buttons kept) */}
        <div className="flex flex-col justify-center w-full gap-4 mt-2 sm:flex-row">
          <Link href="/pricing" className="w-full sm:w-auto">
            <ButtonFlippedRevealV2
              fullWidth="responsive"
              className="px-8 py-3.5 bg-black border-2 border-black text-white hover:bg-neutral-900 font-bold transition-all text-center rounded-xl flex items-center justify-center"
            >
              {language === "de" ? "Preise anzeigen" : "View Pricing"}
            </ButtonFlippedRevealV2>
          </Link>
          <Link
            href="https://cal.eu/hystandards/30min"
            className="w-full sm:w-auto"
          >
            <ButtonFlippedRevealV2
              fullWidth="responsive"
              className="px-8 py-3.5 bg-transparent border-2 border-[#043e44] text-[#043e44] hover:bg-[#043e44]/5 font-bold transition-all text-center rounded-xl flex items-center justify-center"
            >
              {language === "de" ? "Kostenlose Demo buchen" : "Book a Free Demo"}
            </ButtonFlippedRevealV2>
          </Link>
        </div>

        {/* Bullets (Original checks kept) */}
        <div className="flex flex-col gap-4 mt-4 font-medium text-gray-700 sm:flex-col sm:items-start sm:gap-8 font-dmsans">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600">
              <Check size={14} strokeWidth={3} />
            </div>
            <span>
              {language === "de" ? "Vollständig GenG-konform (deutsches Recht)" : "Fully German GenG Compliant"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600">
              <Check size={14} strokeWidth={3} />
            </div>
            <span>
              {language === "de" ? "Sicher, Ende-zu-Ende verschlüsselt" : "Secure, End-to-end Encrypted"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600">
              <Check size={14} strokeWidth={3} />
            </div>
            <span>
              {language === "de" ? "Rechtssicher & prüfungsbereit" : "Legally Proof & Audit Ready"}
            </span>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default CoopHero;
