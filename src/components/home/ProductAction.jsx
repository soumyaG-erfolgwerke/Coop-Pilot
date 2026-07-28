// components/ProductInActionSection.js

"use client";

import { useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";

import adminDashboard from "@/assets/images-V2/admin-dashboard.png";
import memberDashboard from "@/assets/images-V2/member.png";

import {
  ButtonFlippedReveal,
  ButtonOutlineHoverSolid,
} from "@/components/ui/Buttons";
import { ArrowRight, Users } from "lucide-react";

export default function ProductInActionSection() {
  const [view, setView] = useState("admin"); // admin | member
  const { language } = useLanguage();

  const isAdmin = view === "admin";

  return (
    <section className="w-full bg-[#fafafa] py-20 lg:py-28">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-700">
            {language === "de" ? "Produkt in Aktion" : "Product In Action"}
          </p>

          <h2 className="mt-6 font-serif text-4xl leading-tight text-black md:text-5xl lg:text-6xl">
            {language === "de" ? (
              <>
                Sehen Sie, wie Ihre Genossenschaft in
                <br className="hidden md:block" />
                einem System läuft
              </>
            ) : (
              <>
                See how your cooperative runs in
                <br className="hidden md:block" />
                one system
              </>
            )}
          </h2>
        </div>

        {/* Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 mt-12 sm:flex-row">
          {/* ADMIN BUTTON */}
          <div onClick={() => setView("admin")}>
            {isAdmin ? (
              <ButtonFlippedReveal
                className="flex items-center gap-3 px-6 py-3 text-white bg-black rounded-xl"
                icon={<Users size={18} />}
                hoverIcon={<ArrowRight size={18} />}
              >
                {language === "de" ? "Admin-Dashboard" : "Admin Dashboard"}
              </ButtonFlippedReveal>
            ) : (
              <ButtonOutlineHoverSolid
                className="flex items-center gap-3 px-6 py-3 rounded-xl border-[#1e1e1e]"
              >
                {language === "de" ? "Admin-Dashboard" : "Admin Dashboard"}
              </ButtonOutlineHoverSolid>
            )}
          </div>

          {/* MEMBER BUTTON */}
          <div onClick={() => setView("member")}>
            {!isAdmin ? (
              <ButtonFlippedReveal
                className="flex items-center gap-3 px-6 py-3 text-white bg-black rounded-xl"
                icon={<Users size={18} />}
                hoverIcon={<ArrowRight size={18} />}
              >
                {language === "de" ? "Mitglieder-Erfahrung" : "Member Experience"}
              </ButtonFlippedReveal>
            ) : (
              <ButtonOutlineHoverSolid
                className="flex items-center gap-3 px-6 py-3 rounded-xl border-[#1e1e1e]"
              >
                {language === "de" ? "Mitglieder-Erfahrung" : "Member Experience"}
              </ButtonOutlineHoverSolid>
            )}
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="flex justify-center mt-14">
          <div className="relative w-full max-w-6xl overflow-hidden bg-white border-neutral-200">
            <Image
              src={isAdmin ? adminDashboard : memberDashboard}
              alt={
                isAdmin
                  ? (language === "de" ? "Admin-Dashboard-Vorschau" : "Admin Dashboard Preview")
                  : (language === "de" ? "Mitglieder-Dashboard-Vorschau" : "Member Dashboard Preview")
              }
              priority
              className="object-cover w-full h-auto transition-all duration-300"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
