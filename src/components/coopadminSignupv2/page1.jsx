"use client";
import React, { useState } from "react";
import { Mail, ChevronRight, AlertCircle } from "lucide-react";

const Page1 = ({
  formData,
  handleChange,
  errors,
  onVerifyEmail,
  isVerifying,
  continueBtnRef,
}) => {
  const [timeOfDay, setTimeOfDay] = useState("");

  // Check the local time to determine greeting
  React.useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setTimeOfDay("morning");
    } else if (hour >= 12 && hour < 17) {
      setTimeOfDay("afternoon");
    } else {
      setTimeOfDay("evening");
    }
  }, []);

  const getGreeting = () => {
    switch (timeOfDay) {
      case "morning":
        return "Good Morning! ☀️";
      case "afternoon":
        return "Good Afternoon! 🌤️";
      case "evening":
        return "Good Evening! 🌙";
      default:
        return "Good Day!";
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Time-based Greeting */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-tint rounded-full dark:bg-primary-dark-900/30">
          <Mail size={32} className="text-blue-600 dark:text-primary/80" />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-gray-800 dark:text-white">
          {getGreeting()}
        </h1>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Create Your Cooperative Admin Account
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          The first step towards managing your coop the digital way.
        </p>
      </div>

      {/* Email Input Section */}
      <div className="space-y-4">
        <div className="animate-fadeInUp group">
          <label
            htmlFor="email"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Mail size={18} className="text-gray-400" />
            </div>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Geschäftsführer@coop.de"
              className={`mt-1 block w-full pl-10 py-2.5 pr-3 border ${
                errors.email
                  ? "border-red-500"
                  : "border-gray-300 dark:border-slate-600"
              } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${
                errors.email
                  ? "focus:ring-red-500"
                  : "focus:ring-primary dark:focus:ring-primary/80"
              } sm:text-sm transition-all duration-200`}
            />
          </div>
          {errors.email && (
            <p className="flex items-center mt-1 text-xs text-red-500">
              <AlertCircle size={14} className="mr-1" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Next Button */}
        <button
          ref={continueBtnRef}
          type="button"
          onClick={onVerifyEmail}
          disabled={!formData.email || isVerifying || errors.email}
          className="flex items-center justify-center w-full px-6 py-3 text-sm font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg shadow-md group hover:bg-blue-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isVerifying ? (
            <>
              <svg
                className="w-5 h-5 mr-3 -ml-1 text-white animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Verifying Email...
            </>
          ) : (
            <>
              Continue
              <ChevronRight
                size={18}
                className="ml-2 transition-transform duration-200 group-hover:translate-x-1"
              />
            </>
          )}
        </button>
      </div>

      {/* Note Section */}
      <div className="p-4 mt-6 border border-yellow-200 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Note:</strong> We’re open in beta, and your feedback helps us
          improve. Thank you for being here.
        </p>
      </div>

      {/* Info Box */}
      <div className="p-4 mt-4 border border-blue-200 rounded-lg bg-blue-50 dark:bg-primary-dark-900/20 dark:border-blue-800">
        <h3 className="mb-2 text-sm font-semibold text-blue-primary dark:text-blue-200">
          Your data is always <span className="text-green-700 ">Safe</span>
        </h3>
        <p className="text-xs text-blue-700 dark:text-blue-300">
          We adhere to all relevant EU and German data protection standards.
        </p>
      </div>
    </div>
  );
};

export default Page1;
