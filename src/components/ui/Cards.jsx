import React from "react";
import { ButtonFlippedReveal } from "../ui/Buttons";
import { ArrowRight, ArrowUpRight } from "lucide-react";
const QuotationVector = "/icons/QuotationVector.svg";
const TestimonialBG = "/images/solutions-bg.webp";

export function SolutionCard({ image, title, subtitle, buttontext }) {
  return (
    <div className="border-2 border-gray-200 bg-tint rounded-xl group/card">
      {/* Image Section */}
      <div className="overflow-hidden rounded-t-lg h-90">
        <div
          className="bg-cover bg-no-repeat h-200 w-250 rounded-lg transform translate-y-[4%] translate-x-[15%] group-hover/card:transform group-hover/card:scale-115 group-hover/card:translate-x-[9%] ease-in-out duration-500"
          style={{ backgroundImage: `url(${image})` }}
        />
        <div />
      </div>

      {/* Content Section */}
      <div className="p-6 duration-500 ease-in-out bg-white rounded-b-xl hover:shadow-lg">
        <h3 className="text-2xl font-semibold leading-tight md:text-4xl">
          {title}
        </h3>
        <p className="max-w-2xl mt-4 mb-2 text-gray-400 text-md md:text-lg">
          {subtitle}
        </p>
        <div>
          <ButtonFlippedReveal
            icon={<ArrowRight />}
            hoverIcon={
              <ArrowUpRight className="bg-white rounded-full text-primary" />
            }
            className="bg-tint text-primary-dark rounded-xl w-full h-[64px] flex items-center justify-center font-semibold"
            fullWidth={true}
            isBorder={false}
            isshadow={false}
          >
            {buttontext}
          </ButtonFlippedReveal>
        </div>
      </div>
    </div>
  );
}

export function QuoteCard({ quote }) {
  const openquotes = (
    <div className="flex gap-1 shrink-0">
      <img
        src={QuotationVector}
        alt="Quote Vector"
        className="w-auto h-8 md:h-24 lg:h-12"
      />
      <img
        src={QuotationVector}
        alt="Quote Vector"
        className="w-auto h-8 md:h-24 lg:h-12"
      />
    </div>
  );

  const closequotes = (
    <div className="flex gap-1 shrink-0 rotate-y-180">
      <img
        src={QuotationVector}
        alt="Quote Vector"
        className="w-auto h-8 md:h-24 lg:h-12"
      />
      <img
        src={QuotationVector}
        alt="Quote Vector"
        className="w-auto h-8 md:h-24 lg:h-12"
      />
    </div>
  );

  return (
    <div className="relative flex md:w-1/2">
      <div className="h-full">{openquotes}</div>

      <div className="flex-1 min-w-0 my-auto text-xl font-medium text-center md:text-2xl">
        <p className="mx-2 my-24 break-words">{quote}</p>
      </div>

      <div className="flex items-end md:h-full">{closequotes}</div>
    </div>
  );
}

export function TestimonialCard({
  efficiency,
  testimonial,
  author,
  designation,
}) {
  return (
    <div className="relative p-6 mx-auto overflow-hidden bg-white shadow-md group rounded-xl">
      {/* Background image layer */}
      <div
        className="absolute inset-0 transition-opacity duration-300 ease-in-out bg-center bg-cover opacity-0 group-hover:opacity-100 bg-blend-hard-light"
        style={{
          backgroundImage: `url('${TestimonialBG}')`,
          backgroundColor: "rgba(255,255,255,0.5)",
        }}
      />

      {/* Content layer */}
      <div className="relative z-10">
        {/* Efficiency Header */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-left text-gray-400 group-hover:text-gray-200">
            Operational efficiency improved by
          </p>
          <h2 className="text-5xl font-bold text-right text-black group-hover:text-white md:text-8xl">
            {efficiency}
          </h2>
        </div>

        <hr className="mb-2 border-gray-600 group-hover:border-gray-200" />

        {/* Testimonial */}
        <p className="text-xl text-left text-gray-800 group-hover:text-gray-200 md:text-2xl">
          {testimonial}
        </p>

        {/* Author */}
        <div className="mt-4">
          <p className="font-medium text-left text-gray-900 group-hover:text-gray-200">
            — {author}
          </p>
          <p className="text-sm text-left text-primary group-hover:text-tint">
            {designation}
          </p>
        </div>
      </div>
    </div>
  );
}
