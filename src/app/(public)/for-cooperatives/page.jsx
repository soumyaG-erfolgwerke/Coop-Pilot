import CoopHero from "@/components/cooperatives/CoopHero";
import Governance from "@/components/cooperatives/Governance";
import MembersAndShares from "@/components/cooperatives/MembersAndShares";
import MemberPortal from "@/components/cooperatives/MemberPortal";
import ROICalculator from "@/components/cooperatives/ROICalculator";
import TransformCoop from "@/components/cooperatives/TransformCoop";
import React from "react";

const Page = () => {
  return (
    <div>
      <CoopHero />
      <MembersAndShares />
      <Governance />
      <MemberPortal />
      <ROICalculator />
      <TransformCoop />
    </div>
  );
};

export default Page;
