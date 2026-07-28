"use client";
import React from "react";
import SectionWrapper from "@/components/about_v2/components/SectionWrapper";
import { ButtonFlippedRevealV2 } from "@/components/ui/Buttons";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

const TransformCoop = () => {
  const { language } = useLanguage();

  return (
    <SectionWrapper
      wrapperClassName="bg-[#7c0a29] py-16 sm:py-20 md:py-24"
      className="px-6 md:px-12 lg:px-16"
      padding={false}
    >
      <div className="w-full flex flex-col items-center gap-8 text-center max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-white font-abhaya leading-tight tracking-wide">
          {language === "de" ? "Bereit, Ihre Genossenschaft zu transformieren?" : "Ready to transform your cooperative?"}
        </h2>
        <p className="text-base sm:text-lg leading-relaxed text-pink-100 font-dmsans max-w-xl">
          {language === "de"
            ? "Schließen Sie sich führenden modernen Genossenschaften an, die bereits mit CoopPilot arbeiten. Die Einrichtung dauert weniger als einen Monat, und unser Team kümmert sich um die Migration."
            : "Join leading modern cooperatives already running on CoopPilot. Setup takes under a month, and our team handles transition migration."}
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-2">
          <Link href="/pricing" className="w-full sm:w-auto">
            <ButtonFlippedRevealV2
              className="w-full sm:w-auto px-8 py-3.5 bg-white border-2 border-white text-[#7c0a29] hover:bg-neutral-100 font-bold transition-all text-center rounded-xl flex items-center justify-center"
            >
              {language === "de" ? "Preise anzeigen" : "View Pricing"}
            </ButtonFlippedRevealV2>
          </Link>
          <Link href="https://cal.eu/hystandards/30min" className="w-full sm:w-auto">
            <ButtonFlippedRevealV2
              className="w-full sm:w-auto px-8 py-3.5 bg-transparent border-2 border-white text-white hover:bg-white/10 font-bold transition-all text-center rounded-xl flex items-center justify-center"
            >
              {language === "de" ? "Demo buchen" : "Book a Demo"}
            </ButtonFlippedRevealV2>
          </Link>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default TransformCoop;
