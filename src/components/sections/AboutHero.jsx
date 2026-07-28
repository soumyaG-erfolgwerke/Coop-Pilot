import React from "react";
const aboutHero = "/images/about-hero.webp";
import { GradientBadge } from "@/components/ui/Badges";
import SectionWrapper from "@/layouts/SectionWrapper";
import AnimatedHeader from "@/components/ui/AnimatedHeader";

const AboutHero = () => {
  return (
    <SectionWrapper className="bg-[linear-gradient(55.96deg,#A2185B,#D48CB9)] text-white pb-16">
      <div className="flex flex-col items-center gap-5 py-10 text-center">
        <GradientBadge
          text={"Meet Team DigiCoop"}
          // backgroundColor="from-[#467FFD] to-[#EAF2FF]"
          // borderGradient="from-[rgba(0, 0, 150, 1)] to-dark-tint"
        />
        <div className="max-w-[764px] p-1 px-10">
          <AnimatedHeader
            words={[
              { text: "Carrying", isGradient: false },
              { text: "a", isGradient: false },
              { text: "Legacy", isGradient: false },
              { text: "Into", isGradient: false },
              { text: "the", isGradient: false },
              { text: "Digital", isGradient: false },
              { text: "Future", isGradient: false },
            ]}
            className="text-white text-center text-[28px] md:text-[40px] lg:text-5xl font-semibold leading-none justify-center"
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl md:px-4">
        <div
          className="relative rounded-[30px] overflow-hidden bg-cover bg-center bg-no-repeat px-4 sm:px-8 pt-10 pb-4 md:pb-10 text-white aspect-[8/9] sm:aspect-[16/9] md:aspect-[21/9] flex items-end"
          style={{ backgroundImage: `url(${aboutHero})` }}
        >
          <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-transparent to-primary" />

          <div className="relative z-10 flex flex-wrap items-end w-full sm:justify-start gap-y-2 gap-x-8 sm:gap-10 lg:gap-14">
            <div className="sm:w-[153px]">
              <span className="font-semibold text-custom-neutral-300 text-[14px] md:text-base">
                Location
              </span>
              <br />
              <span className="text-base font-semibold text-white md:text-xl">
                Berlin, Germany
              </span>
            </div>
            <div className="sm:w-[153px]">
              <span className="font-semibold text-custom-neutral-300 text-[14px] md:text-base">
                Founded By
              </span>
              <br />
              <span className="text-base font-semibold text-white md:text-xl">
                John Doe
              </span>
            </div>
            <div className="sm:w-[153px]">
              <span className="font-semibold text-custom-neutral-300 text-[14px] md:text-base">
                Founded in
              </span>
              <br />
              <span className="text-base font-semibold text-white md:text-xl">
                2025
              </span>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default AboutHero;
