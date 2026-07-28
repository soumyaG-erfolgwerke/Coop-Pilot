"use client";
import React, { useState } from "react";
import FeatureModuleLayout from "./components/FeatureModuleLayout";
import DashboardMockup from "./components/DashboardMockup";
import { membersAndSharesData } from "@/assets/data/json/cooperativesData";
import { Plus, Search, Filter, ChevronDown, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const MembersAndShares = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { language } = useLanguage();

  const localMembersAndSharesData = language === "de" ? {
    tag: "Modul 1 — Mitglieder & Anteile",
    title: "Kennen Sie jedes Mitglied. Jeden Anteil. Jede Änderung — in Echtzeit.",
    description: "Das digitale Mitgliederregister von CoopPilot ist die rechtssichere Quelle der Wahrheit. Verwalten Sie Beitritte, Austritte, Anteilsübertragungen und GenG-konforme Listen automatisch. Bereit für den Prüfer-Export.",
    checklist: [
      "Digitaler Mitgliedsantrag (PDF)",
      "Anteilsverwaltung & dynamische Mitgliederliste",
      "KYC-Prüfungen & Unterschriften-Upload",
      "Verfolgung ausstehender/gekündigter Anträge",
      "Schnelle Exporte & Suchfilter",
    ],
    mockup: {
      title: "CoopPilot Admin-Portal",
      subtitle: "Mitgliederregister",
      registryTitle: "Mitgliederliste",
      members: [
        {
          name: "Jimmy McGill",
          email: "saulgoodman@gmail.com",
          amount: "€456",
          shares: 87,
          joined: "26. NOV. 2023",
          status: "Aktiv",
          initials: "JM",
          avatarBg: "bg-blue-100 text-blue-600",
        },
        {
          name: "Kim Waxler",
          email: "kimgoodman@gmail.com",
          amount: "€877",
          shares: 87,
          joined: "26. NOV. 2023",
          status: "Aktiv",
          initials: "KW",
          avatarBg: "bg-purple-100 text-purple-600",
        },
        {
          name: "Walter White",
          email: "bluemeth@gmail.com",
          amount: "€4.552",
          shares: 87,
          joined: "26. NOV. 2023",
          status: "Ausstehend",
          initials: "WW",
          avatarBg: "bg-slate-100 text-slate-600",
        },
        {
          name: "Gustavo Fring",
          email: "themanager@gmail.com",
          amount: "€1.000",
          shares: 87,
          joined: "26. NOV. 2023",
          status: "Ausstehend",
          initials: "GF",
          avatarBg: "bg-amber-100 text-amber-600",
        },
      ],
    },
  } : membersAndSharesData;

  const { tag, title, description, checklist, mockup } = localMembersAndSharesData;

  const filteredMembers = mockup.members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        headerBg="bg-[#2d2d2d]"
        statusColor="text-white"
      >
        {/* Member Registry Title & Top Buttons */}
        <div className="flex items-center justify-between font-dmsans">
          <h3 className="text-lg font-bold text-gray-800">
            {mockup.registryTitle}
          </h3>
          <div className="flex gap-2">
            <button className="bg-[#7c0a29] hover:bg-[#630820] text-white py-1.5 px-3 rounded-lg text-[10px] sm:text-xs font-semibold flex items-center gap-1 transition-all">
              <Plus size={12} /> {language === "de" ? "Mitglieder einladen" : "Invite Members"}
            </button>
            <button className="bg-white border border-slate-200 text-gray-500 hover:bg-slate-50 py-1.5 px-3 rounded-lg text-[10px] sm:text-xs font-semibold flex items-center gap-1 transition-all">
              <Filter size={12} /> {language === "de" ? "Filter" : "Filter"}
            </button>
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((cardId) => (
            <div key={cardId} className="flex flex-col gap-1 p-3 bg-white border shadow-sm rounded-xl border-slate-100">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                {language === "de" ? "Mitglieder gesamt" : "Total Members"}
              </span>
              <span className="text-base font-bold text-gray-800 sm:text-lg font-dmsans">
                56
              </span>
              <span className="text-[8px] sm:text-[9px] text-emerald-500 font-semibold font-dmsans">
                {language === "de" ? "↑ +12 diesen Monat" : "↑ +12 this month"}
              </span>
            </div>
          ))}
        </div>

        {/* Table Container */}
        <div className="flex flex-col overflow-hidden bg-white border border-slate-200 rounded-xl">
          {/* Search bar */}
          <div className="flex items-center gap-2 p-2.5 border-b border-slate-100 bg-slate-50/50">
            <Search size={12} className="text-gray-400" />
            <input
              type="text"
              placeholder={language === "de" ? "Mitglieder suchen..." : "Search members..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-[11px] text-gray-600 placeholder-gray-400 bg-transparent border-none outline-none font-dmsans"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left font-dmsans">
              <thead>
                <tr className="bg-[#f5f5f5] text-gray-500 font-bold tracking-wider uppercase border-b border-slate-200">
                  <th className="p-2.5 text-[9px] font-bold text-gray-500">
                    {language === "de" ? "MITGLIEDER" : "MEMBERS"}
                  </th>
                  <th className="p-2.5 text-[9px] font-bold text-gray-500">
                    {language === "de" ? "BETRAG" : "AMOUNT"}
                  </th>
                  <th className="p-2.5 text-[9px] font-bold text-gray-500">
                    {language === "de" ? "ANTEILE GESAMT" : "TOTAL SHARES"}
                  </th>
                  <th className="p-2.5 text-[9px] font-bold text-gray-500">
                    {language === "de" ? "BEIGETRETEN" : "JOINED"}
                  </th>
                  <th className="p-2.5 text-[9px] font-bold text-gray-500">
                    {language === "de" ? "STATUS" : "STATUS"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((member, index) => (
                  <tr key={index} className="transition-colors hover:bg-slate-50/30">
                    <td className="p-2.5 flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] flex-shrink-0 ${member.avatarBg}`}>
                        {member.initials}
                      </div>
                      <div className="flex flex-col leading-tight min-w-0">
                        <span className="font-semibold text-gray-800 truncate">{member.name}</span>
                        <span className="text-[9px] text-gray-400 font-normal truncate">{member.email}</span>
                      </div>
                    </td>
                    <td className="p-2.5 font-semibold text-gray-700">{member.amount}</td>
                    <td className="p-2.5 font-medium text-gray-600">{member.shares}</td>
                    <td className="p-2.5 text-gray-500 truncate">{member.joined}</td>
                    <td className="p-2.5">
                      <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${
                        member.status === "Active" || member.status === "Aktiv"
                          ? "bg-green-50 text-green-600 border-green-200"
                          : "bg-orange-50 text-orange-600 border-orange-200"
                      }`}>
                        {member.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* View All Dropdown */}
        <div className="flex justify-center -mt-2">
          <button className="bg-[#f5f5f5] hover:bg-slate-100 border border-slate-200 text-gray-600 px-3 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1 transition-all">
            {language === "de" ? "Alle anzeigen" : "View All"} <ChevronDown size={12} />
          </button>
        </div>

        {/* Bottom Action Row */}
        <div className="grid grid-cols-2 gap-3 mt-1 font-dmsans">
          <button className="bg-[#7c0a29] hover:bg-[#630820] text-white py-2 px-3 rounded-lg text-xs font-bold transition-all shadow-sm">
            {language === "de" ? "GoBD-verifiziert" : "GoBD Verified"}
          </button>
          <button className="bg-white hover:bg-slate-50 border border-slate-200 text-gray-600 py-2 px-3 rounded-lg text-xs font-bold transition-all">
            {language === "de" ? "DATEV exportieren" : "Export DATEV"}
          </button>
        </div>

        {/* Red warning alert */}
        <div className="bg-red-50 border border-red-500/20 text-red-700 px-3.5 py-2 rounded-xl flex items-center gap-2 text-[11px] font-medium font-dmsans">
          <ShieldAlert size={14} className="text-red-500 flex-shrink-0" />
          <span>
            {language === "de"
              ? "2 Dokumente sollten vor dem 30. April geprüft werden."
              : "2 Documents should be reviewed before April 30."}
          </span>
        </div>
      </DashboardMockup>
    </FeatureModuleLayout>
  );
};

export default MembersAndShares;
