"use client";
import dynamic from "next/dynamic";

// TrustCaptcha wrapper temporarily disabled.
// Google reCAPTCHA is currently the active provider via CaptchaWrapper.
// Existing implementation retained for future use.
/*
const TrustCaptchaWrapper = dynamic(
  () =>
    import("@trustcomponent/trustcaptcha-react").then(
      (mod) => mod.TrustcaptchaComponent
    ),
  { ssr: false }
);
export default TrustCaptchaWrapper;
*/

import CaptchaWrapper from "../captcha/CaptchaWrapper";
export default CaptchaWrapper;
