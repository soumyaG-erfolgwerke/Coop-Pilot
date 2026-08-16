/**
 **STEP 2.1: Create Connected Account SUBSCRIPTION CHECKOUT URL
 *
 * Uses: Stripe Billing, Checkout Sessions API
 * Purpose: When a CoopAdmin needs to pay for a subscription, generate a Stripe-hosted Checkout URL.
 * Fires when: A CoopAdmin clicks "Subscribe" in the Coop Dashboard.
 * UX Notes:
 * CoopAdmin clicks Button → call this API → get URL → redirect to Stripe Checkout.
 * - Case 1: Payment failure → Stripe redirects to "cancel_url".
 * - Case 2: Payment success → Stripe redirects to "success_url".
 * Result: A Stripe-hosted Checkout URL that is used by the CoopAdmin to pay.
 *
 * Ref: https://docs.stripe.com/billing/subscriptions/checkout
 */

import {
  COLLECTION_ID_COOP_PAYMENT_CREDENTIALS,
  COLLECTION_ID_SUBSCRIPTION_PLANS,
  createAdminClient,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { getAuthenticatedProfile } from "@/lib/helpers/_helpers";
import { stripe } from "@/lib/stripe/client";
import {
  DEFAULT_CURRENCY,
  STRIPE_AUTH_ROLES,
  SUBSCRIPTION_TAB_URL,
} from "@/lib/stripe/constants";
import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { requireStripeCoopAccess } from "@/lib/auth/stripe-access";
import { sessionErrorResponse } from "@/lib/auth/session";

export const POST = async (req, { params }) => {
  try {
    const { coopId } = await params;
    const { planId } = await req.json();

    const session = await getAuthenticatedProfile();
    if (!session || !session.role || !STRIPE_AUTH_ROLES.has(session.role)) {
      return NextErrorJson("User unauthorized.", 403);
    }
    await requireStripeCoopAccess(session, coopId);

    const { databases } = createAdminClient();

    const coopAccountId = await getCoopAccountId(databases, coopId);
    if (!coopAccountId) {
      return NextErrorJson("Missing coop account ID", 400);
    }

    //* ── Guard: never double-subscribe ────────────────────────────
    const existing = await stripe.subscriptions.list({
      customer_account: coopAccountId,
      status: "active",
      limit: 1,
    });

    if (existing.data.length > 0) {
      return NextResponse.json({
        alreadySubscribed: true,
        subscriptionId: existing.data[0].id,
        status: existing.data[0].status,
      });
    }

    //* ── Fetch Plan Details ────────────────────────────────────────
    const planDoc = await getPlanDetails(databases, planId);
    if (!planDoc || !planDoc.stripePriceId) {
      return NextErrorJson("Invalid plan ID", 400);
    }

    const docId = ID.unique();

    //* ── Create Checkout Session ─────────────────────────────────
    const checkoutSession = await stripe.checkout.sessions.create({
      customer_account: coopAccountId,
      mode: "subscription",
      currency: DEFAULT_CURRENCY,
      payment_method_types: ["sepa_debit", "card"],
      line_items: [{ price: planDoc.stripePriceId, quantity: 1 }],

      success_url: `${SUBSCRIPTION_TAB_URL}`,
      cancel_url: `${SUBSCRIPTION_TAB_URL}`,

      metadata: {
        dc_coopId: coopId,
        dc_planId: planId,
        dc_docId: docId,
      },
      subscription_data: {
        description: `EasyCoop Platform Subscription - ${planDoc.planName}`,
        metadata: {
          dc_coopId: coopId,
          dc_planId: planId,
          dc_docId: docId,
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    if (err?.status === 401 || err?.status === 403) return sessionErrorResponse(err);
    console.error("Stripe subscription checkout failed", err);
    return NextResponse.json({ error: "Unable to create subscription checkout" }, { status: 500 });
  }
};

/**───────────────── HELPERS ──────────────────────────────────*/
const NextErrorJson = (message, status = 500) =>
  NextResponse.json({ error: message }, { status });

const getCoopAccountId = async (databases, coopId) => {
  const result = await databases
    .getDocument({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID_COOP_PAYMENT_CREDENTIALS,
      documentId: coopId,
      queries: [Query.select(["stripeAccountId"])],
    })
    .catch(() => null);

  return result?.stripeAccountId ?? null;
};

const getPlanDetails = async (databases, planId) => {
  const result = await databases.getDocument({
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_SUBSCRIPTION_PLANS,
    documentId: planId,
    queries: [Query.select(["stripePriceId", "planName"])],
  });

  return result;
};
