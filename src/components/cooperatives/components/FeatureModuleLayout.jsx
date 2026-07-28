import React from "react";
import SectionWrapper from "@/components/about_v2/components/SectionWrapper";
import { ButtonFlippedRevealV2 } from "@/components/ui/Buttons";
import { Check } from "lucide-react";
import Link from "next/link";

const FeatureModuleLayout = ({
  tag,
  title,
  description,
  checklist = [],
  ctaLink = "https://cal.eu/hystandards/30min",
  ctaText = "Book Free Demo",
  mockupOnLeft = false,
  wrapperBg = "bg-white",
  children,
}) => {
  return (
    <SectionWrapper
      wrapperClassName={`${wrapperBg} py-12 md:py-20 lg:py-24 border-t border-b border-slate-100/60`}
      className="px-6 md:px-12 lg:px-16"
      padding={false}
    >
      <div className="grid items-center w-full grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        
        {/* Mockup Column (if mockupOnLeft is true) */}
        {mockupOnLeft && (
          <div className="w-full lg:col-span-6 order-2 lg:order-1">
            {children}
          </div>
        )}

        {/* Product Copy Column */}
        <div className={`flex flex-col gap-6 text-left lg:col-span-6 ${
          mockupOnLeft ? "order-1 lg:order-2" : "order-1"
        }`}>
          {tag && (
            <div className="text-xs font-bold tracking-wider uppercase text-primary sm:text-sm">
              {tag}
            </div>
          )}

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium leading-tight text-[#043e44] font-abhaya">
            {title}
          </h2>

          <p className="max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg font-dmsans">
            {description}
          </p>

          {/* Checklist */}
          {checklist.length > 0 && (
            <ul className="flex flex-col gap-3.5 font-dmsans text-gray-700">
              {checklist.map((text, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0 mt-0.5">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="text-sm sm:text-base">{text}</span>
                </li>
              ))}
            </ul>
          )}

          {ctaLink && (
            <div className="mt-4">
              <Link href={ctaLink}>
                <ButtonFlippedRevealV2 className="px-8 py-3.5 bg-primary border-2 border-primary text-white hover:bg-primary/95 font-bold transition-all text-center rounded-xl inline-flex items-center justify-center">
                  {ctaText}
                </ButtonFlippedRevealV2>
              </Link>
            </div>
          )}
        </div>

        {/* Mockup Column (if mockupOnLeft is false) */}
        {!mockupOnLeft && (
          <div className="w-full lg:col-span-6 order-2">
            {children}
          </div>
        )}

      </div>
    </SectionWrapper>
  );
};

export default FeatureModuleLayout;
