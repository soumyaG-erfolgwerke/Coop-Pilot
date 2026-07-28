"use client";
import React, { useState } from "react";
import {
  Mail,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Sparkles,
  Shield,
  CheckCircle,
  Moon,
  Sun,
} from "lucide-react";

const OnboardingPage1 = ({
  formData,
  handleChange,
  errors,
  onVerifyEmail,
  isVerifying,
  hasNoInvites,
  setHasNoInvites,
  continueBtnRef,
}) => {
  const [timeOfDay, setTimeOfDay] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Check the local time to determine greeting
  React.useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setTimeOfDay("morning");
    } else if (hour >= 12 && hour < 18) {
      setTimeOfDay("afternoon");
    } else {
      setTimeOfDay("evening");
    }
  }, []);

  const getGreeting = () => {
    switch (timeOfDay) {
      case "morning":
        return "Good Morning!";
      case "afternoon":
        return "Good Afternoon!";
      case "evening":
        return `Good Evening!`;
      default:
        return "Good Day!";
    }
  };

  const getTimeIcon = () => {
    switch (timeOfDay) {
      case "morning":
        return <Sun size={48} className="text-yellow-500" />;
      case "afternoon":
        return <Sun size={48} className="text-orange-500" />;
      case "evening":
        return <Moon size={48} className="text-blue-500" />;
      default:
        return <Sun size={48} className="text-gray-500" />;
    }
  };

  const getGradientStyles = () => {
    switch (timeOfDay) {
      case "morning":
        return "from-amber-400 via-orange-400 to-rose-400";
      case "afternoon":
        return "from-blue-400 via-cyan-400 to-teal-400";
      case "evening":
        return "from-indigo-500 via-purple-500 to-pink-500";
      default:
        return "from-blue-500 via-purple-500 to-pink-500";
    }
  };

  if (hasNoInvites) {
    return (
      <div className="relative space-y-8 animate-fadeIn text-center pt-8">
        <div className="absolute inset-0 overflow-hidden -z-10 rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-400 via-red-400 to-orange-400 opacity-5 dark:opacity-10 blur-3xl" />
        </div>

        <div className="relative p-8 border border-gray-200 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl dark:border-gray-700 max-w-lg mx-auto">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-rose-100 dark:bg-rose-900/30">
            <Mail size={40} className="text-rose-500 dark:text-rose-400" />
          </div>

          <h2 className="mb-4 text-2xl font-bold text-gray-800 dark:text-white">
            No Active Invitations Found
          </h2>

          <p className="mb-8 text-gray-600 dark:text-gray-400 leading-relaxed">
            We couldn't find any active cooperative invitations linked to{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {formData.email}
            </span>
            . Please make sure you used the correct email address or contact
            your cooperative administrator to send a new invitation.
          </p>

          <button
            onClick={() => {
              setHasNoInvites(false);
              handleChange({ target: { name: "email", value: "" } });
            }}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white transition-all duration-300 rounded-xl bg-gradient-to-r from-gray-700 to-gray-900 hover:shadow-lg hover:from-gray-800 hover:to-black dark:from-slate-700 dark:to-slate-900 dark:hover:from-slate-600 dark:hover:to-slate-800"
          >
            <ChevronLeft size={20} />
            Try Another Email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 animate-fadeIn">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 overflow-hidden -z-10 rounded-2xl">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${getGradientStyles()} opacity-5 dark:opacity-10 blur-3xl`}
        />
      </div>

      {/* Greeting Section */}
      <div className="relative text-center">
        <div className="relative inline-flex mb-6">
          <div className="relative flex items-center justify-center w-16 h-16 shadow-lg rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
            <Mail size={36} className="text-white" />
          </div>
        </div>

        <h1 className="flex items-center justify-center mb-3 text-4xl font-bold bg-clip-text">
          {getGreeting()} {getTimeIcon()}
        </h1>
        <h2 className="mb-3 text-3xl font-bold text-gray-800 dark:text-white">
          Welcome to{" "}
          <span className="text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
            EasyCoop!
          </span>
        </h2>
        <p className="max-w-md mx-auto mt-2 text-base text-gray-600 dark:text-gray-400">
          Let's get your cooperative account setup. Enter your email to begin
          your journey.
        </p>
      </div>

      {/* Main Form Card */}
      <div className="relative p-6 border border-gray-200 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl dark:border-gray-700">
        <div className="space-y-6">
          {/* Email Input Section */}
          <div className="group">
            <label
              htmlFor="email"
              className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Mail
                  size={20}
                  className={`transition-colors duration-200 ${isFocused ? "text-blue-500" : "text-gray-400"}`}
                />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="name@company.com"
                className={`w-full pl-12 pr-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 border-2 rounded-xl transition-all duration-200 outline-none ${
                  errors.email
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    : isFocused
                      ? "border-blue-500 ring-4 ring-blue-500/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              />
            </div>
            {errors.email && (
              <div className="flex items-center mt-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle size={16} className="mr-1.5" />
                <span>{errors.email}</span>
              </div>
            )}
          </div>

          {/* Continue Button */}
          <button
            ref={continueBtnRef}
            type="button"
            onClick={onVerifyEmail}
            disabled={!formData.email || isVerifying || errors.email}
            className="relative group w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-[2px] transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
          >
            <div className="relative flex items-center justify-center gap-2 px-6 py-3 transition-all duration-300 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 group-hover:bg-gradient-to-r group-hover:from-blue-700 group-hover:to-purple-700">
              {isVerifying ? (
                <>
                  <svg
                    className="w-5 h-5 text-white animate-spin"
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
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="font-semibold text-white">
                    Verifying Email...
                  </span>
                </>
              ) : (
                <>
                  <span className="font-semibold text-white">Continue</span>
                  <ChevronRight
                    size={18}
                    className="text-white transition-transform duration-300 group-hover:translate-x-1"
                  />
                </>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Security Info Card */}
      <div className="relative p-5 overflow-hidden border border-blue-100 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800">
        <div className="absolute top-0 right-0 opacity-10">
          <Shield size={80} />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={18} className="text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              Your Data is Always Safe
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-blue-800 dark:text-blue-200">
            We adhere to all relevant EU and German data protection standards.
            Your information is encrypted and never shared with third parties.
          </p>
        </div>
      </div>

      {/* Help Text */}
      <p className="text-xs text-center text-gray-500 dark:text-gray-500">
        Need help?{" "}
        <a
          href="#"
          className="font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400"
        >
          Contact support
        </a>
      </p>
    </div>
  );
};

export default OnboardingPage1;
