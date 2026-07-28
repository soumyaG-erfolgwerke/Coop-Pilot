"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Heart, CheckCircle, XCircle, Loader2 } from "lucide-react";

import { updateEmailVerification } from "@/lib/coopAdminSignUpServices";

const VerifyPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyAccount = async () => {
      // Extract search parameters
      const userId = searchParams.get("userId");
      const secret = searchParams.get("secret");

      // Validate parameters
      if (!userId || !secret) {
        setStatus("error");
        setMessage("Invalid verification link. Missing required parameters.");
        return;
      }

      try {
        // API call to backend
        await new Promise((resolve) => setTimeout(resolve, 500));

        const response = await updateEmailVerification(userId, secret);
        if (response) {
          setStatus("success");
          setMessage("Your account has been successfully verified!");
        } else {
          setStatus("error");
          setMessage(
            "Verification failed. The link may have expired or is invalid."
          );
        }
      } catch (error) {
        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            "An error occurred during verification. Please try again later."
        );
      }
    };

    verifyAccount();
  }, [searchParams]);

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gray-50 dark:bg-slate-900">
      <div className="w-full max-w-md">
        <div className="p-8 bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-slate-800 dark:border-slate-700">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div
              className={`flex items-center justify-center w-20 h-20 rounded-full ${
                status === "loading"
                  ? "bg-tint dark:bg-primary-dark-900/30"
                  : status === "success"
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              }`}
            >
              {status === "loading" ? (
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin dark:text-primary/80" />
              ) : status === "success" ? (
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className="mb-4 text-2xl font-bold text-center text-gray-900 dark:text-white">
            {status === "loading"
              ? "Verifying Your Account..."
              : status === "success"
              ? "Verification Successful!"
              : "Verification Failed"}
          </h1>

          {/* Message */}
          <p className="mb-6 text-center text-gray-600 dark:text-gray-400">
            {message ||
              (status === "loading"
                ? "Please wait while we verify your account."
                : "")}
          </p>

          {/* Success Message */}
          {status === "success" && (
            <>
              <div className="flex items-center justify-center gap-2 p-4 mb-6 border border-green-200 rounded-lg bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                <Heart className="w-5 h-5 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  Thank You! We are done here.
                </p>
              </div>

              <button
                onClick={handleGoToDashboard}
                className="w-full px-6 py-3 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-primary dark:hover:bg-blue-600"
              >
                Go to Dashboard
              </button>
            </>
          )}

          {/* Error Actions */}
          {status === "error" && (
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-primary dark:hover:bg-blue-600"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full px-6 py-3 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-300 dark:border-slate-600 dark:hover:bg-slate-700"
              >
                Back to Home
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;
