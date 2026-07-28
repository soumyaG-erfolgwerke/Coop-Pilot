"use client";

import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";

import manageIcon from "@/assets/images-V2/manage.png";
import memberJoinsIcon from "@/assets/images-V2/memjoins.png";
import decideIcon from "@/assets/images-V2/decide.png";
import trackIcon from "@/assets/images-V2/track.png";

export default function WorkflowSection() {
  const { language } = useLanguage();

  const steps = [
    {
      title: language === "de" ? "Mitglied tritt bei" : "Member Joins",
      icon: memberJoinsIcon,
    },
    {
      title: language === "de" ? "Tracken" : "Track",
      icon: trackIcon,
    },
    {
      title: language === "de" ? "Verwalten" : "Manage",
      icon: manageIcon,
    },
    {
      title: language === "de" ? "Entscheiden" : "Decide",
      icon: decideIcon,
    },
  ];

  return (
    <section className="w-full bg-[#faf9d8] py-12 md:py-20">
      <div className="px-4 mx-auto max-w-7xl">
        {/* Heading */}
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-3xl font-medium text-black md:text-5xl">
            {language === "de" ? (
              <>
                Alles greift in einem System
                <br />
                ineinander
              </>
            ) : (
              <>
                Everything works together in
                <br />
                one system
              </>
            )}
          </h2>

          <p className="max-w-2xl mx-auto mt-5 text-base text-gray-600 md:text-xl">
            {language === "de"
              ? "Vom Onboarding bis zum täglichen Betrieb — alles bleibt verbunden und aktuell."
              : "From onboarding to daily operations — everything stays connected and up to date."}
          </p>
        </div>

        {/* Desktop Layout */}
        <div className="items-center justify-center hidden p-8 mt-14 md:flex">
          {steps.map((step, index) => (
            <div key={step.title} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="relative w-16 h-16 lg:h-20 lg:w-20">
                  <Image
                    src={step.icon}
                    alt={step.title}
                    fill
                    className="object-contain"
                  />
                </div>

                <p className="mt-4 text-lg font-semibold text-black">
                  {step.title}
                </p>
              </div>

              {index !== steps.length - 1 && (
                <div className="flex items-center mx-8 lg:mx-12">
                  <div className="w-16 h-px bg-gray-400 lg:w-24" />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 -ml-1 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile Layout */}
        <div className="flex flex-col items-center gap-6 mt-12 md:hidden">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="flex flex-col items-center"
            >
              <div className="relative h-14 w-14">
                <Image
                  src={step.icon}
                  alt={step.title}
                  fill
                  className="object-contain"
                />
              </div>

              <p className="mt-3 text-base font-semibold">
                {step.title}
              </p>

              {index !== steps.length - 1 && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 mt-4 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 5v14m0 0l-5-5m5 5l5-5"
                  />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}