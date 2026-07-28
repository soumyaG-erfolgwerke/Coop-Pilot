import { useState, useCallback } from "react";

/**
 * Reusable hook to manage captcha token state and resets.
 */
export function useCaptcha() {
  const [captchaToken, setCaptchaToken] = useState("");

  const resetCaptcha = useCallback(() => {
    setCaptchaToken("");
  }, []);

  const handleCaptchaSolved = useCallback((token) => {
    setCaptchaToken(token);
  }, []);

  const handleCaptchaFailed = useCallback(() => {
    setCaptchaToken("");
  }, []);

  return {
    captchaToken,
    setCaptchaToken,
    resetCaptcha,
    handleCaptchaSolved,
    handleCaptchaFailed,
  };
}
