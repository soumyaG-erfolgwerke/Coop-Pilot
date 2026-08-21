"use client";

import Image from "next/image";
import ctaImg from "@/assets/images-V2/ctaImg.png";

import {
  ButtonFlippedReveal,
  ButtonOutlineHoverSolid,
} from "@/components/ui/Buttons";
import { ArrowRight, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

import Link from "next/link";

export default function FinalCTA() {
  const { language } = useLanguage();

  return (
    <section className="w-full bg-[#a0003c] px-6 py-16 md:px-16">
      <div className="grid items-center gap-10 mx-auto md:grid-cols-2">
        {/* LEFT IMAGE */}
        <div className="bg-[#e9e3da] p-2 w-fit rounded-md flex justify-center">
          <Image
            src={ctaImg}
            alt="Cooperative illustration"
            className="object-contain"
          />
        </div>

        {/* RIGHT CONTENT */}
        <div className="space-y-8 text-center text-white md:text-left">
          <h1 className="text-3xl leading-tight text-center md:text-5xl">
            {language === "de"
              ? "Das Betriebssystem für moderne Genossenschaften."
              : "The operating system for modern cooperatives."}
          </h1>

          {/* BUTTONS */}
          <div className="flex flex-col justify-center gap-4 sm:flex-row ">
            <Link href={"/choose-role"}>
              <ButtonFlippedReveal
                className="flex items-center justify-center gap-3 px-6 py-3 text-black bg-white rounded-xl"
                isBorder={false}
                isshadow={false}
                icon={<Users size={18} />}
                hoverIcon={<ArrowRight size={18} />}
              >
                {language === "de" ? "Loslegen" : "Get Started"}
              </ButtonFlippedReveal>
            </Link>

            {/* ORIGINAL DEMO LINK: href={"https://www.cal.eu/hystandards/30min"} */}
            <Link href="#" onClick={(e) => e.preventDefault()}>
              <ButtonOutlineHoverSolid className="flex items-center justify-center gap-2 px-6 py-3 font-medium border-white rounded-xl">
                {language === "de" ? "Demo buchen" : "Book a Demo"}
              </ButtonOutlineHoverSolid>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
