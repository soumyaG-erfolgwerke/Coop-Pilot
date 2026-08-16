/**
 **STEP 0: Fetch Subscription and Payment Details for Coop
 * Uses: Stripe Billing, Appwrite Database
 * Purpose: Fetch details to determine whether coop is onboarded/subscribed.
 * Fires when: A CoopAdmin visits the Subscriptions tab in Dashboard.
 * UX Notes:
 *  - If the Coop is not onboarded, show "Complete Onboarding" button.
 *  - If the Coop is onboarded but not subscribed, show "Subscribe" button.
 *  - If the Coop is subscribed, show "Manage Subscription" button.
 */

import {
  COLLECTION_ID_COOP_PAYMENT_CREDENTIALS,
  COLLECTION_ID_COOP_SUBSCRIPTIONS,
  COLLECTION_ID_SUBSCRIPTION_PLANS,
  createAdminClient,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { getAuthenticatedProfile } from "@/lib/helpers/_helpers";
import { STRIPE_AUTH_ROLES } from "@/lib/stripe/constants";
import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { requireStripeCoopAccess } from "@/lib/auth/stripe-access";
import { sessionErrorResponse } from "@/lib/auth/session";

export const GET = async (req, { params }) => {
  try {
    const { coopId } = await params;

    const session = await getAuthenticatedProfile();
    if (!session || !session.role || !STRIPE_AUTH_ROLES.has(session.role)) {
      return NextErrorJson("User unauthorized.", 403);
    }
    await requireStripeCoopAccess(session, coopId);

    const { databases } = createAdminClient();

    const [stripeAccount, subscription] = await Promise.all([
      getStripeAccount(databases, coopId),
      getSubscription(databases, coopId),
    ]);

    const hasAccount = !!stripeAccount?.stripeAccountId;
    const kycCompleted = stripeAccount?.onboardingStatus === "COMPLETED";
    const paymentsEnabled = Boolean(
      stripeAccount?.stripeCapSepaDebit && stripeAccount?.stripeCapTransfers,
    );

    const subStatus = subscription?.stripeSubscriptionStatus;
    const isSubscribed = subStatus === "ACTIVE" || subStatus === "TRIALING";

    let planName = null;
    if (subscription?.billingPlanId) {
      planName = await getPlanDetails(databases, subscription.billingPlanId);
    }

    const payload = {
      account: {
        hasAccount,
        kycCompleted,
        paymentsEnabled,
      },
      subscription: subscription
        ? {
          isActive: isSubscribed,
          status: subStatus,
          planId: subscription.billingPlanId,
          planName: planName,
          expiresAt: subscription.stripeSubscriptionExpiresAt ?? null,
        }
        : null,
      actions: {
        canSubscribe: hasAccount && kycCompleted && paymentsEnabled,
      },
    };

    return NextResponse.json(payload);
  } catch (err) {
    if (err?.status === 401 || err?.status === 403) return sessionErrorResponse(err);
    console.error("Error fetching subscription data:", err);
    return NextErrorJson("Unable to fetch subscription data", 500);
  }
};

/**───────────────── HELPERS ──────────────────────────────────*/
const NextErrorJson = (message, status = 500) =>
  NextResponse.json({ error: message }, { status });

const CREDS_REQS = [
  "onboardingStatus",
  "stripeAccountId",
  "stripeCapSepaDebit",
  "stripeCapTransfers",
];
const SUBS_REQS = [
  "billingPlanId",
  "stripeSubscriptionStatus",
  "stripeSubscriptionExpiresAt",
];

const getStripeAccount = async (databases, coopId) => {
  const doc = await databases
    .getDocument({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID_COOP_PAYMENT_CREDENTIALS,
      documentId: coopId,
      queries: [Query.select(CREDS_REQS)],
    })
    .catch(() => null);

  return doc;
};

const getSubscription = async (databases, coopId) => {
  const doc = await databases
    .listDocuments({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID_COOP_SUBSCRIPTIONS,
      queries: [
        Query.equal("coopId", coopId),
        Query.limit(1),
        Query.select(SUBS_REQS),
      ],
    })
    .catch(() => null);

  return doc?.documents?.[0] ?? null;
};

const getPlanDetails = async (databases, planId) => {
  const doc = await databases
    .getDocument({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID_SUBSCRIPTION_PLANS,
      documentId: planId,
      queries: [Query.select(["planName"])],
    })
    .catch(() => null);

  return doc?.planName ?? null;
};
