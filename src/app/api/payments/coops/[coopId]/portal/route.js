/**
 **STEP 2.2: Create Connected Account SUBSCRIPTION PORTAL URL
 *
 * Uses: Stripe Billing, Customer Portal API
 * Purpose: When CoopAdmin needs to manage their subscription, generate a Stripe-hosted Customer Portal URL.
 * Fires when: A CoopAdmin clicks "Manage Subscription" in the Coop Dashboard.
 * UX Notes:
 * CoopAdmin clicks Button → call this API → get URL → redirect to Stripe Customer Portal.
 * Result: A Stripe-hosted Customer Portal URL that is used by the CoopAdmin to manage their subscription.
 *
 * Ref: https://docs.stripe.com/billing/subscriptions/customer-portal
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

export const POST = async (req, { params }) => {
  try {
    const { coopId } = await params;

    const session = await getAuthenticatedProfile();
    if (!session || !session.role || !STRIPE_AUTH_ROLES.has(session.role)) {
      return NextErrorJson("User unauthorized.", 403);
    }

    const { databases } = createAdminClient();

    const coopAccountId = await getCoopAccountId(databases, coopId);
    if (!coopAccountId) {
      return NextErrorJson("Missing coop account ID", 400);
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer_account: coopAccountId,
      return_url: `${SUBSCRIPTION_TAB_URL}`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextErrorJson(message, 500);
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
