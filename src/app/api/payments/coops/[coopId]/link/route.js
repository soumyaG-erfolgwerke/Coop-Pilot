/**
 **STEP 1: Create Connected Account ONBOARDING URL
 *
 * Uses: Stripe Connect for Platforms, AccountsV2 API (preview, but recommended)
 * Purpose: When a user(CoopAdmin) needs to accept payments, generate a Stripe-hosted onboarding URL.
 * Fires when: A CoopAdmin clicks "Complete Onboarding" in the Coop Dashboard.
 * UX Notes:
 * CoopAdmin clicks Button → call this API → get URL → redirect to Stripe onboarding.
 * - Case 1: Onboarding failure/expiry → Stripe redirects to "refresh_url"[1].
 * - Case 2: Onboarding success → Stripe redirects to "return_url"[2].
 * Result: A Stripe-hosted onboarding URL that is used by the CoopAdmin to complete onboarding.
 *
 * [1] "refresh_url": Must regenerate a fresh onboarding URL and redirect again.
 *![2] "return_url": CoopAdmin is sent back to the app. This confirms the onboarding is "exited" but not "completed". Must check "requirements" via API or Webhook.
 *
 * Ref: https://docs.stripe.com/connect/saas/tasks/onboard
 * Ref: https://docs.stripe.com/api/v2/core/account-links/create
 */

import {
  COLLECTION_ID_COOP_PAYMENT_CREDENTIALS,
  createAdminClient,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { getAuthenticatedProfile } from "@/lib/helpers/_helpers";
import { stripe } from "@/lib/stripe/client";
import {
  STRIPE_AUTH_ROLES,
  SUBSCRIPTION_TAB_URL,
} from "@/lib/stripe/constants";
import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createStripeAccount } from "./createAccount";

export const POST = async (req, { params }) => {
  try {
    const { coopId } = await params;

    const session = await getAuthenticatedProfile();
    if (!session || !session.role || !STRIPE_AUTH_ROLES.has(session.role)) {
      return NextErrorJson("User unauthorized.", 403);
    }

    const { databases } = createAdminClient();

    let stripeAccountId = await getStripeAccountId(databases, coopId);
    if (!stripeAccountId) {
      stripeAccountId = await createStripeAccount(
        databases,
        coopId,
        session.profileId,
      );
      await upsertPaymentCredentials(databases, coopId, stripeAccountId);
    }

    const accountLink = await stripe.v2.core.accountLinks.create({
      account: stripeAccountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          configurations: ["merchant", "customer"],
          collection_options: { fields: "eventually_due" }, //? Options: ["eventually_due", "currently_due"]
          return_url: `${SUBSCRIPTION_TAB_URL}`,
          refresh_url: `${SUBSCRIPTION_TAB_URL}`,
        },
      },
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextErrorJson(message, 500);
  }
};

/**───────────────── HELPERS ──────────────────────────────────*/

const NextErrorJson = (message, status = 500) =>
  NextResponse.json({ success: false, error: message }, { status });

const getStripeAccountId = async (databases, coopId) => {
  const doc = await databases
    .getDocument({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID_COOP_PAYMENT_CREDENTIALS,
      documentId: coopId,
      queries: [Query.select(["stripeAccountId"])],
    })
    .catch(() => null);

  return doc?.stripeAccountId ?? null;
};

const upsertPaymentCredentials = async (databases, coopId, stripeAccountId) => {
  const payload = {
    stripeAccountId: stripeAccountId,
    onboardingStatus: "PENDING_KYC",
  };

  const result = await databases.upsertDocument({
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_COOP_PAYMENT_CREDENTIALS,
    documentId: coopId,
    data: payload,
  });

  return result;
};
