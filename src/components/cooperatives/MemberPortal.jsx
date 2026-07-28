"use client";
import React from "react";
import FeatureModuleLayout from "./components/FeatureModuleLayout";
import DashboardMockup from "./components/DashboardMockup";
import { memberPortalData } from "@/assets/data/json/cooperativesData";
import { Download, FileText, ExternalLink, Calendar } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const MemberPortal = () => {
  const { language } = useLanguage();

  const localMemberPortalData = language === "de" ? {
    tag: "Modul 4 — Mitgliederportal",
    title: "Jedes Mitglied erhält sein eigenes digitales Zuhause — kostenlos enthalten.",
    description:
      "Unser Mitgliederportal macht die genossenschaftliche Mitgliedschaft zugänglich und transparent. Mitglieder können ihre Anteile einsehen, Ausschüttungen verfolgen, über Beschlüsse abstimmen und notwendige Dokumente direkt herunterladen.",
    checklist: [
      "Persönliches Anteils-Dashboard & Details",
      "Abstimmungs-Interface für Beschlüsse",
      "Download-Center für Dokumente",
      "Direkter Nachrichtenaustausch mit dem Team",
      "Dynamischer Newsletter-Feed & Updates",
    ],
    mockup: {
      title: "CoopPilot Mitgliederportal",
      subtitle: "ONLINE",
      welcome: {
        tag: "Mitglieder-Arbeitsbereich",
        heading: "Hallo Jimmy, willkommen zurück!",
        meta: "Mitglieds-ID: #0482 • Beitrittsdatum: Jan. 2024",
        initials: "KD",
      },
      stats: [
        { label: "Meine Anteile", value: "10 Anteile", subtext: "Wert: €1.000" },
        { label: "Dividendenrendite", value: "4,5%", subtext: "Auszahlungen: €45,00" },
      ],
      assembly: {
        tag: "Nächste Versammlung",
        date: "12. Okt. 2026, 18:00 (CET)",
        action: "Abstimmen",
      },
      documents: [
        { name: "Jahresfinanzbericht 2025", type: "PDF", size: "3,4 MB" },
        { name: "Protokoll der Generalversammlung (Okt. 2025)", type: "PDF", size: "850 KB" },
      ],
    },
  } : memberPortalData;

  const { tag, title, description, checklist, mockup } = localMemberPortalData;

  return (
    <FeatureModuleLayout
      tag={tag}
      title={title}
      description={description}
      checklist={checklist}
      ctaText={language === "de" ? "Kostenlose Demo buchen" : "Book Free Demo"}
      wrapperBg="bg-white"
    >
      <DashboardMockup
        title={mockup.title}
        status={mockup.subtitle}
        statusColor="text-emerald-400"
        headerBg="bg-[#043e44]"
      >
        {/* Member Welcome Card */}
        <div className="bg-gradient-to-r from-[#7c0a29] to-[#9c1f3d] p-4 sm:p-5 rounded-xl text-white shadow-md flex items-center justify-between font-dmsans">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider">
              {mockup.welcome.tag}
            </span>
            <h4 className="text-lg font-bold leading-tight sm:text-xl font-abhaya">
              {mockup.welcome.heading}
            </h4>
            <span className="text-[10px] text-white/80 font-medium">
              {mockup.welcome.meta}
            </span>
          </div>
          <div className="flex items-center justify-center w-12 h-12 text-lg font-bold border rounded-full bg-white/10 border-white/20">
            {mockup.welcome.initials}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 font-dmsans">
          {mockup.stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-1"
            >
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                {stat.label}
              </span>
              <span className={`text-xl font-bold ${
                stat.label === "Dividend Yield" || stat.label === "Dividendenrendite" ? "text-emerald-600" : "text-gray-800"
              }`}>
                {stat.value}
              </span>
              <span className="text-[10px] text-gray-500 font-medium">
                {stat.subtext}
              </span>
            </div>
          ))}
        </div>

        {/* Next Assembly Banner */}
        <div className="flex items-center justify-between p-3 bg-white border shadow-sm rounded-xl border-slate-100 font-dmsans">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 text-amber-600">
              <Calendar size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                {mockup.assembly.tag}
              </span>
              <span className="text-xs font-bold text-gray-700">
                {mockup.assembly.date}
              </span>
            </div>
          </div>
          <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase cursor-pointer hover:bg-amber-100 flex items-center gap-0.5 transition-all">
            {mockup.assembly.action} <ExternalLink size={10} />
          </span>
        </div>

        {/* Document Center */}
        <div className="flex flex-col gap-3 p-4 bg-white border shadow-sm rounded-xl border-slate-100 font-dmsans">
          <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
            {language === "de" ? "Dokumenten-Center der Genossenschaft" : "Cooperative Document Center"}
          </span>
          <div className="flex flex-col gap-2">
            {mockup.documents.map((doc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 transition-colors border rounded-lg bg-slate-50 border-slate-100 hover:bg-slate-100/50"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText
                    size={16}
                    className="text-[#043e44] flex-shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-gray-700 truncate">
                      {doc.name}
                    </span>
                    <span className="text-[9px] text-gray-400">
                      {doc.type} • {doc.size}
                    </span>
                  </div>
                </div>
                <button className="p-1.5 rounded-md hover:bg-white text-gray-500 hover:text-gray-700 transition-all border border-transparent hover:border-slate-200">
                  <Download size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </DashboardMockup>
    </FeatureModuleLayout>
  );
};

export default MemberPortal;
