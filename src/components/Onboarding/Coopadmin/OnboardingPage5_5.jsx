import React, { useState, useEffect } from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const OnboardingPage5_5 = ({ onSuccess }) => {
  const [status, setStatus] = useState("verifying"); // verifying, success

  useEffect(() => {
    // Dummy wait for transaction verification
    const timer = setTimeout(() => {
      setStatus("success");
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1000);
    }, 3000); // 3 seconds dummy wait

    return () => clearTimeout(timer);
  }, [onSuccess]);

  return (
    <div className="max-w-2xl pt-6 mx-auto space-y-8 animate-fadeIn text-center">
      <div className="flex flex-col items-center justify-center p-8 bg-white border shadow-sm dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl">
        {status === "verifying" ? (
          <>
            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-4" />
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
              Verifying Transaction
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Please wait while we verify your transaction details. This might
              take a few moments.
            </p>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4 animate-bounce" />
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
              Verification Successful
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Your transaction details have been verified successfully.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage5_5;
