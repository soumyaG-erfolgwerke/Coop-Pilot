"use client";

import Image from "next/image";
import heroIllustration from "@/assets/images-V2/coop-society.png";
import { ArrowRight, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PricingHero() {
  const { language } = useLanguage();

  return (
    <section className="w-full bg-gradient-to-r from-[#f3eadf] to-[#e7ecd9] py-16 md:py-24">
      <div className="px-8 mx-auto max-w-7xl">
        
        <div className="grid items-center grid-cols-1 gap-12 lg:grid-cols-2">
          
          {/* LEFT CONTENT */}
          <div>
            <p className="flex mb-4 text-sm text-gray-500">
              CoopPilot <ChevronRight size={20} /> {language === "de" ? "Preise" : "Pricing"}
            </p>

            <h1 className="font-serif text-4xl leading-tight text-black sm:text-5xl lg:text-6xl">
              {language === "de" ? (
                <>
                  CoopPilot ist kein Kostenfaktor.
                  <br />
                  Es ist eine Investition in die
                  <br />
                  Zeit Ihres Vorstands.
                </>
              ) : (
                <>
                  CoopPilot isn't a cost.
                  <br />
                  It's an investment in your
                  <br />
                  board's time.
                </>
              )}
            </h1>

            <p className="max-w-xl mt-6 text-base text-gray-600 sm:text-lg">
              {language === "de"
                ? "Es ist eine Investition in die Zeit Ihres Vorstands. Pläne, die sich an Ihre Genossenschaft anpassen. Alle Tarife enthalten das vollständige Mitgliederportal für jedes Mitglied — kostenlos."
                : "It's an investment in your board's time. Plans that scale with your cooperative. All plans include the full member portal for every member — free."}
            </p>

            {/* CTA */}
            <div className="mt-8">
              <button className="px-6 py-3 text-sm font-medium text-black border border-[#8b6b3e] rounded-xl hover:bg-black hover:text-white transition-all duration-300">
                {language === "de"
                  ? "Preise für die Genossenschaftsverwaltung. Der Zugang für Mitglieder ist immer kostenlos →"
                  : "Cooperative admin pricing. Member access is always free →"}
              </button>
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md sm:max-w-lg lg:max-w-xl">
              <Image
                src={heroIllustration}
                alt="Cooperative Illustration"
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