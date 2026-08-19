// import PricingPage from "@/pages/PricingPage";
// import { Suspense } from "react";

export const metadata = {
  title: "Pricing - CoopPilot",
  description: "Pricing is temporarily unavailable.",
};

export default function Pricing() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center mt-20">
      <h1 className="text-3xl font-bold mb-4">Temporarily Unavailable</h1>
      <p className="text-lg text-gray-600">
        Our pricing page is currently being updated. Please check back later or contact us for details.
      </p>
    </div>
  );

  // return (
  //   <Suspense fallback={<div>Loading...</div>}>
  //     <PricingPage />
  //   </Suspense>
  // );
}
