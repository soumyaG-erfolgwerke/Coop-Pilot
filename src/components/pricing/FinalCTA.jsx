"use client";

import Image from "next/image";
import ctaImg from "@/assets/images-V2/pricingcta.png";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

import {
  ButtonFlippedReveal,
  ButtonOutlineHoverSolid,
} from "@/components/ui/Buttons";
import { ArrowRight, Users } from "lucide-react";

export default function PricingCTA() {
  const { language } = useLanguage();

  return (
    <section className="w-full bg-[#a0003c] px-6 md:px-16">
      <div className="flex gap-10">
        {/* LEFT IMAGE */}
        <div className="flex h-full p-2 rounded-md w-fit">
          <Image
            src={ctaImg}
            alt="Cooperative illustration"
            className="object-fill h-full"
          />
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex-1 w-full py-16 space-y-8 text-center text-white md:text-left">
          <h2 className="max-w-xl mx-auto text-2xl leading-tight text-center md:text-4xl">
            {language === "de"
              ? "Noch unsicher, welcher Plan zu Ihrer Genossenschaft passt?"
              : "Still not sure which plan fits your cooperative?"}
          </h2>
          <h2 className="text-lg leading-tight text-center text-[#e9e3da] md:text-xl">
            {language === "de"
              ? "Wir helfen Ihnen, das passende Setup für Ihr Team zu finden."
              : "Let's help you choose the right setup for your team."}
          </h2>

          {/* BUTTONS */}
          <div className="flex flex-col justify-center gap-4 sm:flex-row ">
            {/* ORIGINAL DEMO LINK: href={"https://www.cal.eu/hystandards/30min"} */}
            <Link href="#" onClick={(e) => e.preventDefault()}>
              <ButtonFlippedReveal
                className="flex items-center justify-center gap-3 px-6 py-3 text-black bg-white rounded-xl"
                isBorder={false}
                isshadow={false}
                icon={<Users size={18} />}
                hoverIcon={<ArrowRight size={18} />}
              >
                {language === "de" ? "Kostenlose Demo buchen" : "Book a Free Demo"}
              </ButtonFlippedReveal>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
