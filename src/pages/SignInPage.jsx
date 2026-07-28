"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  LogIn,
  PlusCircle,
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Send,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

import FadePopUp from "@/components/FadePopUp";
import { createRecovery, updatePassword } from "@/lib/forgetPasswordLink";
import TrustcaptchaComponent from "@/components/shared/TrustCaptchaWrapper";
import { useLanguage } from "@/contexts/LanguageContext";

// CONFIGURATION: Set to true for link-based recovery, false for OTP-based recovery
const VIA_LINK = true;

//! --- Link Set Password Modal Component ---

const LinkSetPasswordModal = ({ isOpen, onClose, searchParams }) => {
  const { language } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const [captchaToken, setCaptchaToken] = useState("");
  const isDeployment = process.env.NEXT_PUBLIC_NODE_ENV === "production";

  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");

  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setConfirmPassword("");
      setError("");
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError(language === "de" ? "Beide Passwortfelder sind erforderlich." : "Both password fields are required.");
      return;
    }

    if (password.length < 8) {
      setError(language === "de" ? "Das Passwort muss mindestens 8 Zeichen lang sein." : "Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError(language === "de" ? "Die Passwörter stimmen nicht überein." : "Passwords do not match.");
      return;
    }

    if (isDeployment && captchaToken.trim() === "") {
      setError(language === "de" ? "Bitte lösen Sie das CAPTCHA." : "Please complete the CAPTCHA.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await updatePassword(
        userId,
        secret,
        password,
        captchaToken,
      );

      if (response.status === 200) {
        toast.success(
          language === "de"
            ? "Passwort erfolgreich zurückgesetzt! Bitte melden Sie sich mit Ihrem neuen Passwort an."
            : "Password reset successfully! Please sign in with your new password.",
        );
        onClose();
        router.push("/");
      } else {
        setCaptchaToken("");
        toast.error(
          response.message || (language === "de"
            ? "Fehler beim Zurücksetzen des Passworts. Der Link ist möglicherweise abgelaufen."
            : "Failed to reset password. The link may have expired."),
        );
        setError(response.message || (language === "de" ? "Fehler beim Zurücksetzen des Passworts." : "Failed to reset password."));
      }
    } catch (err) {
      setCaptchaToken("");
      toast.error(language === "de" ? "Netzwerkfehler. Bitte versuchen Sie es erneut." : "Network error. Please try again.");
      setError(language === "de" ? "Netzwerkfehler. Bitte versuchen Sie es erneut." : "Network error. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FadePopUp
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName="bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md p-6 bg-white shadow-2xl dark:bg-slate-800 sm:p-8 rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {language === "de" ? "Neues Passwort festlegen" : "Set New Password"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {language === "de" ? "Bitte geben Sie unten Ihr neues Passwort ein." : "Please enter your new password below."}
          </p>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              {language === "de" ? "Neues Passwort" : "New Password"}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2.5 border rounded-md shadow-sm bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              {language === "de" ? "Passwort bestätigen" : "Confirm Password"}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2.5 border rounded-md shadow-sm bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-gray-400"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle size={16} />
              <p>{error}</p>
            </div>
          )}

          {isDeployment && (
            <>
              {/* TrustCaptcha temporarily disabled.
                  Google reCAPTCHA is currently the active provider.
                  Existing implementation retained for future use.
              <TrustcaptchaComponent
                sitekey={process.env.NEXT_PUBLIC_TRUST_CAPTCHA_SITE_KEY}
                onCaptchaSolved={(event) => {
                  setCaptchaToken(event.detail);
                }}
                onCaptchaFailed={() => {
                  setCaptchaToken("");
                }}
              />
              */}
              <TrustcaptchaComponent
                captchaToken={captchaToken}
                onCaptchaSolved={(event) => {
                  setCaptchaToken(event.detail);
                }}
                onCaptchaFailed={() => {
                  setCaptchaToken("");
                }}
              />
            </>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center w-full px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting 
              ? (language === "de" ? "Passwort wird gesetzt..." : "Setting Password...") 
              : (language === "de" ? "Passwort festlegen" : "Set Password")}
          </button>
        </form>
      </div>
    </FadePopUp>
  );
};

//! LinkSetPasswordModal Ends

//! --- OTP Set Password Modal Component ---
//TODO: Solve CORS Error
const OTPSetPasswordModal = ({ isOpen, onClose, email, reset_token }) => {
  const { language } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setConfirmPassword("");
      setError("");
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError(language === "de" ? "Beide Passwortfelder sind erforderlich." : "Both password fields are required.");
      return;
    }

    if (password.length < 8) {
      setError(language === "de" ? "Das Passwort muss mindestens 8 Zeichen lang sein." : "Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError(language === "de" ? "Die Passwörter stimmen nicht überein." : "Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/forget-password/otp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, reset_token, password }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          language === "de"
            ? "Passwort erfolgreich zurückgesetzt! Bitte melden Sie sich mit Ihrem neuen Passwort an."
            : "Password reset successfully! Please sign in with your new password.",
        );
        onClose();
        router.push("/");
      } else {
        toast.error(data.error || (language === "de" ? "Fehler beim Zurücksetzen des Passworts." : "Failed to reset password."));
        setError(data.error || (language === "de" ? "Fehler beim Zurücksetzen des Passworts." : "Failed to reset password."));
      }
    } catch (err) {
      toast.error(language === "de" ? "Netzwerkfehler. Bitte versuchen Sie es erneut." : "Network error. Please try again.");
      setError(language === "de" ? "Netzwerkfehler. Bitte versuchen Sie es erneut." : "Network error. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FadePopUp
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName="bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md p-6 bg-white shadow-2xl dark:bg-slate-800 sm:p-8 rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {language === "de" ? "Neues Passwort festlegen" : "Set New Password"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {language === "de" ? "Bitte geben Sie unten Ihr neues Passwort ein." : "Please enter your new password below."}
          </p>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              {language === "de" ? "Neues Passwort" : "New Password"}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2.5 border rounded-md shadow-sm bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              {language === "de" ? "Passwort bestätigen" : "Confirm Password"}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2.5 border rounded-md shadow-sm bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-gray-400"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle size={16} />
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center w-full px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting 
              ? (language === "de" ? "Passwort wird gesetzt..." : "Setting Password...") 
              : (language === "de" ? "Passwort festlegen" : "Set Password")}
          </button>
        </form>
      </div>
    </FadePopUp>
  );
};

//! OTP SET PASSWORD modal ends

//! --- Enter OTP Modal Component ---
//TODO: Solve CORS Error
const EnterOTPModal = ({ isOpen, onClose, email }) => {
  const { language } = useLanguage();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [verifiedOtp, setVerifiedOtp] = useState("");

  useEffect(() => {
    if (isOpen) {
      setOtp(["", "", "", "", "", ""]);
      setError("");
    }
  }, [isOpen]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError(language === "de" ? "Bitte geben Sie alle 6 Ziffern ein." : "Please enter all 6 digits.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/forget-password/otp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpValue }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(language === "de" ? "OTP erfolgreich verifiziert!" : "OTP verified successfully!");
        setVerifiedOtp(data.reset_token);
        onClose();
        setShowSetPasswordModal(true);
      } else {
        toast.error(data.error || (language === "de" ? "Ungültiges OTP. Bitte versuchen Sie es erneut." : "Invalid OTP. Please try again."));
        setError(data.error || (language === "de" ? "Ungültiges OTP. Bitte versuchen Sie es erneut." : "Invalid OTP. Please try again."));
      }
    } catch (err) {
      toast.error(language === "de" ? "Netzwerkfehler. Bitte versuchen Sie es erneut." : "Network error. Please try again.");
      setError(language === "de" ? "Netzwerkfehler. Bitte versuchen Sie es erneut." : "Network error. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <FadePopUp
        isOpen={isOpen}
        onClose={onClose}
        overlayClassName="bg-black/60 backdrop-blur-sm p-4"
      >
        <div className="w-full max-w-md p-6 bg-white shadow-2xl dark:bg-slate-800 sm:p-8 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {language === "de" ? "OTP eingeben" : "Enter OTP"}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <X size={22} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {language === "de" 
                ? "Wir haben einen 6-stelligen Verifizierungscode gesendet an "
                : "We've sent a 6-digit verification code to "}
              <span className="font-medium text-gray-900 dark:text-white">
                {email}
              </span>
            </p>

            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-xl font-semibold text-center bg-white border-2 border-gray-300 rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-primary focus:border-primary"
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle size={16} />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center w-full px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting 
                ? (language === "de" ? "Validierung..." : "Validating...") 
                : (language === "de" ? "OTP verifizieren" : "Validate OTP")}
            </button>
          </form>
        </div>
      </FadePopUp>

      <OTPSetPasswordModal
        isOpen={showSetPasswordModal}
        onClose={() => setShowSetPasswordModal(false)}
        email={email}
        reset_token={verifiedOtp}
      />
    </>
  );
};

// ! OTP Modal ends

//! --- Link Forgot Password Modal Component ---

const LinkForgotPasswordModal = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setError("");
      setSuccessMessage("");
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!email) {
      setError(language === "de" ? "E-Mail-Adresse ist erforderlich." : "Email address is required.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(language === "de" ? "Bitte geben Sie eine gültige E-Mail-Adresse ein." : "Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await createRecovery(email);

      if (response.status === 200) {
        setSuccessMessage(
          language === "de"
            ? `Wenn ein Konto für ${email} existiert, wurde ein Link zum Zurücksetzen des Passworts gesendet.`
            : `If an account exists for ${email}, a password reset link has been sent.`,
        );
        toast.success(language === "de" ? "Link zum Zurücksetzen gesendet! Überprüfen Sie Ihre E-Mails." : "Password reset link sent! Check your email.");
      } else {
        toast.error(response.message || (language === "de" ? "Fehler beim Senden des Reset-Links." : "Failed to send reset link."));
        setError(response.message || (language === "de" ? "Fehler beim Senden des Reset-Links." : "Failed to send reset link."));
      }
    } catch (err) {
      toast.error(language === "de" ? "Netzwerkfehler. Bitte versuchen Sie es erneut." : "Network error. Please try again.");
      setError(language === "de" ? "Netzwerkfehler. Bitte versuchen Sie es erneut." : "Network error. Please try again.");
      console.log(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FadePopUp
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName="bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md p-6 bg-white shadow-2xl dark:bg-slate-800 sm:p-8 rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {language === "de" ? "Passwort vergessen" : "Forgot Password"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <X size={22} />
          </button>
        </div>

        {!successMessage ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {language === "de"
                ? "Bitte geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link zum Zurücksetzen des Passworts."
                : "Please enter your email address. We will send a password reset link."}
            </p>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border rounded-md shadow-sm bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary"
                placeholder="you@example.com"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle size={16} />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center w-full px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5 mr-2" />{" "}
              {isSubmitting 
                ? (language === "de" ? "Wird gesendet..." : "Sending...") 
                : (language === "de" ? "Reset-Link senden" : "Send Reset Link")}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
            <p className="mb-2 text-lg font-medium text-gray-800 dark:text-gray-100">
              {language === "de" ? "Anfrage gesendet!" : "Request Sent!"}
            </p>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              {successMessage}
            </p>
            <button
              onClick={onClose}
              className="w-full px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              {language === "de" ? "Schließen" : "Close"}
            </button>
          </div>
        )}
      </div>
    </FadePopUp>
  );
};

//! Ends Link Forget PASSWORD modal Componet

//! --- OTP Forgot Password Modal Component ---
//TODO: Solve CORS Error
const OTPForgotPasswordModal = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError(language === "de" ? "E-Mail-Adresse ist erforderlich." : "Email address is required.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(language === "de" ? "Bitte geben Sie eine gültige E-Mail-Adresse ein." : "Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/forget-password/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(language === "de" ? "OTP erfolgreich gesendet! Überprüfen Sie Ihre E-Mails." : "OTP sent successfully! Check your email.");
        setSentEmail(email);
        onClose();
        setShowOTPModal(true);
      } else {
        toast.error(data.error || (language === "de" ? "Fehler beim Senden des OTP." : "Failed to send OTP."));
        setError(data.error || (language === "de" ? "Fehler beim Senden des OTP." : "Failed to send OTP."));
      }
    } catch (err) {
      toast.error(language === "de" ? "Netzwerkfehler. Bitte versuchen Sie es erneut." : "Network error. Please try again.");
      setError(language === "de" ? "Netzwerkfehler. Bitte versuchen Sie es erneut." : "Network error. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <FadePopUp
        isOpen={isOpen}
        onClose={onClose}
        overlayClassName="bg-black/60 backdrop-blur-sm p-4"
      >
        <div className="w-full max-w-md p-6 bg-white shadow-2xl dark:bg-slate-800 sm:p-8 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {language === "de" ? "Passwort vergessen" : "Forgot Password"}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <X size={22} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {language === "de"
                ? "Bitte geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Verifizierungscode."
                : "Please enter your email address. We will send you a verification code."}
            </p>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border rounded-md shadow-sm bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary"
                placeholder="you@example.com"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle size={16} />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center w-full px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5 mr-2" />{" "}
              {isSubmitting 
                ? (language === "de" ? "Wird gesendet..." : "Sending...") 
                : (language === "de" ? "OTP senden" : "Send OTP")}
            </button>
          </form>
        </div>
      </FadePopUp>

      <EnterOTPModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        email={sentEmail}
      />
    </>
  );
};

//! Ends OTP Forgot Password Modal Component

// --- Login Modal Component ---
const LoginModal = ({ isOpen, onClose, onSubmit, onForgotPasswordClick }) => {
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const isDeployment = process.env.NEXT_PUBLIC_NODE_ENV === "production";

  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setPassword("");
      setError("");
      setShowPassword(false);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError(language === "de" ? "E-Mail und Passwort sind erforderlich." : "Email and password are required.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(language === "de" ? "Bitte geben Sie eine gültige E-Mail-Adresse ein." : "Please enter a valid email address.");
      return;
    }

    if (isDeployment && (!captchaToken || captchaToken.trim() === "")) {
      setError(language === "de" ? "Bitte lösen Sie das CAPTCHA." : "Please complete the CAPTCHA.");
      return;
    }
    onSubmit({ email, password, captchaToken, onFail: () => setCaptchaToken("") });
  };

  return (
    <FadePopUp
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName="bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md p-6 bg-white shadow-2xl dark:bg-slate-800 sm:p-8 rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {language === "de" ? "Anmelden" : "Sign In"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              {language === "de" ? "E-Mail-Adresse" : "Email Address"}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border rounded-md shadow-sm bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              {language === "de" ? "Passwort" : "Password"}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2.5 border rounded-md shadow-sm bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle size={16} />
              <p>{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onForgotPasswordClick}
              className="text-sm text-blue-600 hover:underline"
            >
              {language === "de" ? "Passwort vergessen?" : "Forgot your password?"}
            </button>
          </div>

          {isDeployment && (
            <>
              {/* TrustCaptcha temporarily disabled.
                  Google reCAPTCHA is currently the active provider.
                  Existing implementation retained for future use.
              <TrustcaptchaComponent
                sitekey={process.env.NEXT_PUBLIC_TRUST_CAPTCHA_SITE_KEY}
                onCaptchaSolved={(event) => {
                  setCaptchaToken(event.detail);
                }}
                onCaptchaFailed={() => {
                  setCaptchaToken("");
                }}
              />
              */}
              <TrustcaptchaComponent
                captchaToken={captchaToken}
                onCaptchaSolved={(event) => {
                  setCaptchaToken(event.detail);
                }}
                onCaptchaFailed={() => {
                  setCaptchaToken("");
                }}
              />
            </>
          )}
          <button
            type="submit"
            className="flex items-center justify-center w-full px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <LogIn className="w-5 h-5 mr-2" /> {language === "de" ? "Anmelden" : "Sign in"}
          </button>
        </form>
      </div>
    </FadePopUp>
  );
};

// --- SigninPage ---
const SigninPage = () => {
  const { language } = useLanguage();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] =
    useState(false);
  const [isSetPasswordModalOpen, setIsSetPasswordModalOpen] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for password recovery link on component mount
  useEffect(() => {
    if (VIA_LINK) {
      const recoverPassword = searchParams.get("recoverPassword");
      const userId = searchParams.get("userId");
      const secret = searchParams.get("secret");

      if (recoverPassword === "true" && userId && secret) {
        setIsSetPasswordModalOpen(true);
      }
    }
  }, [searchParams]);

  const handleActualLogin = ({ email, password, captchaToken, onFail }) => {
    const loginPromise = login(email, password, router, captchaToken);

    toast.promise(loginPromise, {
      loading: language === "de" ? "Anmeldung läuft..." : "Logging in...",
      success: () => {
        setIsLoginModalOpen(false);
        router.push("/dashboard");
        return language === "de" ? "Erfolgreich angemeldet!" : "Successfully logged in!";
      },
      error: (err) => {
        if (onFail) onFail();
        return err.message || (language === "de" 
          ? "Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Zugangsdaten." 
          : "Login failed. Please check your credentials.");
      },
    });
  };

  const handleForgotPasswordClick = () => {
    setIsLoginModalOpen(false);
    setIsForgotPasswordModalOpen(true);
  };

  return (
    <div className="flex flex-col justify-center min-h-screen py-12 bg-gray-50 dark:bg-gray-900 sm:px-6 lg:px-8 font-inter">
      <div className="text-center sm:mx-auto sm:w-full sm:max-w-3xl">
        <button className="mb-4 px-4 py-1.5 text-sm font-medium text-blue-700 bg-tint rounded-full cursor-default">
          {language === "de" ? "Wählen Sie eine Option" : "Choose an option"}
        </button>
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl dark:text-white">
          {language === "de" ? "Digitale Tools für moderne Genossenschaften" : "Digital tools for modern cooperatives"}
        </h2>
        <p className="max-w-xl mx-auto mt-3 text-gray-600 text-md sm:text-lg dark:text-gray-400">
          {language === "de"
            ? "Bleiben Sie konform mit den europäischen Vorschriften für Genossenschaften."
            : "Stay compliant with European regulations for cooperatives."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 mt-10 sm:mx-auto sm:w-full sm:max-w-3xl md:grid-cols-2">
        {/* Sign In Option */}
        <div className="flex flex-col items-center p-6 text-center bg-white shadow-lg dark:bg-gray-800 rounded-xl">
          <div className="p-3 mb-4 rounded-full bg-tint dark:bg-primary-dark-900">
            <User className="w-8 h-8 text-blue-600 dark:text-primary/80" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            {language === "de" ? "Anmelden" : "Sign In"}
          </h3>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            {language === "de"
              ? "Greifen Sie auf Ihr Genossenschaftskonto zu und verwalten Sie Ihre Beteiligung."
              : "Access your cooperative account and manage your participation."}
          </p>
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="flex items-center justify-center px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <LogIn className="w-5 h-5 mr-2" /> {language === "de" ? "Anmelden" : "Sign in"}
          </button>
        </div>

        {/* Add Cooperative Option */}
        <div className="flex flex-col items-center p-6 text-center bg-white shadow-lg dark:bg-gray-800 rounded-xl">
          <div className="p-3 mb-4 bg-green-100 rounded-full dark:bg-green-900">
            <PlusCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            {language === "de" ? "Genossenschaft hinzufügen" : "Add Cooperative"}
          </h3>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            {language === "de"
              ? "Registrieren Sie eine neue Genossenschaft, um Mitglieder und Abläufe zu verwalten."
              : "Register a new cooperative to start managing members and operations."}
          </p>
          <button
            onClick={() => router.push("/add-coop")}
            className="flex items-center justify-center px-6 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            <PlusCircle className="w-5 h-5 mr-2" /> {language === "de" ? "Genossenschaft hinzufügen" : "Add Cooperative"}
          </button>
        </div>
      </div>
            {/* Sign Up Link Section */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          {language === "de" ? "Haben Sie noch kein Konto? " : "Don't have an account? "}
          <button
            onClick={() => router.push("/choose-role")}
            className="font-medium text-blue-600 hover:text-blue-500 hover:underline dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            {language === "de" ? "Hier registrieren" : "Sign up here"}
          </button>
        </p>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSubmit={handleActualLogin}
        onForgotPasswordClick={handleForgotPasswordClick}
      />

      {VIA_LINK ? (
        <>
          <LinkForgotPasswordModal
            isOpen={isForgotPasswordModalOpen}
            onClose={() => setIsForgotPasswordModalOpen(false)}
          />
          <LinkSetPasswordModal
            isOpen={isSetPasswordModalOpen}
            onClose={() => {
              setIsSetPasswordModalOpen(false);
              router.push("/");
            }}
            searchParams={searchParams}
          />
        </>
      ) : (
        <OTPForgotPasswordModal
          isOpen={isForgotPasswordModalOpen}
          onClose={() => setIsForgotPasswordModalOpen(false)}
        />
      )}
    </div>
  );
};

export default SigninPage;
