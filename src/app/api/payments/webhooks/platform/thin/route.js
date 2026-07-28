/**
 **WEBHOOK-THIN: Platform Events V2 Endpoint
 *
 * Used for: Stripe Connect onboarding status updates.
 * Fires: CoopAdmin completes onboarding steps in Stripe-hosted flow.
 * Result: stripeCapSepaDebit and stripeCapTransfers fields in CoopPaymentCredentials are updated.
 *
 * Ref: https://docs.stripe.com/webhooks#thin-events
 */

import {
  COLLECTION_ID_COOP_PAYMENT_CREDENTIALS,
  createAdminClient,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { stripe } from "@/lib/stripe/client";
import { NextResponse } from "next/server";

export const POST = async (req) => {
  const body = await req.text();
  const sign = req.headers.get("stripe-signature") ?? "";

  let event;

  try {
    event = stripe.parseEventNotification(
      body,
      sign,
      process.env.STRIPE_WEBHOOK_SECRET_THIN,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextErrorJson(message, 400);
  }

  switch (event.type) {
    case "v2.core.account[requirements].updated": {
      const accountId = event.related_object?.id;

      if (!accountId) {
        break;
      }

      const account = await stripe.v2.core.accounts.retrieve(accountId, {
        include: ["configuration.merchant"],
      });

      const merchantCaps = account.configuration?.merchant?.capabilities;

      const capStatus = {
        cards: merchantCaps?.card_payments?.status === "active",
        sepaDebit: merchantCaps?.sepa_debit_payments?.status === "active",
        transfers: merchantCaps?.stripe_balance?.payouts?.status === "active",
      };

      const coopId = account.metadata?.dc_coopId;
      if (!coopId) {
        console.error(`[WEBHOOK-THIN] Missing dc_coopId in account metadata for account: ${accountId}`);
        break;
      }

      const { databases } = createAdminClient();
      await updatePaymentCredentials(databases, coopId, capStatus);
      break;
    }

    default:
      console.error(`[WEBHOOK-THIN] Unhandled Event: ${event.type}`);
  }

  return NextResponse.json({ received: true });
};

/**───────────────── HELPERS ──────────────────────────────────*/

const NextErrorJson = (message, status = 500) =>
  NextResponse.json({ success: false, error: message }, { status });

const updatePaymentCredentials = async (databases, coopId, capStatus) => {
  await databases.updateDocument({
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_COOP_PAYMENT_CREDENTIALS,
    documentId: coopId,
    data: {
      onboardingStatus: "COMPLETED",
      stripeCapSepaDebit: capStatus.cards && capStatus.sepaDebit,
      stripeCapTransfers: capStatus.cards && capStatus.transfers,
    },
  });
};
