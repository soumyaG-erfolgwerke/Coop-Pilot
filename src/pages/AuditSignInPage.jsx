"use client";

import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  Send,
  User,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

import { useAuth } from "../hooks/useAuth";
import { createRecovery, updatePassword } from "@/lib/forgetPasswordLink";
import TextInput from "../components/orgadminSignup/TextInput";
import TrustcaptchaComponent from "@/components/shared/TrustCaptchaWrapper";

// TODO: Once the backend supports role-specific recovery URLs, point these links
// at the audit/admin reset flow directly instead of reusing the shared signin path.
const RECOVERY_PATH = "/audit/signin";

const LinkSetPasswordModal = ({ isOpen, onClose, searchParams }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const [captchaToken, setCaptchaToken] = useState("");
  const isDeployment = process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_FORCE_ENABLE_CAPTCHA === "true";

  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");

  useEffect(() => {
    setPassword("");
    setConfirmPassword("");
    setError("");
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Both password fields are required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (isDeployment && (!captchaToken || captchaToken.trim() === "")) {
      setError("Please complete the CAPTCHA.");
      return;
    }
    setIsSubmitting(true);

    try {
      // TODO: The backend recovery endpoint still decides where the email link lands.
      // Keep this call here so the UI is functional once that path is wired up.
      const response = await updatePassword(
        userId,
        secret,
        password,
        captchaToken,
      );

      if (response.status === 200) {
        toast.success(
          "Password reset successfully! Please sign in with your new password.",
        );
        onClose();
        router.replace(RECOVERY_PATH);
      } else {
        setCaptchaToken("");
        toast.error(
          response.message ||
            "Failed to reset password. The link may have expired.",
        );
        setError(response.message || "Failed to reset password.");
      }
    } catch (err) {
      setCaptchaToken("");
      toast.error("Network error. Please try again.");
      setError("Network error. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 bg-white border shadow-2xl animate-scaleUp rounded-3xl border-slate-200 shadow-slate-950/20 dark:border-slate-700 dark:bg-slate-800 sm:p-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Set New Password
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
            Enter your new password below.
          </p>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              New Password
            </label>
            <TextInput
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock className="w-5 h-5 text-slate-400" />}
              hasIcon
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Confirm Password
            </label>
            <TextInput
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock className="w-5 h-5 text-slate-400" />}
              hasIcon
            />
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
            className="flex items-center justify-center w-full h-12 px-6 text-sm font-semibold text-white transition bg-blue-600 shadow-lg rounded-xl shadow-blue-600/25 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "Setting Password..." : "Set Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

const LinkForgotPasswordModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");

  const isDeployment = process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_FORCE_ENABLE_CAPTCHA === "true";

  useEffect(() => {
    setEmail("");
    setError("");
    setSuccessMessage("");
    setCaptchaToken("");
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!email) {
      setError("Email address is required.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (isDeployment && !captchaToken) {
      setError("Please complete the CAPTCHA.");
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Update the recovery API to send this audit/admin flow back to RECOVERY_PATH.
      const response = await createRecovery(email, captchaToken);

      if (response.status === 200) {
        setSuccessMessage(
          `If an account exists for ${email}, a password reset link has been sent.`,
        );
        toast.success("Password reset link sent! Check your email.");
      } else {
        toast.error(response.message || "Failed to send reset link.");
        setError(response.message || "Failed to send reset link.");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
      setError("Network error. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 bg-white border shadow-2xl animate-scaleUp rounded-3xl border-slate-200 shadow-slate-950/20 dark:border-slate-700 dark:bg-slate-800 sm:p-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Forgot Password
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        {!successMessage ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
              Enter the email address tied to your auditor or organization admin
              account and we&apos;ll send a reset link.
            </p>

            <div className="relative">
              <TextInput
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                icon={
                  <Mail className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                }
                hasIcon
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle size={16} />
                <p>{error}</p>
              </div>
            )}

            {isDeployment && (
              <TrustcaptchaComponent
                captchaToken={captchaToken}
                onCaptchaSolved={(event) => setCaptchaToken(event.detail)}
                onCaptchaFailed={() => setCaptchaToken("")}
              />
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center w-full h-12 px-6 text-sm font-semibold text-white transition bg-blue-600 shadow-lg rounded-xl shadow-blue-600/25 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <Send className="w-5 h-5 mr-2" />
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
            <p className="mb-2 text-lg font-medium text-slate-800 dark:text-slate-100">
              Request Sent!
            </p>
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
              {successMessage}
            </p>
            <button
              onClick={onClose}
              className="w-full h-12 px-6 text-sm font-semibold text-white transition bg-blue-600 shadow-lg rounded-xl shadow-blue-600/25 hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const AuditSignInPage = () => {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] =
    useState(false);
  const [isSetPasswordModalOpen, setIsSetPasswordModalOpen] = useState(false);

  const isDeployment = process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_FORCE_ENABLE_CAPTCHA === "true";
  
  useEffect(() => {
    setEmail("");
    setPassword("");
    setError("");
  }, []);

  useEffect(() => {
    const recoverPassword = searchParams.get("recoverPassword");
    const userId = searchParams.get("userId");
    const secret = searchParams.get("secret");

    if (recoverPassword === "true" && userId && secret) {
      setIsSetPasswordModalOpen(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (isDeployment && (!captchaToken || captchaToken.trim() === "")) {
      setError("Please complete the CAPTCHA.");
      return;
    }

    setIsSubmitting(true);

    try {
      const loginPromise = login(email, password, router, captchaToken);
      toast.promise(loginPromise, {
        loading: "Signing in...",
        success: "Successfully signed in!",
        error: (err) => {
          setCaptchaToken("");
          return err?.message || "Login failed. Please check your credentials.";
        },
      });

      await loginPromise;
    } catch (err) {
      setCaptchaToken("");
      setError(err?.message || "Login failed. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-[-7rem] top-16 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-[-6rem] left-1/3 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <main className="relative flex items-center justify-center max-w-lg min-h-screen px-4 py-8 mx-auto sm:px-6 lg:px-8 lg:py-12">
        <section className="w-full overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white/90 p-8 shadow-2xl shadow-slate-200/50 backdrop-blur-xl sm:p-12 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-slate-900/50">
          <div className="w-full">
            <div className="mb-10 text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto my-auto mb-6 text-blue-700 rounded-2xl bg-blue-600/10 ring-1 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300">
                <User className="w-8 h-8" />
              </div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                Digicoop Audit Portal
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Welcome back
              </h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                Enter your credentials to securely access the audit dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <TextInput
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  icon={<Mail className="w-5 h-5 text-slate-400" />}
                  hasIcon
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <TextInput
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  icon={<Lock className="w-5 h-5 text-slate-400" />}
                  hasIcon
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-xl bg-red-50 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
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
                className="flex items-center justify-center w-full h-12 px-6 text-sm font-semibold text-white transition bg-blue-600 shadow-lg rounded-xl shadow-blue-600/25 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                <LogIn className="w-5 h-5 mr-2" />
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>

              <button
                type="button"
                onClick={() => setIsForgotPasswordModalOpen(true)}
                className="w-full text-sm font-medium text-blue-600 transition hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
              >
                Forgot your password?
              </button>
            </form>
          </div>
        </section>
      </main>

      <LinkForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={() => setIsForgotPasswordModalOpen(false)}
      />
      <LinkSetPasswordModal
        isOpen={isSetPasswordModalOpen}
        onClose={() => {
          setIsSetPasswordModalOpen(false);
          router.replace(RECOVERY_PATH);
        }}
        searchParams={searchParams}
      />
    </div>
  );
};

export default AuditSignInPage;
