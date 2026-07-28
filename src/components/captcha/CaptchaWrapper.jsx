"use client";
import React from "react";
import GoogleCaptcha from "./GoogleCaptcha";
import TrustCaptcha from "./TrustCaptcha";

/**
 * CaptchaWrapper - Orchestrator that decides which captcha to render.
 * Supported values: 'google' | 'trustcaptcha' | 'disabled'
 */
const CaptchaWrapper = (props) => {
  const provider = process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER || "google";

  if (provider === "disabled") {
    return null;
  }

  if (provider === "google") {
    return (
      <GoogleCaptcha
        {...props}
        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
      />
    );
  }

  // Fallback to trustcaptcha if selected or fallback
  return (
    <TrustCaptcha
      {...props}
      sitekey={props.sitekey || process.env.NEXT_PUBLIC_TRUST_CAPTCHA_SITE_KEY}
    />
  );
};

export default CaptchaWrapper;
