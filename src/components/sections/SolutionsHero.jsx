"use client";
import React from "react";
import Link from "next/link";
import SectionWrapper from "@/layouts/SectionWrapper";
import AnimatedHeader from "@/components/ui/AnimatedHeader";
import { useRive } from "@rive-app/react-canvas";
import {
  ButtonFlippedReveal,
  ButtonOutlineHoverSolid,
} from "@/components/ui/Buttons";
import { GradientBadge } from "@/components/ui/Badges";
import { Mouse, ArrowRight, ArrowUpRight } from "lucide-react";
const bgImage = "/images/solutions-bg.webp";

const SolutionsHero = () => {
  const { rive, RiveComponent } = useRive({
    src: "/animations/digicoop.riv",
    autoplay: true,
  });
  return (
    <div
      className=""
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <SectionWrapper className="max-w-[1460px] mx-auto flex flex-col lg:flex-row">
        <div className="h-full md:h-[664px]  mt-20 md:mt-0 flex flex-col gap-6 text-center items-center lg:text-start  justify-center lg:items-start lg:w-[50%]">
          <GradientBadge
            text={"Our Solutions"}
            textColor="text-white"
            backgroundColor="from-dark-tint to-primary"
            borderGradient="from-[rgba(0, 0, 150, 0.25)] to-dark-tint"
          />

          <div className="flex flex-wrap items-center justify-center text-4xl font-semibold md:text-5xl lg:text-7xl lg:justify-start">
            <AnimatedHeader
              words={[
                { text: "Handle", isGradient: false },
                { text: "Your Business", isGradient: false },
                { text: "Smarter", isGradient: true, isBreak: true },
              ]}
              className="justify-center text-white lg:justify-start"
              gradient="from-tint to-dark-tint"
            />
          </div>

          <div className="flex flex-col w-full gap-4 mt-4 mb-20 sm:flex-row sm:w-auto">
            <Link href="/choose-role">
            <ButtonFlippedReveal
              icon={<ArrowRight />}
              hoverIcon={
                <ArrowUpRight className="bg-white rounded-full text-primary" />
              }
              backgroundImage="linear-gradient(93.63deg, rgba(255, 255, 255, 0.35) 3.45%, rgba(153, 153, 153, 0) 117.37%)"
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
          <div className="text-tint font-normal text-[16px] leading-[100%] tracking-[-0.022em] capitalize flex gap-1 items-center">
            <Mouse />
            Scroll Down
          </div>
        </div>
        <div className="w-[100%] lg:w-[50%] min-h-100 lg:min-h-0">
          <RiveComponent
            className="rive-wrapper min-h-[400px] !h-full w-full flex items-center justify-center"
            aria-label="Sample Rive Animation"
          />
        </div>
      </SectionWrapper>
    </div>
  );
};

export default SolutionsHero;
