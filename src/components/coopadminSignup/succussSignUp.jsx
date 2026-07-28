"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Mail, Phone, Building2, User } from "lucide-react";

const SuccessSignUp = () => {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen px-4 pt-24 pb-12 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 sm:pt-28">
      <div className="w-full max-w-2xl">
        {/* Main Card */}
        <div className="overflow-hidden bg-white shadow-2xl dark:bg-slate-800 rounded-3xl">
          {/* Header Section with Gradient */}
          <div className="px-6 py-8 bg-gradient-to-r from-purple-600 to-blue-600 sm:px-10">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg dark:bg-slate-100">
                <CheckCircle2 size={40} className="text-purple-600" />
              </div>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-center text-white sm:text-3xl">
              Account Created Successfully!
            </h1>
            <p className="text-center text-purple-100">
              Welcome to DigiCoop - The Digital Way to Co-operate
            </p>
          </div>

          {/* Content Section */}
          <div className="px-6 py-8 sm:px-10">
            {/* Circular Info Section */}
            <div className="relative mx-auto mb-8">
              <div className="relative flex items-center justify-center mx-auto">
                {/* Content inside circle */}
                <div className="relative z-10 max-w-md px-6 py-8 text-center">
                  <h2 className="mb-4 text-xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text sm:text-2xl">
                    What's Next?
                  </h2>
                  <div className="space-y-3 text-gray-700 dark:text-gray-300">
                    <p className="text-sm leading-relaxed sm:text-base">
                      We will contact you for the final onboarding steps of the
                      coop
                    </p>
                    <div className="pt-3 border-t border-gray-200 dark:border-slate-700">
                      <p className="text-xs font-medium text-gray-600 sm:text-sm dark:text-gray-400">
                        Meanwhile, please login and verify your email and phone
                        number for ease of operations
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={() => router.push("/signinpage")}
                className="w-full px-8 py-3 text-sm font-semibold text-white transition-all duration-300 shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl sm:w-auto hover:from-purple-700 hover:to-blue-700 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800"
              >
                Go to Login
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full px-8 py-3 text-sm font-semibold text-gray-700 transition-all duration-300 bg-white border-2 border-gray-300 shadow-md rounded-xl sm:w-auto dark:bg-slate-700 dark:text-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-slate-700"
              >
                Back to Home
              </button>
            </div>

            {/* Footer Note */}
            <div className="pt-6 mt-8 border-t border-gray-200 dark:border-slate-700">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-primary-dark-900/20">
                <p className="text-xs leading-relaxed text-center text-gray-600 dark:text-gray-400">
                  You will receive an email from our side about the final
                  onboarding steps of your coop.
                  <br />
                  <span className="font-medium">Need help?</span> Please contact
                  our support team if you're facing any issues.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessSignUp;
