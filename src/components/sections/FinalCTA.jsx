import React from "react";
import { ButtonFlippedReveal } from "@/components/ui/Buttons";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import SectionWrapper from "@/layouts/SectionWrapper";
const CTAImageLeft = "/images/cooperatives.webp";
const CTAImageRight = "/images/cooperativeguy.webp";

const FinalCTA = () => {
  return (
    <div className="bg-[#ebbfe8]">
      <SectionWrapper className="max-w-[1460px] mx-auto  flex gap-4">
        {/* Right Half */}
        <div
          className="w-full bg-center bg-no-repeat bg-cover rounded-lg"
          style={{
            backgroundImage: `url(${CTAImageLeft})`,
          }}
        >
          <div className="relative flex flex-col items-center justify-center w-full h-full gap-8 px-8 py-10 text-white rounded-lg bg-primary/90">
            <h2 className="w-[80%] md:text-left text-center text-3xl md:text-4xl font-semibold leading-[1.1] tracking-normal">
              Transparency that builds trust, every step.
            </h2>
            <div className="flex w-[80%] justify-center md:justify-start">
              <ButtonFlippedReveal
                icon={<ArrowRight />}
                hoverIcon={
                  <ArrowUpRight className="rounded-full text-primary" />
                }
                className="bg-[#EAF2FF] text-primary-dark rounded-xl h-[64px] flex items-center font-semibold py-4 px-6"
              >
                Book a Demo Now
              </ButtonFlippedReveal>
            </div>
          </div>
        </div>
        {/* Left Half */}
        <div
          className="hidden md:block bg-cover bg-center bg-no-repeat w-[40%] rounded-xl"
          style={{ backgroundImage: `url(${CTAImageRight})` }}
        ></div>
      </SectionWrapper>
    </div>
  );
};

export default FinalCTA;
