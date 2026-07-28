"use client";

import { Euro } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Plans() {
  const { language } = useLanguage();

  return (
    <section className="w-full py-20 bg-[#f5f5f5]">
      <div className="px-4 mx-auto w-fit sm:px-6 lg:px-8">
        {/* TOGGLE */}
        <h2 className="mb-8 font-serif text-3xl font-semibold text-center">
          {language === "de" ? "Tarife" : "Plans"}
        </h2>

        {/* PRICING CARDS */}
        <div className="grid grid-cols-1 overflow-hidden bg-white shadow-lg md:grid-cols-3 rounded-2xl">
          {/* STARTER */}
          <div className="p-8 border-r">
            <h3 className="text-sm font-medium text-gray-500 uppercase">
              Starter
            </h3>
            <p className="mb-8 text-xs text-gray-400">
              {language === "de" ? "Bis zu 300 Mitglieder" : "Up to 300 members"}
            </p>

            <p className="flex items-center text-4xl font-semibold">
              <Euro strokeWidth={2.5} size={32} />
              99
            </p>
            <p className="mb-8 text-sm text-gray-500">
              {language === "de" ? "pro Monat · zzgl. USt." : "per month · excl. VAT"}
            </p>

            <ul className="mb-8 space-y-3 text-sm text-gray-700">
              <li>
                {language === "de"
                  ? "• Digitales Mitgliederverzeichnis (BEG IV)"
                  : "• Digital member register (BEG IV)"}
              </li>
              <li>
                {language === "de" ? "• Anteilsverwaltung" : "• Share management"}
              </li>
              <li>
                {language === "de" ? "• GoBD-Nebenbuch" : "• GoBD subsidiary ledger"}
              </li>
              <li>
                {language === "de" ? "• Dokumentenspeicher" : "• Document storage"}
              </li>
              <li>
                {language === "de"
                  ? "• Mitgliederportal (alle Mitglieder, kostenlos)"
                  : "• Member portal (all members, free)"}
              </li>
              <li>
                {language === "de" ? "• E-Mail-Support" : "• Email support"}
              </li>
            </ul>

            <Link href={"/coopadmin-signup-v2"}>
              <button className="w-full py-3 transition border rounded-lg hover:bg-black hover:text-white">
                {language === "de" ? "Kostenlos testen" : "Start Free Trial"}
              </button>
            </Link>
          </div>

          {/* PROFESSIONAL */}
          <div className="pt-0 p-8 text-white border-r bg-[#7d0534] space-y-8">
            {/* Badge */}
            <div className="px-3 py-1 mx-auto text-xs text-black bg-yellow-200 rounded-b-md w-fit">
              {language === "de" ? "Am beliebtesten" : "Most Popular"}
            </div>

            <div className="">
              <h3 className="text-sm uppercase opacity-80">Professional</h3>
              <p className="mb-4 text-xs text-yellow-200 opacity-70">
                {language === "de" ? "300–1.000 Mitglieder" : "300–1,000 members"}
              </p>
            </div>

            <div className="">
              <p className="flex items-center text-4xl font-semibold">
                <Euro strokeWidth={2.5} size={32} />
                199
              </p>
              <p className="mb-6 text-sm text-yellow-200 opacity-80">
                {language === "de" ? "pro Monat · zzgl. USt." : "per month · excl. VAT"}
              </p>
            </div>

            <ul className="mb-8 space-y-3 text-sm">
              <li>
                {language === "de" ? "• Alles aus Starter" : "• Everything in Starter"}
              </li>
              <li>
                {language === "de"
                  ? "• Digitale Generalversammlung"
                  : "• Digital General Assembly"}
              </li>
              <li>
                {language === "de"
                  ? "• Online-Abstimmung + autom. §47-Protokoll"
                  : "• Online voting + auto §47 minutes"}
              </li>
              <li>
                {language === "de"
                  ? "• Prüfungsverband-Schnittstelle"
                  : "• Audit association connector"}
              </li>
              <li>
                {language === "de" ? "• DATEV-Export" : "• DATEV export"}
              </li>
              <li>
                {language === "de" ? "• Priorisierter Support" : "• Priority support"}
              </li>
            </ul>

            <Link href={"/coopadmin-signup-v2"}>
              <button className="w-full py-3 mt-2 text-black bg-white rounded-lg hover:opacity-90">
                {language === "de" ? "Kostenlos testen" : "Start Free Trial"}
              </button>
            </Link>
          </div>

          {/* ENTERPRISE */}
          <div className="p-8">
            <h3 className="text-sm font-medium text-gray-500 uppercase">
              Enterprise
            </h3>
            <p className="mb-8 text-xs text-gray-400">
              {language === "de" ? "3.000+ Mitglieder" : "3,000+ members"}
            </p>

            <p className="flex items-center text-3xl font-semibold">
              {language === "de" ? "INDIVIDUELL" : "CUSTOM"}
            </p>
            <p className="mb-8 text-sm text-gray-500">
              {language === "de" ? "individuelle Preisgestaltung" : "tailored pricing"}
            </p>

            <ul className="mb-8 space-y-3 text-sm text-gray-700">
              <li>
                {language === "de"
                  ? "• Alles aus Professional"
                  : "• Everything in Business"}
              </li>
              <li>
                {language === "de"
                  ? "• ERP- / Kernbanken-Integration"
                  : "• ERP / core banking integration"}
              </li>
              <li>
                {language === "de" ? "• SLA-Garantie" : "• SLA guarantee"}
              </li>
              <li>
                {language === "de"
                  ? "• Persönlicher Account-Manager"
                  : "• Dedicated account manager"}
              </li>
            </ul>

            <button className="w-full py-3 transition border rounded-lg hover:bg-black hover:text-white">
              {language === "de" ? "Kontakt aufnehmen" : "Get in Touch"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
