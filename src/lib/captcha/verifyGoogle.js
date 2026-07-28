/**
 * Server-side verification for Google reCAPTCHA tokens.
 * Calls Google reCAPTCHA API with strict timeouts.
 */
export async function verifyGoogle(token) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    console.error("[Captcha] Missing RECAPTCHA_SECRET_KEY environment variable.");
    return false;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6-second timeout limit

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }).toString(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[Captcha] Google reCAPTCHA API response error: ${response.status} ${response.statusText}`);
      return false;
    }

    const data = await response.json();
    if (!data.success) {
      console.warn("[Captcha] Google reCAPTCHA verification failed. Errors:", data["error-codes"]);
    }
    return !!data.success;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      console.error("[Captcha] Google reCAPTCHA verification timed out.");
    } else {
      console.error("[Captcha] Google reCAPTCHA verification failed:", error);
    }
    return false;
  }
}
