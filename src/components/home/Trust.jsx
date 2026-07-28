"use client";

import lockIcon from "@/assets/images-V2/lock.png";
import gobdIcon from "@/assets/images-V2/notebook.png";
import datevIcon from "@/assets/images-V2/link-icon.png";
import qesIcon from "@/assets/images-V2/qes.png";
import begIcon from "@/assets/images-V2/beg.png";
import ledgerIcon from "@/assets/images-V2/ledger.png";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TrustComplianceSection() {
  const { language } = useLanguage();

  const complianceItems = [
    {
      icon: lockIcon,
      title: language === "de" ? "DSGVO-konform" : "GDPR Compliant",
      description: language === "de" ? "Server in Deutschland. Kein Werbe-Tracking." : "Servers in Germany. No ad tracking",
    },
    {
      icon: gobdIcon,
      title: language === "de" ? "GoBD-zertifiziert" : "GoBD Certified",
      description: language === "de" ? "Manipulationssicheres Transaktionsbuch" : "Tamper-proof transaction ledger",
    },
    {
      icon: datevIcon,
      title: language === "de" ? "DATEV-Integration" : "DATEV Integration",
      description: language === "de" ? "Ein-Klick-Export, immer bereit" : "One-click export, always ready",
    },
    {
      icon: qesIcon,
      title: language === "de" ? "QES-Signatur" : "QES Signing",
      description: language === "de" ? "Ein-Klick-Export, immer bereit" : "One-click export, always ready",
    },
    {
      icon: begIcon,
      title: language === "de" ? "BEG IV bereit" : "BEG IV Ready",
      description: language === "de" ? "Manipulationssicheres Transaktionsbuch" : "Tamper-proof transaction ledger",
    },
    {
      icon: ledgerIcon,
      title: language === "de" ? "GenG §15 §33" : "GenG §15 §33",
      description: language === "de" ? "Manipulationssicheres Transaktionsbuch" : "Tamper-proof transaction ledger",
    },
  ];

  return (
    <section className="w-full bg-[#EEF3FF] py-20 lg:py-28">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-semibold text-neutral-800">
            {language === "de" ? "Vertrauen & Compliance" : "Trust & Compliance"}
          </p>

          <h2 className="mt-5 font-serif text-4xl leading-tight text-black md:text-5xl lg:text-6xl">
            {language === "de" ? (
              <>
                Gebaut für den nahtlosen Fluss
                <br />
                von Genossenschaften
              </>
            ) : (
              <>
                Built for the seamless flow
                <br />
                of Cooperative
              </>
            )}
          </h2>
        </div>

        {/* Cards */}
        <div className="max-w-6xl mx-auto mt-16">
          {/* First Row */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {complianceItems.slice(0, 4).map((item) => {
              return (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-neutral-100 bg-white px-5 py-5 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-10 h-10 mt-1 shrink-0 rounded-xl bg-orange-50">
                      <Image
                          src={item.icon}
                          alt={item.title}
                          width={50}
                          height={50}
                        />
                    </div>

                    <div>
                      <h3 className="font-semibold text-neutral-900">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Second Row */}
          <div className="flex justify-center mt-8">
            <div className="grid w-full gap-6 sm:grid-cols-2 md:max-w-xl">
              {complianceItems.slice(4).map((item) => {
                return (
                  <div
                    key={item.title}
                    className="group rounded-2xl border border-neutral-100 bg-white px-5 py-5 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-10 h-10 mt-1 shrink-0 rounded-xl bg-orange-50">
                        <Image
                          src={item.icon}
                          alt={item.title}
                          width={50}
                          height={50}
                        />
                      </div>

                      <div>
                        <h3 className="font-semibold text-neutral-900">
                          {item.title}
                        </h3>

                        <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
