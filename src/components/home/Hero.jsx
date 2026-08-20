"use client";

import Image from "next/image";
import {
  ArrowRight,
  Users,
  Check,
  ChevronRight,
  HeartHandshake,
} from "lucide-react";

import {
  ButtonFlippedReveal,
  ButtonOutlineHoverSolid,
} from "@/components/ui/Buttons";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

import heroImg from "@/assets/images-V2/hero.png";
import partner1 from "@/assets/icons-V2/partner1.svg";
import partner2 from "@/assets/icons-V2/partner2.svg";
import partner3 from "@/assets/icons-V2/partner3.svg";

export default function HeroSection() {
  const { language } = useLanguage();

  const featuresList = language === "de" ? [
    "Kein Papierkram",
    "Echtzeit-Tracking",
    "Eine einheitliche Plattform",
  ] : [
    "No paperwork",
    "Real-time tracking",
    "One unified platform",
  ];

  return (
    <section className="w-full overflow-hidden border border-[#d9d9d9] bg-white">
      {/* Hero Content */}
      <div className="grid lg:grid-cols-2">
        {/* Left */}
        <div className="flex items-center px-8 py-12 md:px-10 lg:px-16 lg:py-16">
          <div className="lg:max-w-[560px]">
            <h1 className="font-serif text-[38px] leading-[1.15] text-[#2b2b2b] md:text-[52px]">
              {language === "de"
                ? "22 Millionen Menschen haben sich für genossenschaftliches Eigentum entschieden. Wir bauen das digitale Zuhause, das ihre Genossenschaften verdienen."
                : "22 million people chose cooperative ownership. We're building the digital home their cooperatives deserve."}
            </h1>

            <p className="mt-8 text-[17px] leading-relaxed text-[#666]">
              {language === "de"
                ? "CoopPilot ist die komplette digitale Plattform für Genossenschaften — Mitgliederverwaltung, Governance, Prüfungen und mehr. Alles an einem Ort. Vollständig konform."
                : "CoopPilot is the complete digital platform for cooperatives — member management, governance, audits and more. Everything in one place. Fully compliant."}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8 md:justify-start">
              <Link href={"/for-cooperatives"}>
                <ButtonOutlineHoverSolid className="flex items-center gap-2 rounded-xl border-[#1e1e1e] px-6 py-3 font-medium">
                  <HeartHandshake size={18} />
                  {language === "de" ? "Ich leite eine Genossenschaft" : "I run a Cooperative"}
                </ButtonOutlineHoverSolid>
              </Link>

              <Link href={"/for-member"}>
                <ButtonFlippedReveal
                  className="flex items-center gap-3 px-6 py-3 text-white bg-black rounded-xl"
                  icon={<Users size={18} />}
                  hoverIcon={<ArrowRight size={18} />}
                  isBorder={false}
                  isshadow={false}
                >
                  {language === "de" ? "Mitglied werden" : "Become a Member"}
                </ButtonFlippedReveal>
              </Link>
            </div>

            {/* Features */}
            <div className="flex flex-wrap mt-8 gap-x-8 gap-y-3">
              {featuresList.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-sm text-[#31b66a]"
                >
                  <Check size={15} />
                  {item}
                </div>
              ))}
            </div>

            {/* Partners */}
            <div className="mt-10">
              <button className="flex items-center gap-2 text-[17px] font-medium text-[#222]">
                {language === "de" ? "Unsere vertrauenswürdigen Partner" : "Our trusted partners"}
                <ChevronRight size={18} />
              </button>

              <div className="flex flex-wrap items-center gap-10 mt-6">
                <Image src={partner1} alt="partner1" />
                <Image src={partner2} alt="partner2" />
                <Image src={partner3} alt="partner3" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Image */}
        <div className="relative min-h-[600px]">
          <Image
            src={heroImg}
            alt="Cooperative team"
            fill
            priority
            size={500}
            className="object-cover"
          />
        </div>
      </div>

      {/* Stats Footer */}
      <div className="bg-[#455A64]">
        <div className="grid grid-cols-2 px-6 py-8 text-white gap-y-8 md:grid-cols-4">
          <div className="text-center">
            <h3 className="text-[42px] font-bold leading-none">22000+</h3>
            <p className="mt-2 text-sm text-slate-200">
              {language === "de" ? "Vertraut von Unternehmen" : "Trusted by Companies"}
            </p>
          </div>

          <div className="text-center">
            <h3 className="text-[42px] font-bold leading-none">1M+</h3>
            <p className="mt-2 text-sm text-slate-200">
              {language === "de" ? "Glückliche Kunden" : "Happy Customers"}
            </p>
          </div>

          <div className="text-center">
            <h3 className="text-[42px] font-bold leading-none">$3000</h3>
            <p className="mt-2 text-sm text-slate-200">
              {language === "de" ? "Jährlicher Umsatz" : "Yearly Revenue"}
            </p>
          </div>

          <div className="text-center">
            <h3 className="text-[42px] font-bold leading-none">10+</h3>
            <p className="mt-2 text-sm text-slate-200">
              {language === "de" ? "Vertrauenswürdige Partner" : "Trusted Partners"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
