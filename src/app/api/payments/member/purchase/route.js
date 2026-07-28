/**
 **STEP 3: Buy Shares (Create Checkout)
 *
 * Purpose: When a Member wants to buy shares in a Coop, create a Stripe Checkout Session for them.
 * Trigger: A Member initiates a share purchase in the dashboard.
 * Result: A Stripe Checkout Session URL that the frontend can use. This creates the payment form.
 * UX Notes: Form rendered using the checkout session URL → Member enters IBAN etc → Stripe returns processing status.
 * - Case 1: Payment success → Stripe redirects to "success_url" with ?success=true in URL → Show success page.
 * - Case 2: Payment failure → Stripe redirects to "cancel_url" with ?canceled=true in URL → Show cancellation page.
 *
 * !This step does NOT confirm payment success. Must listen to webhooks(10-14 days) for that.
 *
 * Ref: https://stripe.com/docs/payments/checkout/one-time
 */

import { createStripeCustomer } from "@/app/api/payments/member/purchase/createAccount";
import {
  COLLECTION_ID_COOP_PAYMENT_CREDENTIALS,
  COLLECTION_ID_COOPERATIVES,
  COLLECTION_ID_COOPXMEMBER,
  COLLECTION_ID_TRANSACTIONS_LEDGER,
  createAdminClient,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { getAuthenticatedProfile } from "@/lib/helpers/_helpers";
import { stripe } from "@/lib/stripe/client";
import { DEFAULT_CURRENCY, NEXT_BASE_URL } from "@/lib/stripe/constants";
import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";

const NextErrorJson = (message, status = 500) =>
  NextResponse.json({ success: false, error: message }, { status });

export const POST = async (req) => {
  try {
    const { coopId, shares, txId } = await req.json();

    const session = await getAuthenticatedProfile();
    if (!session || !session.role || session.role !== "member") {
      return NextErrorJson("User unauthorized.", 403);
    }

    const { databases } = createAdminClient();
    const [payerMember, payeeCoop, sharePrice] = await Promise.all([
      getCoopXMemberDetails(databases, coopId, session.userId),
      getCoopAccountId(databases, coopId),
      getSharePrice(databases, coopId),
    ]);

    const memberNumber = payerMember.membershipId ?? null;
    let customerId = payerMember.stripeCustomerId ?? null;

    if (!customerId) {
      customerId = await createStripeCustomer(
        coopId,
        session.profileId,
        payeeCoop,
      );
      await updateMemberCustomerId(databases, customerId, payerMember.$id);
    }

    const sharePriceCents = (sharePrice ?? 0) * 100;
    const amountCents = shares * sharePriceCents;

    if (!amountCents || amountCents < 100) {
      return NextErrorJson("Amount too low", 400);
    }

    const transactionId = txId ?? ID.unique();
    const lineItem = {
      price_data: {
        currency: DEFAULT_CURRENCY,
        product_data: {
          name: `${shares} Share(s) Purchase`,
          description: `Investment in Cooperative ${coopId}`,
        },
        unit_amount: sharePriceCents,
      },
      quantity: shares,
    };

    const checkoutSession = await stripe.checkout.sessions.create(
      {
        customer: customerId,
        mode: "payment",
        payment_method_types: ["sepa_debit", "card"],

        line_items: [lineItem],

        payment_intent_data: {
          metadata: {
            dc_transactionId: transactionId,
            dc_userId: session.userId,
            dc_profileId: session.profileId,
            dc_coopId: coopId,
            dc_memberNumber: memberNumber,
            dc_shares: shares,
          },
        },
        success_url: `${NEXT_BASE_URL}/dashboard?tab=proposals&success=true&txId=${transactionId}`,
        cancel_url: `${NEXT_BASE_URL}/cooperate/${coopId}?canceled=true&txId=${transactionId}`,
      },
      { stripeAccount: payeeCoop },
    );

    const payload = {
      coopId: coopId,
      memberId: session.userId,
      memberNumber: memberNumber,
      sign: "CREDIT",
      amountCents: amountCents,
      shares: shares,
      sharePriceCents: sharePriceCents,
      paymentReference: transactionId,
      createdBy: session.userId,
    };

    await createTransactionRecord(databases, transactionId, payload);

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextErrorJson(message, 500);
  }
};

/**───────────────── HELPERS ──────────────────────────────────*/
const getCoopAccountId = async (databases, coopId) => {
  const doc = await databases
    .getDocument({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID_COOP_PAYMENT_CREDENTIALS,
      documentId: coopId,
      queries: [Query.select(["stripeAccountId"])],
    })
    .catch(() => null);

  if (!doc?.stripeAccountId)
    throw new Error("Coop cannot accept payments yet!");
  return doc.stripeAccountId;
};

const getSharePrice = async (databases, coopId) => {
  const doc = await databases
    .getDocument({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID_COOPERATIVES,
      documentId: coopId,
      queries: [Query.select(["sharePrice"])],
    })
    .catch(() => null);

  if (!doc?.sharePrice) throw new Error("Coop share price not configured");
  return doc.sharePrice;
};

const getCoopXMemberDetails = async (databases, coopId, userId) => {
  const doc = await databases
    .listDocuments({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID_COOPXMEMBER,
      queries: [
        Query.equal("coopId", coopId),
        Query.equal("userId", userId),
        Query.equal("status", ["Active", "pending"]),
        Query.limit(1),
        Query.select(["membershipId", "stripeCustomerId"]),
      ],
    })
    .catch(() => null);

  if (!doc?.documents?.length)
    throw new Error("User is not an active/prospect member of the coop");
  return doc.documents[0];
};

const updateMemberCustomerId = async (databases, customerId, docId) => {
  const result = await databases.updateDocument({
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_COOPXMEMBER,
    documentId: docId,
    data: { stripeCustomerId: customerId },
  });

  return result;
};

const createTransactionRecord = async (databases, transactionId, payload) => {
  const result = await databases.upsertDocument({
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_TRANSACTIONS_LEDGER,
    documentId: transactionId,
    data: payload,
  });

  return result;
};