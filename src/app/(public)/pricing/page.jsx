import PricingPage from "@/pages/PricingPage";
import { Suspense } from "react";


export const metadata = {
  title: "Pricing - EasyCoop",
  description: "Learn more about EasyCoop pricing",
};

export default function Pricing() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PricingPage />
    </Suspense>
  );
}
