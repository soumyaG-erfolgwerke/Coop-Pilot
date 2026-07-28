"use client";
import React, { useEffect, useRef } from "react";

/**
 * Client-side widget rendering for Google reCAPTCHA v2.
 * Dynamically loads the reCAPTCHA script and configures callbacks.
 */
const GoogleCaptcha = ({ sitekey, onCaptchaSolved, onCaptchaFailed, captchaToken }) => {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const callbacksRef = useRef({ onCaptchaSolved, onCaptchaFailed });

  // Sync callbacks to mutable ref to avoid triggering effect runs on parent re-renders
  useEffect(() => {
    callbacksRef.current = { onCaptchaSolved, onCaptchaFailed };
  }, [onCaptchaSolved, onCaptchaFailed]);

  useEffect(() => {
    const scriptId = "google-recaptcha-script";
    let script = document.getElementById(scriptId);
    let childDiv = null;

    const renderWidget = () => {
      if (window.grecaptcha && containerRef.current && widgetIdRef.current === null) {
        try {
          // Clear container and append a fresh child node to avoid re-rendering errors
          containerRef.current.innerHTML = "";
          childDiv = document.createElement("div");
          containerRef.current.appendChild(childDiv);

          widgetIdRef.current = window.grecaptcha.render(childDiv, {
            sitekey: sitekey,
            callback: (token) => {
              if (callbacksRef.current.onCaptchaSolved) {
                // Return a mock event structure to keep compatibility with TrustCaptcha detail patterns
                callbacksRef.current.onCaptchaSolved({ detail: token });
              }
            },
            "expired-callback": () => {
              if (callbacksRef.current.onCaptchaFailed) {
                callbacksRef.current.onCaptchaFailed();
              }
            },
            "error-callback": () => {
              if (callbacksRef.current.onCaptchaFailed) {
                callbacksRef.current.onCaptchaFailed();
              }
            },
          });
        } catch (err) {
          console.error("[Captcha] reCAPTCHA render error:", err);
        }
      }
    };

    const initialize = () => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(renderWidget);
      }
    };

    if (!window.grecaptcha) {
      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.onload = initialize;
        document.body.appendChild(script);
      } else {
        const prevOnload = script.onload;
        script.onload = (e) => {
          if (prevOnload) prevOnload(e);
          initialize();
        };
      }
    } else {
      initialize();
    }

    return () => {
      // Clean up reference on unmount
      widgetIdRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [sitekey]);

  // Reset widget if parent clears the token (e.g. on error/reset state)
  useEffect(() => {
    if (window.grecaptcha && widgetIdRef.current !== null && !captchaToken) {
      try {
        window.grecaptcha.reset(widgetIdRef.current);
      } catch (err) {
        console.error("[Captcha] reCAPTCHA reset error:", err);
      }
    }
  }, [captchaToken]);

  return (
    <div 
      ref={containerRef} 
      className="recaptcha-container my-4 flex justify-center md:justify-start" 
      aria-label="Google reCAPTCHA Verification" 
    />
  );
};

export default GoogleCaptcha;
