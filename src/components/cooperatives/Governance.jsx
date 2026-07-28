"use client";
import React from "react";
import FeatureModuleLayout from "./components/FeatureModuleLayout";
import DashboardMockup from "./components/DashboardMockup";
import { governanceData } from "@/assets/data/json/cooperativesData";
import { CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Governance = () => {
  const { language } = useLanguage();

  const localGovernanceData = language === "de" ? {
    tag: "Modul 3 — Governance",
    title: "Führen Sie Ihre Generalversammlung digital durch — alle 4 Formate, rechtssicher.",
    description:
      "Organisieren, laden Sie ein und stimmen Sie digital oder hybrid ab. CoopPilot unterstützt alle Formate: von der Präsenzversammlung bis zur reinen Online-Abstimmung, mit automatisierter Stimmrechtsübertragung und rechtssicherer Stimmauszählung.",
    checklist: [
      "AGM-Einladung & Agenda-Builder",
      "Digitale Wahlurne & Sofortergebnisse",
      "Stimmrechtsvollmachten-Verwaltung",
      "Live-Quoren-Tracking & automatisierte Protokolle",
      "Mehrsprachige Übersetzungen",
      "Rechtliche Post-Assembly-Exporte",
    ],
    mockup: {
      title: "Generalversammlung Zusammenfassungsansicht",
      subtitle: "BESCHLUSSFÄHIGKEIT ERREICHT",
      stats: [
        { label: "Quorum", value: "84%", subtext: "Erf. 50%" },
        { label: "Abgegebene Stimmen", value: "132 / 158", subtext: "83.5% Beteiligung" },
        { label: "Beschlüsse", value: "3 / 3", subtext: "Angenommen" },
      ],
      consensus: {
        tag: "Konsens: Beschluss #26",
        status: "Angenommen",
        title: "Genehmigung des genossenschaftlichen Jahresabschlusses & Gewinnverwendung (Geschäftsjahr 2025)",
        yesVotes: 121,
        noVotes: 11,
        yesPercent: "92%",
        noPercent: "8%",
      },
      attendance: [
        { label: "42 Vor Ort" },
        { label: "73 Online" },
        { label: "17 Vollmachten" },
      ],
      footnote: "⚖ GenG-konforme digitale Signaturen & unveränderliche Protokolldateien.",
    },
  } : governanceData;

  const { tag, title, description, checklist, mockup } = localGovernanceData;

  return (
    <FeatureModuleLayout
      tag={tag}
      title={title}
      description={description}
      checklist={checklist}
      ctaText={language === "de" ? "Kostenlose Demo buchen" : "Book Free Demo"}
      mockupOnLeft={true}
      wrapperBg="bg-slate-50"
    >
      <DashboardMockup
        title={mockup.title}
        status={mockup.subtitle}
        statusColor="text-emerald-400"
        headerBg="bg-[#043e44]"
      >
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {mockup.stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-1 text-center font-dmsans"
            >
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                {stat.label}
              </span>
              <span className={`text-lg font-bold font-dmsans ${
                stat.label === "Quorum" || stat.label === "Quorum" ? "text-emerald-600" : "text-gray-800"
              }`}>
                {stat.value}
              </span>
              <span className="text-[9px] text-gray-400 font-bold">
                {stat.subtext}
              </span>
            </div>
          ))}
        </div>

        {/* Consensus Resolution Tracker */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col gap-1 font-dmsans">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-primary tracking-wider uppercase">
                {mockup.consensus.tag}
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold uppercase">
                {mockup.consensus.status}
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-800 leading-snug">
              {mockup.consensus.title}
            </h4>
          </div>

          {/* Progress Bar Stacked */}
          <div className="flex flex-col gap-1.5 font-dmsans">
            <div className="w-full h-3 bg-red-100 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 rounded-l-full"
                style={{ width: mockup.consensus.yesPercent }}
              />
              <div
                className="h-full bg-rose-500 rounded-r-full"
                style={{ width: mockup.consensus.noPercent }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-semibold text-gray-500">
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> {language === "de" ? "Ja" : "Yes"}:{" "}
                {mockup.consensus.yesPercent} ({mockup.consensus.yesVotes} {language === "de" ? "Stimmen" : "votes"})
              </span>
              <span className="flex items-center gap-1 text-rose-600">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> {language === "de" ? "Nein" : "No"}:{" "}
                {mockup.consensus.noPercent} ({mockup.consensus.noVotes} {language === "de" ? "Stimmen" : "votes"})
              </span>
            </div>
          </div>
        </div>

        {/* Indicators checklist */}
        <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider font-dmsans">
          {mockup.attendance.map((item, idx) => (
            <div
              key={idx}
              className="bg-white py-2.5 px-2 rounded-lg border border-slate-100 text-center flex items-center justify-center gap-1 shadow-sm"
            >
              <CheckCircle size={12} className="text-emerald-500" /> {item.label}
            </div>
          ))}
        </div>

        {/* Legal Note footer */}
        <div className="text-[10px] text-gray-400 font-semibold text-center mt-1 font-dmsans">
          {mockup.footnote}
        </div>
      </DashboardMockup>
    </FeatureModuleLayout>
  );
};

export default Governance;
