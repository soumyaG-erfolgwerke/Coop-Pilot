"use client";

import React from "react";
import SectionWrapper from "./components/SectionWrapper";
import Quotation from "@/assets/svg/sidekickicons_quotation-mark.svg";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";

const Quote = () => {
  const { language } = useLanguage();

  const quoteData = {
    text: language === "de"
      ? "Kooperation ist zeitlos. Systeme sollten es auch sein."
      : "Cooperation is timeless. Systems should be too.",
  };

  return (
    <SectionWrapper
      wrapperClassName="bg-[#7c0a29] text-white py-12 md:py-16"
      className="px-6 md:px-12 lg:px-16"
      padding={false}
    >
      <div className="flex flex-col items-center w-2/3 gap-6 mx-auto text-center select-none sm:w-1/2 md:w-2/5 md:gap-10">
        {/* Quote Icon */}
        <span className="relative">
          <Image
            src={Quotation}
            alt="Quotation"
            width={100}
            height={100}
            className="object-contain"
          />
        </span>

        {/* Quote Text */}
        <h2 className="max-w-2xl text-2xl font-medium leading-snug tracking-wide sm:text-3xl lg:text-4xl font-abhaya">
          {quoteData.text}
        </h2>
        <div className="w-2/3 h-0.5 bg-gray-300"></div>
      </div>
    </SectionWrapper>
  );
};

export default Quote;
