"use client";

import { Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FoundingPartnerCard() {
  const { language } = useLanguage();

  const leftFeatures = language === "de" 
    ? ["Keine Einrichtungsgebühr (erlassen)", "Produkt-Mitgestaltung"]
    : ["No setup fee (waived)", "Product co-creation"];

  const rightFeatures = language === "de"
    ? ["Dauerhafter Rabatt", "Gründungspartner-Abzeichen"]
    : ["Permanent discount", "Founding Partner badge"];

  return (
    <section className="bg-[#dce4ff] py-20 px-8">
      <div className="max-w-4xl px-8 py-16 mx-auto bg-white shadow-sm rounded-xl">
        {/* Heading */}
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-4xl leading-tight text-black md:text-5xl">
            {language === "de"
              ? "Die ersten 10 Genossenschaften erhalten dauerhafte Vorteile."
              : "First 10 cooperatives get permanent benefits."}
          </h2>

          <p className="mt-8 text-lg font-medium leading-relaxed text-neutral-500">
            {language === "de"
              ? "Werden Sie Gründungspartner: dauerhaft rabattierte Preise, direkter Einfluss auf die Produkt-Roadmap und ein Gründungspartner-Abzeichen auf Ihrem Genossenschaftsprofil."
              : "Be a founding partner: permanently discounted pricing, direct roadmap influence, and a Founding Partner badge on your cooperative profile"}
          </p>
        </div>

        {/* Features */}
        <div className="grid gap-8 mt-14 md:grid-cols-2 md:px-20">
          <div className="space-y-6">
            {leftFeatures.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <Check className="w-6 h-6 text-black" strokeWidth={2.5} />
                <span className="text-2xl font-medium text-black">
                  {feature}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            {rightFeatures.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <Check className="w-6 h-6 text-black" strokeWidth={2.5} />
                <span className="text-2xl font-medium text-black">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Button */}
        <div className="flex justify-center mt-16">
          <button
            className="
              rounded-2xl
              border
              border-black
              bg-[#f8f5eb]
              px-10
              py-5
              text-xl
              font-semibold
              shadow-[0_4px_10px_rgba(0,0,0,0.12)]
              transition-all
              duration-200
              hover:bg-black
              hover:text-white
              hover:shadow-lg
            "
          >
            {language === "de" ? "Gründungspartner werden" : "Become a Founding Partner"}
          </button>
        </div>
      </div>
    </section>
  );
}