// components/FeaturesSection.js

"use client";

import { useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";

import featureIllustration from "@/assets/images-V2/yay.png";

export default function FeaturesSection() {
  const [openIndex, setOpenIndex] = useState(null);
  const { language } = useLanguage();

  const features = language === "de" ? [
    "Mitglieder-Lebenszyklus-Verwaltung",
    "Geschäftsguthaben-Entwicklung",
    "Governance & Abstimmung",
    "Prüfungsbereite Compliance",
    "Alle Dokumente an einem Ort",
    "Integrationen & API",
  ] : [
    "Member Lifecycle Management",
    "Share Capital Tracking",
    "Governance & Voting",
    "Audit-Ready Compliance",
    "All documents in one place",
    "Integrations & API",
  ];

  return (
    <section className="w-full py-16 bg-white lg:py-24">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl">
          <p className="text-xs font-bold tracking-wider uppercase text-slate-500">
            {language === "de" ? "Funktionen" : "Features"}
          </p>

          <h2 className="mt-5 font-serif text-4xl leading-tight text-black md:text-5xl">
            {language === "de" ? (
              <>
                Alles, was Sie zur Verwaltung Ihrer
                <br />
                Genossenschaft benötigen
              </>
            ) : (
              <>
                Everything you need to manage
                <br />
                Cooperative
              </>
            )}
          </h2>

          <p className="mt-6 text-lg text-gray-600 md:text-2xl">
            {language === "de"
              ? "Eine Plattform, jeder Workflow. Kein Flickschusterwerk nötig."
              : "One platform, every workflow. No duct tape required."}
          </p>
        </div>

        {/* Content */}
        <div className="grid items-center gap-12 mt-14 lg:grid-cols-2">
          {/* Left Card */}
          <div className="rounded-3xl bg-[#f3f3f3] p-8 md:p-10">
            <div className="space-y-1">
              {features.map((feature, index) => (
                <div
                  key={feature}
                  className="py-3 border-b border-transparent"
                >
                  <button
                    onClick={() =>
                      setOpenIndex(openIndex === index ? null : index)
                    }
                    className="flex items-center w-full gap-5 text-left"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d5d5d5]">
                      <span className="text-lg font-semibold leading-none">
                        {openIndex === index ? "−" : "+"}
                      </span>
                    </div>

                    <span className="text-base font-semibold text-black md:text-lg">
                      {feature}
                    </span>
                  </button>

                  {openIndex === index && (
                    <div className="mt-3 ml-12 text-sm leading-relaxed text-gray-600 md:text-base">
                      {language === "de"
                        ? "Verwalten Sie Prozesse effizient durch einen einheitlichen Workflow."
                        : "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Manage processes efficiently through a unified workflow."}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-8">
              <button className="px-10 py-4 text-base font-semibold text-white transition bg-black rounded-2xl hover:opacity-90">
                {language === "de" ? "Details erkunden" : "Explore in Details"}
              </button>
            </div>
          </div>

          {/* Right Illustration */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg">
              <Image
                src={featureIllustration}
                alt="Feature Illustration"
                className="object-contain w-full h-auto"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}