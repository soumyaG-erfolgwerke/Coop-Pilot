"use client";
import React, { useState, useEffect } from "react";
import {
  Mail,
  Phone,
  Check,
  Send,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  emailVerification,
  phoneVerification,
  updatePhoneVerification,
  updateVerificationInProfile,
  checkEmailValidation,
} from "@/lib/coopAdminSignUpServices";

export default function VerificationPage({ user, setIsVerified }) {
  const [emailSent, setEmailSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(
    user?.emailVerification || false
  );
  const [phoneOtp, setPhoneOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(
    user?.phoneVerification || false
  );

  // Derive display values from user prop (not state) so they update when user loads
  const email = user?.email || "Loading...";
  const phone = user?.phone || user?.telephoneNo || "Loading...";

  // Loading states
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Error states
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");

  // Sync verification states when user prop updates (e.g. after login)
  useEffect(() => {
    if (user?.emailVerification !== undefined) {
      setEmailVerified(user.emailVerification);
    }
    if (user?.phoneVerification !== undefined) {
      setPhoneVerified(user.phoneVerification);
    }
  }, [user?.emailVerification, user?.phoneVerification]);

  // Check verification status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const isVerified = await checkEmailValidation();
        setEmailVerified(isVerified);
        if (isVerified && phoneVerified) {
          await updateVerificationInProfile(user.$id);
          setIsVerified(true);
        }
      } catch {
        // Ignore - user will verify manually
      }
    };
    if (!emailVerified) {
      checkStatus();
    }
  }, []); 
  
  const handleSendEmailVerification = async () => {
    setEmailLoading(true);
    setEmailError("");

    try {
      await emailVerification(email);
      setEmailSent(true);
      toast.success("Verification email sent successfully! Check your inbox.");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to send verification email. Please try again.";
      setEmailError(errorMessage);
      toast.error(errorMessage);
      console.error("Email verification error:", error);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleCheckEmailValidation = async () => {
    setEmailCheckLoading(true);
    setEmailError("");
    try {
      const isVerified = await checkEmailValidation();
      setEmailVerified(isVerified);
      if (isVerified) {
        toast.success("Email verified successfully!");
        if (phoneVerified) {
          await updateVerificationInProfile(user.$id);
          setIsVerified(true);
        }
      } else {
        toast.error("Email not verified yet. Please check your inbox.");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to check email verification. Please try again.";
      setEmailError(errorMessage);
      toast.error(errorMessage);
      console.error("Email verification check error:", error);
    } finally {
      setEmailCheckLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setOtpLoading(true);
    setOtpError("");

    try {
      // await new Promise((resolve, reject) => {
      //   setTimeout(() => {
      //     // Simulate random success/failure for demonstration
      //     const success = true; // Change to test error handling
      //     if (success) {
      //       resolve();
      //     } else {
      //       reject(new Error("Failed to send OTP"));
      //     }
      //   }, 1000);
      // });

      await phoneVerification();
      setOtpSent(true);
      toast.success("OTP sent to your phone successfully!");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to send OTP. Please try again.";
      setOtpError(errorMessage);
      toast.error(errorMessage);
      console.error("OTP send error:", error);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (phoneOtp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setVerifyLoading(true);
    setOtpError("");

    try {
      // await new Promise((resolve, reject) => {
      //   setTimeout(() => {
      //     // Simulate random success/failure for demonstration
      //     const success = true; // Change to test error handling
      //     if (success) {
      //       resolve();
      //     } else {
      //       reject(new Error("Invalid OTP"));
      //     }
      //   }, 1000);
      // });

      const res = await updatePhoneVerification(user.$id, phoneOtp);
      if (!res) throw new Error("Phone verification failed");
      setPhoneVerified(true);
      toast.success("Phone verified successfully!");
      if (res) {
        if (emailVerified) {
          await updateVerificationInProfile(user.$id);
          setIsVerified(true);
        }
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Invalid OTP. Please try again.";
      setOtpError(errorMessage);
      toast.error(errorMessage);
      console.error("OTP verification error:", error);
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
              Account Verification
            </h1>
            <p className="mb-8 text-gray-600 dark:text-gray-400">
              Verify your email and phone number to secure your account.
            </p>

            {/* Email Verification Card */}
            <div className="p-6 mb-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-lg bg-tint dark:bg-primary-dark-900/30">
                  <Mail className="w-6 h-6 text-blue-600 dark:text-primary/80" />
                </div>
                <div className="flex-1">
                  <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                    Email Verification
                  </h2>
                  <p className="mb-4 text-gray-600 dark:text-gray-400">
                    We'll send a verification link to your email address. Click
                    the link to verify your email.
                  </p>

                  <div className="mb-4">
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email{" "}
                      <span className="text-gray-400 dark:text-gray-500">
                        required
                      </span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      readOnly
                      className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg cursor-not-allowed bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-300"
                    />
                  </div>

                  {emailError && (
                    <div className="flex items-start gap-2 p-3 mb-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {emailError}
                      </p>
                    </div>
                  )}

                  {emailVerified ? (
                    <div className="flex items-center gap-2 px-4 py-3 text-green-600 rounded-lg bg-green-50 dark:bg-green-900/30 dark:text-green-400">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">
                        Email verified successfully!
                      </span>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={handleSendEmailVerification}
                        disabled={emailSent || emailLoading}
                        className="flex items-center gap-2 px-6 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed dark:bg-primary dark:hover:bg-blue-600"
                      >
                        {emailLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        {emailLoading
                          ? "Sending..."
                          : emailSent
                          ? "Verification Link Sent"
                          : "Send Verification Link"}
                      </button>
                      {emailSent && (
                        <button
                          onClick={handleCheckEmailValidation}
                          disabled={emailCheckLoading}
                          className="px-6 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          {emailCheckLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}{" "}
                          {emailCheckLoading ? "Checking..." : "I've verified"}
                        </button>
                      )}
                    </div>
                  )}

                  {emailSent && !emailVerified && (
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                      Didn't receive the email? Check your spam folder or{" "}
                      <button
                        onClick={handleSendEmailVerification}
                        className="text-blue-600 hover:underline dark:text-primary/80"
                      >
                        resend verification link
                      </button>
                    </p>
                  )}
                  {emailSent && (
                    <div className="p-3 mt-4 border border-yellow-200 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
                      <p className="text-xs text-yellow-800 dark:text-yellow-200">
                        Clicked "I've verified"? Still stucked at not verified
                        status, Log back in.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Phone Verification Card */}
            <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg dark:bg-green-900/30">
                  <Phone className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                    Phone Verification
                  </h2>
                  <p className="mb-4 text-gray-600 dark:text-gray-400">
                    We'll send a one-time password (OTP) to your phone number.
                    Enter the code to verify.
                  </p>

                  <div className="mb-4">
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone{" "}
                      <span className="text-gray-400 dark:text-gray-500">
                        required
                      </span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      disabled
                      readOnly
                      className="w-full px-4 py-2 mb-2 text-gray-600 border border-gray-300 rounded-lg cursor-not-allowed bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-300"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Phone number must start with '+' and maximum of 15 digits.
                    </p>
                  </div>

                  {otpError && (
                    <div className="flex items-start gap-2 p-3 mb-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {otpError}
                      </p>
                    </div>
                  )}

                  {phoneVerified ? (
                    <div className="flex items-center gap-2 px-4 py-3 text-green-600 rounded-lg bg-green-50 dark:bg-green-900/30 dark:text-green-400">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">
                        Phone verified successfully!
                      </span>
                    </div>
                  ) : (
                    <>
                      {!otpSent ? (
                        <button
                          onClick={handleSendOtp}
                          disabled={otpLoading}
                          className="flex items-center gap-2 px-6 py-2 text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed dark:bg-green-500 dark:hover:bg-green-600"
                        >
                          {otpLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          {otpLoading ? "Sending..." : "Send OTP"}
                        </button>
                      ) : (
                        <>
                          <div className="mb-4">
                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                              Enter 6-digit OTP
                            </label>
                            <input
                              type="text"
                              maxLength={6}
                              value={phoneOtp}
                              onChange={(e) =>
                                setPhoneOtp(e.target.value.replace(/\D/g, ""))
                              }
                              placeholder="000000"
                              className="w-full px-4 py-2 font-mono text-2xl tracking-widest text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:focus:ring-green-400"
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={handleVerifyOtp}
                              disabled={phoneOtp.length !== 6 || verifyLoading}
                              className="flex items-center gap-2 px-6 py-2 text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed dark:bg-green-500 dark:hover:bg-green-600"
                            >
                              {verifyLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                              {verifyLoading ? "Verifying..." : "Verify OTP"}
                            </button>
                            <button
                              onClick={handleSendOtp}
                              disabled={otpLoading}
                              className="flex items-center gap-2 px-6 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-200 disabled:cursor-not-allowed dark:text-gray-300 dark:border-slate-600 dark:hover:bg-slate-700 dark:disabled:bg-slate-800"
                            >
                              {otpLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                              {otpLoading ? "Sending..." : "Resend OTP"}
                            </button>
                          </div>
                          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                            OTP expires in 5 minutes. Didn't receive it? Click
                            resend.
                          </p>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Verification Status Summary */}
            <div className="p-4 mt-8 border border-blue-200 rounded-lg bg-blue-50 dark:bg-primary-dark-900/20 dark:border-blue-800">
              <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
                Verification Status
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      emailVerified
                        ? "bg-green-500"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  ></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Email: {emailVerified ? "Verified" : "Not verified"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      phoneVerified
                        ? "bg-green-500"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  ></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Phone: {phoneVerified ? "Verified" : "Not verified"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
