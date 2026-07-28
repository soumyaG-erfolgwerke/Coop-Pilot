"use client";
import { stripeService } from "@/services/payment/stripeService";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

const STARTER_PLAN_PRICE = "€99.00";
const STARTER_PLAN_ID = "tier_0";

const StatusBadge = ({ status, successText, failText }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border shadow-sm ${
      status
        ? "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
        : "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
    }`}
  >
    <span
      className={`w-1.5 h-1.5 mr-1.5 rounded-full ${status ? "bg-emerald-500" : "bg-rose-500"}`}
    />
    {status ? successText : failText}
  </span>
);

// Dynamic Badge helper for any Stripe subscription status
const SubscriptionStatusBadge = ({ status }) => {
  const normalizedStatus = (status || "").toUpperCase();
  let colorClasses = "bg-neutral-50 text-neutral-700 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-700"; // Default
  if (["ACTIVE", "TRIALING"].includes(normalizedStatus)) {
    colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
  } else if (["PAST_DUE", "PAUSED", "INCOMPLETE"].includes(normalizedStatus)) {
    colorClasses = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
  } else if (
    ["UNPAID", "CANCELED", "INCOMPLETE_EXPIRED"].includes(normalizedStatus)
  ) {
    colorClasses = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800";
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${colorClasses}`}
    >
      {status || "UNKNOWN"}
    </span>
  );
};

const PrimaryButton = ({ children, onClick, disabled, loading }) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    className="
      inline-flex items-center justify-center
      px-4 py-2
      rounded-lg
      bg-neutral-900
      text-white
      text-sm
      font-medium
      transition-all
      duration-200
      hover:bg-neutral-800
      active:scale-[0.98]
      disabled:opacity-50
      disabled:cursor-not-allowed
      disabled:pointer-events-none
      shadow-sm shadow-black/5
      dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200
    "
  >
    {loading ? (
      <>
        <svg
          className="w-4 h-4 mr-2 -ml-1 text-white animate-spin dark:text-neutral-900"
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
        Please wait...
      </>
    ) : (
      children
    )}
  </button>
);

const Card = ({ title, children }) => (
  <div className="overflow-hidden bg-white border shadow-sm border-neutral-200/80 rounded-xl dark:bg-slate-900 dark:border-slate-700">
    <div className="px-6 py-4 border-b bg-neutral-50/50 border-neutral-200/60 dark:bg-slate-800 dark:border-slate-700">
      <h2 className="text-base font-semibold text-neutral-900 dark:text-slate-100">{title}</h2>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const DetailRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
    <span className="text-sm font-medium text-neutral-500 dark:text-slate-400">{label}</span>
    <div className="text-sm font-medium text-neutral-900 dark:text-slate-100">{value}</div>
  </div>
);

const SubscriptionPage = ({ coopId }) => {
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!coopId) return;
    fetchPaymentData();
  }, [coopId]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await stripeService.fetchCoopPaymentData(coopId);
      setPaymentData(data);
    } catch (err) {
      const errMsg = err?.message || "Failed to load payment data";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkStripe = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    const checkPromise = stripeService
      .linkStripeAccount(coopId)
      .then((data) => {
        if (data?.url) {
          window.location.href = data.url;
        } else {
          throw new Error("Stripe configuration url missing.");
        }
      });
    toast.promise(checkPromise, {
      loading: "Preparing connection dashboard...",
      success: "Redirecting to Stripe...",
      error: (err) => err?.message || "Could not launch Stripe account link.",
    });
    try {
      await checkPromise;
    } catch (err) {
      // Handled by toast.promise visual interface
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    const processSubscription = async () => {
      const planId = STARTER_PLAN_ID;
      const data = await stripeService.createSubscription(coopId, planId);
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      await fetchPaymentData();
    };
    const runPromise = processSubscription();
    toast.promise(runPromise, {
      loading: "Setting up your checkout session...",
      success: "Redirecting to checkout...",
      error: (err) => err?.message || "Failed to initiate subscription.",
    });
    try {
      await runPromise;
    } catch (err) {
      // Handled by toast.promise visual interface
    } finally {
      setActionLoading(false);
    }
  };

  const handlePortal = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    const openPortal = stripeService
      .createPortalSession(coopId)
      .then((data) => {
        if (data?.url) {
          window.location.href = data.url;
        } else {
          throw new Error("Billing portal link unavailable.");
        }
      });
    toast.promise(openPortal, {
      loading: "Securing access to portal...",
      success: "Redirecting to portal...",
      error: (err) => err?.message || "Failed to open billing portal.",
    });
    try {
      await openPortal;
    } catch (err) {
      // Handled by toast.promise visual interface
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !coopId) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-neutral-50 dark:bg-slate-950">
        <div className="flex flex-col items-center w-full max-w-md p-8 text-center bg-white border shadow-sm border-neutral-200 rounded-xl dark:bg-slate-900 dark:border-slate-700">
          <svg
            className="w-8 h-8 mb-4 animate-spin text-neutral-500 dark:text-slate-400"
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
          <p className="text-sm font-medium text-neutral-500 dark:text-slate-400 animate-pulse">
            Loading subscription data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-neutral-50 dark:bg-slate-950">
        <div className="w-full max-w-md p-6 text-sm font-medium text-center text-red-700 border border-red-200 shadow-sm rounded-xl bg-red-50 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800">
          {error}
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-neutral-50 dark:bg-slate-950">
        <div className="w-full max-w-md p-8 text-sm font-medium text-center bg-white border shadow-sm border-neutral-200 rounded-xl text-neutral-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400">
          No data available.
        </div>
      </div>
    );
  }

  const {
    account: { hasAccount, kycCompleted, paymentsEnabled } = {},
    subscription,
    actions: { canSubscribe } = {},
  } = paymentData || {};

  const isSubscribed = subscription?.isActive ?? false;
  const subscriptionStatus = subscription?.status ?? null;
  const planName = subscription?.planName ?? null;
  const expiresAt = subscription?.expiresAt ?? null;
  const subscriptionExpiry = expiresAt;
  const hasSubscriptionData = !!subscription && !!subscriptionStatus;

  return (
    <div className="min-h-screen antialiased bg-neutral-50/60 dark:bg-slate-950 selection:bg-neutral-200 dark:selection:bg-slate-800">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <div className="max-w-4xl px-6 py-12 mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-slate-100 sm:text-3xl">
            Billing & Subscription
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-slate-400">
            Manage your Stripe account, subscription, and billing settings.
          </p>
        </div>

        {/* Stripe Account Card */}
        <Card title="Stripe Account">
          <div className="divide-y divide-neutral-100 dark:divide-slate-700">
            <DetailRow
              label="Account Status"
              value={
                <StatusBadge
                  status={hasAccount}
                  successText="Connected"
                  failText="Not Connected"
                />
              }
            />
            <DetailRow
              label="KYC Verification"
              value={
                <StatusBadge
                  status={kycCompleted}
                  successText="Completed"
                  failText="Pending"
                />
              }
            />
            <DetailRow
              label="Payments"
              value={
                <StatusBadge
                  status={paymentsEnabled}
                  successText="Enabled"
                  failText="Disabled"
                />
              }
            />
          </div>
          {!hasAccount && (
            <div className="pt-5 mt-5 border-t border-neutral-100 dark:border-slate-700">
              <PrimaryButton onClick={handleLinkStripe} loading={actionLoading}>
                Connect Stripe
              </PrimaryButton>
            </div>
          )}
          {hasAccount && (!kycCompleted || !paymentsEnabled) && (
            <div className="pt-5 mt-5 border-t border-neutral-100 dark:border-slate-700">
              <PrimaryButton onClick={handleLinkStripe} loading={actionLoading}>
                {"Complete Stripe Setup"}
              </PrimaryButton>
            </div>
          )}
        </Card>

        {/* Subscription Card */}
        <Card title="Subscription">
          {hasSubscriptionData ? (
            <>
              <div className="divide-y divide-neutral-100 dark:divide-slate-700">
                <DetailRow
                  label="Status"
                  value={
                    <SubscriptionStatusBadge status={subscriptionStatus} />
                  }
                />
                {subscriptionExpiry && (
                  <DetailRow
                    label="Expiry / Renewal Date"
                    value={new Date(subscriptionExpiry).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  />
                )}
              </div>
              {planName && (
                <div className="p-5 mt-5 border rounded-xl border-neutral-200 bg-neutral-50/50 dark:border-slate-700 dark:bg-slate-800/50">
                  <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-slate-100">
                    Plan Details
                  </h3>
                  <div className="text-sm divide-y divide-neutral-200/60 dark:divide-slate-700">
                    <DetailRow label="Plan Name" value={planName || "Starter Plan"} />
                    <DetailRow label="Plan Price" value={STARTER_PLAN_PRICE} /> {/* TODO */}
                    <DetailRow label="Billing Period" value={"Monthly"} />
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="p-4 mb-5 border rounded-xl border-neutral-200 bg-neutral-50/50 dark:border-slate-700 dark:bg-slate-800/50">
                <p className="text-sm text-neutral-600 dark:text-slate-400">
                  No active or past subscription data found.
                </p>
              </div>
              <div className="p-5 bg-white border shadow-xs rounded-xl border-neutral-200/80 dark:bg-slate-900 dark:border-slate-700">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-slate-100">
                      {planName || "Starter"} Plan
                    </h3>
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-slate-100">
                      {STARTER_PLAN_PRICE} / month
                    </h3>
                  </div>
                  {canSubscribe && !isSubscribed && (
                    <div>
                      <PrimaryButton
                        onClick={handleSubscribe}
                        loading={actionLoading}
                      >
                        Subscribe Now
                      </PrimaryButton>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Billing Portal Card */}
        {hasAccount && hasSubscriptionData && (
          <Card title="Billing Portal">
            <p className="mb-4 text-sm leading-relaxed text-neutral-500 dark:text-slate-400">
              Access invoices, update payment methods, or review your complete
              billing history.
            </p>
            {/* If status unpaid/past_due/paused and canSubscribe, show a warning card */}
            {hasSubscriptionData &&
              ["UNPAID", "PAST_DUE", "PAUSED"].includes(subscriptionStatus) &&
              canSubscribe && (
                <div className="p-2 mb-4 text-sm border border-red-200 rounded-md text-amber-700 bg-red-50/50 dark:border-red-800 dark:bg-red-950/50 dark:text-amber-300">
                  <p>
                    Something went wrong with your previous payment. Please
                    visit your Billing Portal to update your payment method.
                  </p>
                </div>
              )}
            <PrimaryButton onClick={handlePortal} loading={actionLoading}>
              Open Billing Portal
            </PrimaryButton>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPage;
