import { TrustCaptcha } from "@trustcomponent/trustcaptcha-nodejs";

/**
 * Server-side verification for TrustCaptcha tokens.
 * Wraps the existing TrustCaptcha SDK verification.
 */
export async function verifyTrust(token) {
  try {
    const result = await TrustCaptcha.getVerificationResult(
      process.env.TRUST_CAPTCHA_API_KEY,
      token,
    );

    return !!(result && result.verificationPassed && result.score <= 0.5);
  } catch (error) {
    console.error("[Captcha] TrustCaptcha verification failed:", error);
    return false;
  }
}
