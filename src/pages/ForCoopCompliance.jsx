"use client";
import HeroImage from "@/assets/images-V2/compliance-hero.png";
import { ButtonFlippedReveal } from "@/components/ui/Buttons";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";

const HeroSection = () => {
  const { language } = useLanguage();

  return (
    <section className="relative w-full">
      <div className="relative w-full h-[475px] sm:h-[calc(100vh-60px)] max-h-[800px]">
        {/* Left Side: Content Column */}
        <div className="absolute top-0 left-0 z-10 flex flex-col col-span-1 m-4 md:my-10 px-6 md:px-16 lg:col-span-5 space-y-6 max-w-xl">
          {/* Breadcrumb */}
          <p className="flex mb-4 text-sm text-gray-500">
            CoopPilot <ChevronRight size={20} /> {language === "de" ? "Compliance" : "Compliance"}
          </p>

          {/* Heading */}
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#5B1C5C] font-normal tracking-tight text-center md:text-left pt-8">
            {language === "de" ? (
              <>
                Rechtssicher gebaut für
                <br />
                deutsche Genossenschaften.
              </>
            ) : (
              <>
                Legally built for <br /> German cooperatives.
              </>
            )}
          </h1>

          {/* Description */}
          <p className="max-w-md font-sans text-sm leading-relaxed text-stone-500 sm:text-base md:text-lg lg:text-xl text-center md:text-left">
            {language === "de"
              ? "Jede Funktion in CoopPilot ist auf echte rechtliche Anforderungen ausgerichtet — Compliance by Design, nicht als nachträglicher Gedanke."
              : "Every feature in CoopPilot is built around real legal requirements — compliance by design, not as an afterthought."}
          </p>
        </div>

        {/* Right Side: Illustration Column */}
        <div className="absolute inset-y-0 right-5 md:right-0 md:w-[80%] w-full h-full">
          <Image
            src={HeroImage}
            alt="Compliance standards and rules graphic layout"
            fill
            className="object-contain object-bottom"
            priority
          />
        </div>
      </div>
    </section>
  );
};

const ComplianceCard = ({ badge, title, description }) => {
  return (
    <div className="flex flex-col items-start gap-4 p-8 transition-all duration-200 bg-white border shadow-sm shadow-[#F0D0DD] rounded-2xl hover:shadow-md hover:shadow-[#F0D0DD]">
      {/* Badge */}
      <div className="px-3 py-1 text-sm font-bold text-[#8A1C3C] bg-[#FDF4F6] border border-[#8A1C3C] rounded-md tracking-wide">
        {badge}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-bold tracking-tight text-gray-900">
          {title}
        </h3>
        <p className="text-sm font-normal leading-relaxed text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
};

const ComplianceCTA = () => {
  const { language } = useLanguage();

  const handleDemoBooking = () => {
    // ORIGINAL DEMO LINK:
    // window.open(
    //   "https://cal.eu/hystandards/30min",
    //   "_blank",
    //   "noopener,noreferrer",
    // );
  };

  return (
    <section className="grid w-full grid-cols-1 overflow-hidden md:grid-cols-[600px_1fr] p-2 bg-[#9C013E] ">
      {/* Left Side: Image Block */}
      <div className="relative min-h-[320px] md:min-h-full">
        <Image
          src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop"
          alt="Compliance and review documentation workspace"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover rounded-lg"
          priority
        />
      </div>

      {/* Right Side: Content Block */}
      <div className="p-8 md:p-10 lg:p-16 flex flex-col justify-center items-center text-center">
        <h2 className="max-w-md mb-5 font-serif text-3xl font-normal leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
          {language === "de" ? "Compliance, die tatsächlich funktioniert." : "Compliance that actually works."}
        </h2>

        <p className="max-w-lg mb-8 font-sans text-sm font-light leading-relaxed text-white/85 sm:text-base md:text-lg lg:text-xl">
          {language === "de"
            ? "Buchen Sie eine Demo und wir zeigen Ihnen, wie CoopPilot alle rechtlichen Anforderungen für Ihren speziellen Genossenschaftstyp erfüllt."
            : "Book a demo and we'll walk you through how CoopPilot satisfies every legal requirement for your specific cooperative type."}
        </p>

        <ButtonFlippedReveal
          onClick={handleDemoBooking}
          className="px-8 py-3.5 text-base font-semibold rounded-xl bg-white hover:bg-stone-50 active:scale-[0.98] shadow-sm focus:outline-none focus:ring-2 focus:ring-white/40"
        >
          {language === "de" ? "Kostenlose Demo buchen" : "Book Free Demo"}
        </ButtonFlippedReveal>
      </div>
    </section>
  );
};

const ForCoopCompliance = () => {
  const { language } = useLanguage();

  const complianceData = [
    {
      id: 1,
      badge: language === "de" ? "DSGVO" : "GDPR",
      title: language === "de" ? "DSGVO-konform" : "GDPR Compliant",
      description: language === "de"
        ? "Sämtliche Datenverarbeitung erfolgt ausschließlich unter der DSGVO. Server in Deutschland. Auftragsverarbeitungsvertrag (AVV) verfügbar. Kein Verkauf personenbezogener Daten, kein Werbe-Targeting. Die Daten Ihrer Mitglieder bleiben Ihre Daten."
        : "All data processed exclusively under GDPR. Servers in Germany. Data Processing Agreement (DPA) available. No sale of personal data, no ad targeting. Your members' data stays yours.",
    },
    {
      id: 2,
      badge: "GoBD",
      title: language === "de" ? "GoBD-konform" : "GoBD Compliant",
      description: language === "de"
        ? "Jede Transaktion von Geschäftsanteilen wird in einem GoBD-konformen, manipulationssicheren Nebenbuch protokolliert. Unveränderbare Historie, DATEV-kompatibler Export. Hält einer Prüfung auf BFH-Niveau stand."
        : "Every share transaction is logged in a GoBD-compliant, tamper-proof subsidiary ledger. Immutable history, DATEV-compatible export. Passes BFH-level scrutiny.",
    },
    {
      id: 3,
      badge: "DATEV",
      title: language === "de" ? "DATEV-Integration" : "DATEV Integration",
      description: language === "de"
        ? "Ein-Klick-Export des GoBD-Nebenbuchs im DATEV-kompatiblen Format. Nahtlose Übergabe an Ihren Steuerberater oder Wirtschaftsprüfer. Keine manuelle Formatierung."
        : "One-click export of the GoBD subsidiary ledger in DATEV-compatible format. Seamlessly hand off to your accountant or tax advisor. No manual formatting.",
    },
    {
      id: 4,
      badge: "BEG IV",
      title: language === "de" ? "BEG IV Digitale Mitgliedschaft" : "BEG IV Digital Membership",
      description: language === "de"
        ? "Vollständig digitale Mitgliedsanträge gemäß BEG IV (in Kraft seit 2025). Kein Drucker, keine handschriftliche Unterschrift auf Papier. Mitglieder treten in weniger als 10 Minuten von jedem Gerät aus bei."
        : "Fully digital membership applications compliant with BEG IV (in force since 2025). No printer, no signature on paper. Members join in under 10 minutes from any device.",
    },
    {
      id: 5,
      badge: "QES",
      title: language === "de" ? "Qualifizierte elektronische Signatur" : "Qualified Electronic Signature",
      description: language === "de"
        ? "Prüfungsberichte, Generalversammlungsprotokolle und Mitgliedsurkunden können mit einer qualifizierten elektronischen Signatur (QES) unterzeichnet werden. Rechtlich gleichwertig mit einer handschriftlichen Unterschrift gemäß EU-eIDAS-Verordnung."
        : "Audit reports, assembly minutes, and membership certificates can be signed with a Qualified Electronic Signature (QES). Legally equivalent to a handwritten signature under EU eIDAS regulation.",
    },
    {
      id: 6,
      badge: "GenG",
      title: "GenG §15 §33 §47",
      description: language === "de"
        ? "Mitgliederliste (§15), Pflichten des Aufsichtsrats (§33) und Anforderungen an die Niederschrift der Generalversammlung (§47) werden strukturell erzwungen — nicht nur dokumentiert. Ihre Prozesse sind von Grund auf konform."
        : "Membership register (§15), supervisory board obligations (§33), and assembly minute requirements (§47) are all structurally enforced — not just documented. Your processes are compliant by design.",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center w-full gap-10 mx-auto lg:max-w-[1920px]">
      <HeroSection />
      <div className="grid grid-cols-1 gap-10 px-6 md:px-10 md:grid-cols-2 lg:grid-cols-3">
        {complianceData.map((item) => (
          <ComplianceCard
            key={item.id}
            badge={item.badge}
            title={item.title}
            description={item.description}
          />
        ))}
      </div>
      <ComplianceCTA />
    </div>
  );
};

export default ForCoopCompliance;
