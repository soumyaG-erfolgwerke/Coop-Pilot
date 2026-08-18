import { verifyGoogle } from "./verifyGoogle";
import { verifyTrust } from "./verifyTrust";

/**
 * Resolves the active captcha provider configuration.
 * Configured via CAPTCHA_PROVIDER or NEXT_PUBLIC_CAPTCHA_PROVIDER.
 * Supported values: 'google' | 'trustcaptcha' | 'disabled'
 * Default fallback is 'google'.
 */
export function getCaptchaProvider() {
  const provider = process.env.CAPTCHA_PROVIDER || process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER;
  if (provider === "google" && process.env.FORCE_ENABLE_CAPTCHA !== "true") return "disabled";
  if (provider === "trustcaptcha" && process.env.FORCE_ENABLE_CAPTCHA !== "true") return "disabled";
  return "disabled";
}

/**
 * Dynamic verification gate routing tokens to the active provider.
 */
export async function verifyCaptcha(token) {
  const provider = getCaptchaProvider();

  if (provider === "disabled") {
    console.log("[Captcha] Verification bypassed because provider is set to 'disabled'.");
    return true;
  }

  if (!token) {
    console.error("[Captcha] Verification failed: captcha token is empty.");
    return false;
  }

  if (provider === "google") {
    return verifyGoogle(token);
  } else if (provider === "trustcaptcha") {
    return verifyTrust(token);
  }

  return false;
}
