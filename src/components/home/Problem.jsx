"use client";

import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";

import onboardingIcon from "@/assets/images-V2/onboarding.png";
import dataIcon from "@/assets/images-V2/data.png";
import governanceIcon from "@/assets/images-V2/governance.png";
import reportsIcon from "@/assets/images-V2/reviews.png";
import knowledgeIcon from "@/assets/images-V2/knowledge.png";
import questionIllustration from "@/assets/images-V2/problem.png";

export default function ProblemsSection() {
  const { language } = useLanguage();

  const problems = [
    {
      id: "01",
      title: language === "de" ? "ONBOARDING" : "ONBOARDING",
      description: language === "de"
        ? "Papierbasiertes Onboarding: Formulare, Unterschriften, Scans — langsam und unzuverlässig."
        : "Paper-based onboarding Forms, signatures, scans — slow and unreliable.",
      icon: onboardingIcon,
    },
    {
      id: "02",
      title: language === "de" ? "DATEN" : "DATA",
      description: language === "de"
        ? "Verstreute Datensysteme: Excel, Ordner und Tools, die nicht miteinander verbunden sind."
        : "Scattered data systems Excel, folders, and tools that don't connect.",
      icon: dataIcon,
    },
    {
      id: "03",
      title: language === "de" ? "GOVERNANCE" : "GOVERNANCE",
      description: language === "de"
        ? "Manuelle Governance-Arbeit: Generalversammlungen, Einladungen und Protokolle von Hand erstellt."
        : "Manual governance work AGMs, invites, and minutes done by hand.",
      icon: governanceIcon,
    },
    {
      id: "04",
      title: language === "de" ? "PRÜFUNGEN & BERICHTE" : "REVIEWS & REPORTS",
      description: language === "de"
        ? "Endlose E-Mail-Ketten: Wichtige Dokumente und Updates gehen in Threads unter."
        : "Endless email chains. Important documents and updates get buried across threads.",
      icon: reportsIcon,
    },
    {
      id: "05",
      title: language === "de" ? "WISSEN" : "KNOWLEDGE",
      description: language === "de"
        ? "Wissen in Köpfen gefangen: Kritische Informationen werden nicht dokumentiert oder geteilt."
        : "Knowledge trapped in heads Critical info isn't documented or shared.",
      icon: knowledgeIcon,
    },
  ];

  return (
    <section className="py-20 bg-[#f7f7f7]">
      <div className="mx-auto px-8 py-12 md:px-10 lg:px-16 lg:py-16">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          {/* Left Side */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rotate-45 bg-red-500" />
              <span className="text-xs font-semibold tracking-wider text-gray-700 uppercase">
                {language === "de" ? "Das Problem" : "The Problem"}
              </span>
            </div>

            <h2 className="max-w-md font-serif text-4xl font-medium leading-tight text-slate-800 md:text-5xl">
              {language === "de" ? "Kommt Ihnen davon etwas bekannt vor?" : "Does any of this sound Familiar?"}
            </h2>

            <p className="max-w-md mt-6 text-lg leading-relaxed text-gray-600">
              {language === "de"
                ? "Die meisten Genossenschaften jonglieren mit Tabellenkalkulationen, Papierformularen, E-Mail-Ketten und isolierten Tools. Es gibt einen besseren Weg."
                : "Most cooperatives are juggling spreadsheets, paper forms, email chains, and disconnected tools. There's a better way."}
            </p>

            <div className="mt-10">
              <Image
                src={questionIllustration}
                alt="Question Illustration"
                className="w-full max-w-md"
                priority
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="space-y-5">
            {problems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_6px_18px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-center justify-center w-16 h-16 rounded-full shrink-0 bg-pink-50">
                  <Image
                    src={item.icon}
                    alt={item.title}
                    width={50}
                    height={50}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-medium tracking-wide text-slate-800">
                    {item.id} — {item.title}
                  </h3>

                  <p className="mt-1 text-sm leading-relaxed text-gray-500">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}