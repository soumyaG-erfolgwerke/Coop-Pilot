import FaqSection from "@/components/pricing/FAQ";
import PricingCTA from "@/components/pricing/FinalCTA";
import FoundingPartnerCard from "@/components/pricing/FoundingPartner";
import PricingHero from "@/components/pricing/Hero";
import Plans from "@/components/pricing/Plans";
import React from "react";

const PricingPage = () => {
  return (
    <div>
      <PricingHero />
      <Plans />
      <FoundingPartnerCard />
      <FaqSection />
      <PricingCTA />
    </div>
  );
};

export default PricingPage;
