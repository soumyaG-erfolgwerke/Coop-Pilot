import FeaturesSection from "@/components/home/Features";
import FinalCTA from "@/components/home/FinalCTA";
import Hero from "@/components/home/Hero";
import HowItWorksSection from "@/components/home/HowItWorks";
import ProblemsSection from "@/components/home/Problem";
import ProductInActionSection from "@/components/home/ProductAction";
import TrustComplianceSection from "@/components/home/Trust";
import UseCasesSection from "@/components/home/Usecases";
import WorkflowSection from "@/components/home/Workflow";
import React from "react";

const HomePage = () => {
  return (
    <div>
      <Hero />
      <ProblemsSection />
      <HowItWorksSection />
      <WorkflowSection />
      <FeaturesSection />
      <ProductInActionSection />
      <TrustComplianceSection />
      <UseCasesSection />
      <FinalCTA />
    </div>
  );
};

export default HomePage;
