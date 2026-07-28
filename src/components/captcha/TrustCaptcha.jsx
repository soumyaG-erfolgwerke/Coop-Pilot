"use client";
import React from "react";
import dynamic from "next/dynamic";

const TrustCaptchaComponentDynamic = dynamic(
  () =>
    import("@trustcomponent/trustcaptcha-react").then(
      (mod) => mod.TrustcaptchaComponent
    ),
  { ssr: false }
);

/**
 * TrustCaptcha client-side component wrapper (retained but conditionally disabled).
 */
const TrustCaptcha = (props) => {
  return <TrustCaptchaComponentDynamic {...props} />;
};

export default TrustCaptcha;
