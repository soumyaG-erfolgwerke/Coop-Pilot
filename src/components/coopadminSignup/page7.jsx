import React from "react";
import { Lock } from "lucide-react";
import TrustcaptchaComponent from "@/components/shared/TrustCaptchaWrapper";

const Page7 = ({ formData, handleChange, handleCaptchaChange, errors }) => {
  const isDeployment = process.env.NODE_ENV === "production";

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-teal-100 rounded-full dark:bg-teal-900/30">
          <Lock size={32} className="text-teal-600 dark:text-teal-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Set Password
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Create a secure password for your account
        </p>
      </div>

      <div className="space-y-6">
        {/* Password Requirements Box */}
        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50 dark:bg-primary-dark-900/20 dark:border-blue-800 animate-fadeInUp">
          <p className="mb-2 text-sm font-medium text-blue-primary dark:text-blue-200">
            Password Requirements:
          </p>
          <ul className="space-y-1 text-xs text-blue-700 list-disc list-inside dark:text-blue-300">
            <li>Minimum 8 characters</li>
            <li>At least one uppercase letter (A-Z)</li>
            <li>At least one lowercase letter (a-z)</li>
            <li>At least one number (0-9)</li>
            <li>At least one special character (e.g., !@#$%^&*)</li>
          </ul>
        </div>

        {/* Password Field */}
        <div className="animate-fadeInUp">
          <label
            htmlFor="password"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Lock size={18} className="text-gray-400" />
            </div>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password || ""}
              onChange={handleChange}
              placeholder="••••••••"
              className={`mt-1 block w-full pl-10 py-2.5 pr-3 border ${errors.password
                ? "border-red-500"
                : "border-gray-300 dark:border-slate-600"
                } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${errors.password
                  ? "focus:ring-red-500"
                  : "focus:ring-primary dark:focus:ring-primary/80"
                } sm:text-sm transition-all duration-200`}
            />
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="animate-fadeInUp">
          <label
            htmlFor="confirmPassword"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Lock size={18} className="text-gray-400" />
            </div>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword || ""}
              onChange={handleChange}
              placeholder="••••••••"
              className={`mt-1 block w-full pl-10 py-2.5 pr-3 border ${errors.confirmPassword
                ? "border-red-500"
                : "border-gray-300 dark:border-slate-600"
                } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${errors.confirmPassword
                  ? "focus:ring-red-500"
                  : "focus:ring-primary dark:focus:ring-primary/80"
                } sm:text-sm transition-all duration-200`}
            />
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500">
              {errors.confirmPassword}
            </p>
          )}
        </div>
        <div className="mt-4">
          {isDeployment && (
            <>
              {/* TrustCaptcha temporarily disabled.
                  Google reCAPTCHA is currently the active provider.
                  Existing implementation retained for future use.
              <TrustcaptchaComponent
                sitekey={process.env.NEXT_PUBLIC_TRUST_CAPTCHA_SITE_KEY}
                onCaptchaSolved={(event) => {
                  handleCaptchaChange(event.detail);
                }}
                onCaptchaFailed={() => {
                  handleCaptchaChange("");
                }}
              />
              */}
              <TrustcaptchaComponent
                captchaToken={formData.captchaToken}
                onCaptchaSolved={(event) => {
                  handleCaptchaChange(event.detail);
                }}
                onCaptchaFailed={() => {
                  handleCaptchaChange("");
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>

  );
};

export default Page7;
