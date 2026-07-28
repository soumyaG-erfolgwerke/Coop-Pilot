"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FaqSection() {
  const { language } = useLanguage();
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: language === "de" ? "Gibt es eine kostenlose Testversion?" : "Is there a free trial available?",
      answer: language === "de"
        ? "Ja, CoopPilot bietet eine kostenlose Produktvorstellung an, damit Ihr Team die Funktionsweise der Plattform vor der Auswahl eines Plans kennenlernen kann."
        : "Yes, CoopPilot offers a free product walkthrough so your team can explore how the platform works before choosing a plan.",
    },
    {
      question: language === "de" ? "Können wir unseren Plan später upgraden?" : "Can we upgrade our plan later?",
      answer: language === "de"
        ? "Absolut. Sie können mit dem Plan beginnen, der Ihren aktuellen Anforderungen entspricht, und jederzeit upgraden, wenn Ihre Genossenschaft wächst."
        : "Absolutely. You can start with the plan that fits your current needs and upgrade anytime as your cooperative grows.",
    },
    {
      question: language === "de" ? "Gibt es versteckte Gebühren?" : "Are there any hidden fees?",
      answer: language === "de"
        ? "Nein. Unsere Preise sind transparent und ohne versteckte Kosten. Sie zahlen nur für den Plan und die Dienstleistungen, die Sie wählen."
        : "No. Our pricing is transparent with no hidden charges. You only pay for the plan and services you choose.",
    },
    {
      question: language === "de" ? "Ist Onboarding-Support inbegriffen?" : "Is onboarding support included?",
      answer: language === "de"
        ? "Ja. Wir bieten Onboarding-Unterstützung, um Ihrem Team bei der reibungslosen Einrichtung von Mitgliedern, Workflows und Abläufen zu helfen."
        : "Yes. We provide onboarding guidance to help your team set up members, workflows, and operations smoothly.",
    },
    {
      question: language === "de" ? "Erhalten Mitglieder einen separaten Zugang?" : "Do members get separate access?",
      answer: language === "de"
        ? "Ja. Jedes Mitglied erhält einen eigenen sicheren Zugang und Berechtigungen basierend auf seiner Rolle innerhalb der Genossenschaft."
        : "Yes. Each member receives their own secure access and permissions based on their role within the cooperative.",
    },
    {
      question: language === "de" ? "Eignet sich CoopPilot auch für kleine Genossenschaften?" : "Can CoopPilot work for small cooperatives?",
      answer: language === "de"
        ? "Ja. CoopPilot ist sowohl für kleine Genossenschaften als auch für größere Organisationen konzipiert und bietet flexible Pläne, die auf Ihre Bedürfnisse zugeschnitten sind."
        : "Yes. CoopPilot is designed for both small cooperatives and larger organizations, with flexible plans based on your needs.",
    },
  ];

  const toggleAccordion = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  const openAll = () => {
    // if everything already open -> close all
    if (openIndex === "all") {
      setOpenIndex(null);
    } else {
      setOpenIndex("all");
    }
  };

  return (
    <section className="bg-[#f5f5f5] py-20 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Heading */}
        <h2 className="font-serif text-4xl text-center text-neutral-800">
          {language === "de" ? "Fragen? Wir haben Antworten." : "Questions? We've got answers."}
        </h2>

        {/* FAQ List */}
        <div className="mt-14">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index || openIndex === "all";

            return (
              <div key={index} className="py-2 border-b border-neutral-300">
                <button
                  onClick={() => toggleAccordion(index)}
                  className={`w-full text-left transition-all ${
                    isOpen ? "bg-[#f8f4d6]" : "bg-transparent"
                  }`}
                >
                  {/* Question */}
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-6">
                      <span className="text-sm text-neutral-700">
                        [{index + 1}]
                      </span>

                      <h3 className="text-lg font-medium md:text-xl text-neutral-800">
                        {faq.question}
                      </h3>
                    </div>

                    {isOpen ? (
                      <Minus className="w-5 h-5" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                  </div>

                  {/* Answer */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isOpen ? "max-h-40 pb-6 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="pl-[60px] pr-12">
                      <p className="max-w-2xl text-sm leading-relaxed text-neutral-700">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom Buttons */}
        <div className="flex justify-center gap-5 mt-16">
          <button
            onClick={openAll}
            className="px-8 py-3 font-medium text-white transition bg-black rounded-xl hover:opacity-90"
          >
            {openIndex === "all"
              ? (language === "de" ? "Alle schließen" : "Close All")
              : (language === "de" ? "Alle lesen" : "Read All")}
          </button>

          <button className="px-8 py-3 font-medium text-black transition bg-white border border-black rounded-xl hover:bg-neutral-100">
            {language === "de" ? "Fragen stellen" : "Ask anything"}
          </button>
        </div>
      </div>
    </section>
  );
}
