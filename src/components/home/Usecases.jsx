"use client";

import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";

import workflowIllustration from "@/assets/images-V2/usecases.png";

export default function UseCasesSection() {
  const { language } = useLanguage();

  const useCases = [
    {
      number: "01",
      title: language === "de" ? "Onboarding & Mitgliederaufnahme" : "Resume Building & Interview Preparation",
      description: language === "de"
        ? "Schnelles digitales Onboarding, kein Papierkram. Klare Aufzeichnungen vom ersten Tag an."
        : "Fast digital onboarding, no paperwork. Clear records from day one.",
    },
    {
      number: "02",
      title: language === "de" ? "Mitgliederliste & Anteile" : "Share Management",
      description: language === "de"
        ? "Verfolgen Sie Anteile und Genehmigungen an einem Ort. Genaue Aufzeichnungen, Echtzeit-Sichtbarkeit."
        : "Track shares and approvals in one place. Accurate records, real-time visibility.",
    },
    {
      number: "03",
      title: language === "de" ? "Governance" : "Governance",
      description: language === "de"
        ? "Versammlungen und Abstimmungen bleiben organisiert. Sichere Aufzeichnungen, einfacher Zugang."
        : "Meetings and voting stay organized. Secure records, easy access",
    },
  ];

  return (
    <section className="py-20 bg-[#f7f7f7] lg:py-28">
      <div className="px-8 mx-auto max-w-7xl">
        {/* Heading */}
        <div className="text-center">
          <h2 className="font-serif text-4xl text-black md:text-5xl">
            {language === "de" ? "Wie Genossenschaften CoopPilot nutzen" : "How cooperatives use CoopPilot"}
          </h2>

          <p className="mt-6 text-xl text-neutral-600">
            {language === "de" ? "Echte Workflows. Echte Wirkung." : "Real workflows. Real impact."}
          </p>
        </div>

        {/* Content */}
        <div className="grid items-center gap-16 mt-16 lg:grid-cols-2">
          {/* Illustration */}
          <div className="flex justify-center order-2 lg:order-1">
            <div className="relative w-full max-w-md lg:max-w-lg">
              <Image
                src={workflowIllustration}
                alt="Workflow Illustration"
                className="object-contain w-full h-auto"
                priority
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="order-1 lg:order-2">
            <div className="space-y-0">
              {useCases.map((item, index) => (
                <div
                  key={item.number}
                  className="py-10 border-t border-neutral-300"
                >
                  <div className="flex flex-col gap-6 md:flex-row md:gap-10">
                    {/* Number */}
                    <div className="min-w-[90px]">
                      <span className="font-serif text-6xl font-light text-neutral-300 md:text-7xl">
                        {item.number}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="font-serif text-3xl leading-tight text-black">
                        {item.title}
                      </h3>

                      <p className="max-w-md mt-5 text-base leading-relaxed text-neutral-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Bottom Border */}
              <div className="border-t border-neutral-300" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
