import React from "react";
import Link from "next/link";
import { GradientBadge } from "@/components/ui/Badges.jsx";
import {
  ButtonFlippedReveal,
  ButtonOutlineHoverSolid,
} from "@/components/ui/Buttons.jsx";
import AnimatedText from "@/components/ui/AnimatedText.jsx";
import { Mouse, ArrowRight, ArrowUpRight } from "lucide-react";
import AnimatedHeader from "@/components/ui/AnimatedHeader.jsx";

export default function LeftSection() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 text-center lg:text-start lg:items-start">
      <GradientBadge text={"Built For Cooperatives"} />

      <div className="flex flex-wrap items-center justify-center text-4xl font-semibold md:text-5xl lg:text-7xl lg:justify-start">
        <AnimatedHeader
          words={[
            { text: "Powering", isGradient: false },
            { text: "Cooperative", isGradient: false },
            { text: "Digital", isGradient: false },
          ]}
          className="justify-center text-4xl font-semibold text-black md:text-5xl md:justify-start lg:text-7xl"
        />
        <AnimatedText />
      </div>

      <p className="max-w-2xl mt-4 text-gray-400 text-md md:text-lg">
        Securely Join, Manage And Govern Cooperatives — From Share Purchases To
        Audit-Ready Documentation — With One Simple, Compliant Platform.
      </p>

      <div className="flex justify-center w-full gap-4 mt-4 mb-20 lg:justify-start md:w-auto">
        <Link href="/choose-role">
        <ButtonFlippedReveal
        // onClick={() => handleNavigation("/choose-role")}
          icon={<ArrowRight />}
          hoverIcon={
            <ArrowUpRight className="bg-white rounded-full text-primary" />
          }
          className={
            "bg-primary text-white rounded-2xl py-5 px-4 h-[58px] flex gap-1 items-center justify-center"
          }
        >
          Get Started
        </ButtonFlippedReveal>
        </Link>
        <ButtonOutlineHoverSolid
          className={
            "h-[58px] rounded-2xl px-4 text-center border-dark-tint text-dark-tint hover:text-white hover:bg-dark-tint"
          }
        >
          Book Demo
        </ButtonOutlineHoverSolid>
      </div>
      <div className="text-custom-neutral-500 font-normal text-[16px] leading-[100%] tracking-[-0.022em] capitalize hidden lg:flex gap-1 items-center">
        <Mouse />
        Scroll Down
      </div>
    </div>
  );
}
