"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  LogOut,
} from "lucide-react";
import ProxyAssembly from "@/components/memberPage/ProxyAssembly";
import TrustcaptchaComponent from "@/components/shared/TrustCaptchaWrapper";


export default function ProxyDashboardAndLoginPage() {
  const params = useParams();
  const coopId = typeof params?.coopId === "string" ? params.coopId : "";
  const assemblyId =
    typeof params?.assemblyId === "string" ? params.assemblyId : "";
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [proxySession, setProxySession] = useState(null);
  const [proxyUserId, setProxyUserId] = useState("");
  const [proxyPassword, setProxyPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");

  const isDeployment = process.env.NEXT_PUBLIC_NODE_ENV === "production";

  const validateSession = async () => {
    try {
      const response = await fetch("/api/assembly/proxy/session");
      const result = await response.json();

      if (result.success && result.proxy?.assemblyId === assemblyId) {
        // console.log("proxySession: ", result.proxy);
        setProxySession(result.proxy);
      } else {
        setProxySession(null);
      }
    } catch (error) {
      console.error(error);
      setProxySession(null);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    if (coopId && assemblyId) {
      validateSession();
    }
  }, [coopId, assemblyId]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loginLoading) return;

    setLoginLoading(true);
    setError("");

    if (isDeployment && captchaToken.trim() === "") {
      setError("Please complete the CAPTCHA.");
      return;
    }

    try {
      const response = await fetch("/api/assembly/proxy/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proxyUserId: proxyUserId.trim(),
          proxyPassword,
          assemblyId,
          captchaToken,
        }),
      });

      if (!result.success) {
        setCaptchaToken("");
        if (result.error?.includes("already active")) {
          setError(
            "This proxy is already active on another device or network.",
          );
          return;
        }
        throw new Error(result.error || "Login failed");
      }

      await validateSession();
    } catch (error) {
      console.error(error);
      setError(error.message || "Login failed");
      setCaptchaToken("");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/assembly/proxy/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error(error);
    }

    setProxySession(null);

    setProxyUserId("");

    setProxyPassword("");

    setError("");
  };

  if (loadingInitial) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto border-b-2 border-indigo-600 rounded-full w-14 h-14 animate-spin" />
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Validating proxy session...
          </p>
        </div>
      </div>
    );
  }

  if (!proxySession) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-slate-100 dark:bg-slate-950">
        <div className="w-full max-w-md overflow-hidden bg-white border shadow-2xl dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="px-8 text-white bg-indigo-600 py-7 dark:bg-indigo-500">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-2xl">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Proxy Login</h1>
                <p className="mt-1 text-sm text-indigo-100">
                  Assembly proxy authentication
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="mb-6">
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Enter the proxy credentials shared by the assembly member to
                participate on their behalf.
              </p>
            </div>

            {error && (
              <div className="p-4 mb-5 border rounded-2xl border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10">
                <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block mb-2 text-xs font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                  Proxy User ID
                </label>
                <div className="relative">
                  <User className="absolute w-4 h-4 -translate-y-1/2 left-4 top-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={proxyUserId}
                    onChange={(e) => setProxyUserId(e.target.value)}
                    placeholder="PX-XXXXXX"
                    required
                    className="w-full py-3 pr-4 transition-all bg-white border outline-none pl-11 rounded-2xl border-slate-300 dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-xs font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute w-4 h-4 -translate-y-1/2 left-4 top-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={proxyPassword}
                    onChange={(e) => setProxyPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="w-full py-3 pr-12 transition-all bg-white border outline-none pl-11 rounded-2xl border-slate-300 dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute -translate-y-1/2 right-4 top-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
              </div>
            </div>

            <div className="mb-4">
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
              </div>


              <button
                type="submit"
                disabled={loginLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Login As Proxy
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="flex items-center justify-between w-full px-4 py-3 mx-auto max-w-7xl sm:px-6 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex p-2.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold leading-tight tracking-tight sm:text-xl text-slate-900 dark:text-white">
                Proxy Portal
              </h1>
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                Authorized Representative
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex-col items-end hidden md:flex">
              <p className="text-xl font-bold leading-tight text-slate-900 dark:text-white">
                {proxySession?.proxyHolderName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs font-bold tracking-widest uppercase text-slate-400">
                  Id:
                </span>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 truncate max-w-[150px]">
                  {proxySession?.proxyHolderUserId}
                </span>
              </div>
            </div>

            <div className="hidden w-px h-8 bg-slate-200 dark:bg-slate-700 md:block"></div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold transition-all border shadow-sm sm:text-sm text-rose-600 bg-rose-50 hover:bg-rose-100 border-rose-200 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:border-rose-800/50 dark:text-rose-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            >
              <LogOut className="w-4 h-4 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6">
        <ProxyAssembly
          coops={[{ coopId }]}
          isProxyMode={true}
          proxySession={proxySession}
          proxyAssemblyId={assemblyId}
        />
      </div>
    </div>
  );
}
