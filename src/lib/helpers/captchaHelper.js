// TrustCaptcha temporarily disabled.
// Google reCAPTCHA is currently the active provider.
// Existing implementation retained for future use.
/*
import { TrustCaptcha } from "@trustcomponent/trustcaptcha-nodejs";

export async function verifyCaptcha(token) {
  try {
    const result = await TrustCaptcha.getVerificationResult(
      process.env.TRUST_CAPTCHA_API_KEY,
      token,
    );

    return result && result.verificationPassed && result.score <= 0.5;
  } catch (error) {
    console.error("TrustCaptcha verification failed:", error);
    return false;
  }
}
*/

import { verifyCaptcha as newVerifyCaptcha } from "../captcha/provider";

/**
 * Validates captcha token through the currently configured provider.
 * Implements a wrapper to keep backward compatibility with all 8 endpoints.
 */
export async function verifyCaptcha(token) {
  return newVerifyCaptcha(token);
}
