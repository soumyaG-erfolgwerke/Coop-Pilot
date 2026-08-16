/**
 **WEBHOOK-SNAPSHOT: Connect Events V1 Endpoint
 *
 * Used for: Payment Events lifecycle tracking.
 * Fires on: PaymentIntent, Charge, Refund events initiated by Members → Coops.
 * Result: Manages TransactionsLedger DB Table.
 *
 * Ref: https://docs.stripe.com/webhooks#snapshot-events
 */

import { processMembershipActivation } from "@/app/api/payments/webhooks/connect/snapshot/processMembershipActivation";
import {
  COLLECTION_ID_TRANSACTION,
  COLLECTION_ID_TRANSACTIONS_LEDGER,
  createAdminClient,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { stripe } from "@/lib/stripe/client";
import { NextResponse } from "next/server";
import { claimWebhookEvent, completeWebhookEvent, failWebhookEvent } from "@/lib/payments/webhook-idempotency";

const NextErrorJson = (message, status = 500) =>
  NextResponse.json({ success: false, error: message }, { status });

const PAYMENT_EVENTS = new Set([
  "payment_intent.processing",
  "payment_intent.succeeded",
  "payment_intent.canceled",
  "payment_intent.payment_failed",

  "charge.refunded",

  "refund.created",
  "refund.failed",
  "refund.updated",
]);

export const POST = async (req) => {
  const body = await req.text();
  const sign = req.headers.get("stripe-signature") ?? "";

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sign,
      process.env.STRIPE_WEBHOOK_SECRET_CONNECT_SNAPSHOT,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextErrorJson(message, 400);
  }

  if (!PAYMENT_EVENTS.has(event.type)) {
    console.log(`[WEBHOOK-SNAPSHOT] Unhandled Event: ${event.type}`);
    return NextResponse.json({
      received: true,
      unhandled: true,
      eventType: event.type,
    });
  }

  const pi = event.data.object;
  const shares = parseInt(pi.metadata?.dc_shares, 10);

  const piData = {
    piId: pi.id ?? null,
    coopId: pi.metadata?.dc_coopId ?? null,
    transactionId: pi.metadata?.dc_transactionId ?? null,
    userId: pi.metadata?.dc_userId ?? null,
    profileId: pi.metadata?.dc_profileId ?? null,
    memberNumber: pi.metadata?.dc_memberNumber ?? null,
    status: pi.status?.toUpperCase() ?? null,

    shares: Number.isNaN(shares) ? null : shares,
    amount: pi.amount ?? null,
    currency: pi.currency?.toUpperCase() ?? null,
  };

  const { databases, storage } = createAdminClient();
  const claim = await claimWebhookEvent(databases, event, "connect-snapshot");
  if (!claim.process) {
    return NextResponse.json({ received: true, duplicate: true, reason: claim.reason });
  }

  try {
  switch (event.type) {
    case "payment_intent.processing": {
      await updatePaymentProposal(databases, piData.transactionId, "payment_processing");
      break;
    }

    case "payment_intent.succeeded": {
      await updatePaymentProposal(databases, piData.transactionId, "payment_succeeded");
      const newMembershipId = await processMembershipActivation(databases, storage, piData);
      const memberNumber = piData.memberNumber || newMembershipId;

      //! TRANSACTION LEDGER - PHASE 2/1
      const payload = { paymentStatus: "PAID" };
      if (memberNumber) payload.memberNumber = memberNumber;

      await updateTransactionRecord(databases, piData.transactionId, payload);
      break;
    }

    case "payment_intent.canceled": {
      //! TRANSACTION LEDGER - PHASE 2/2
      const payload = {
        paymentStatus: "CANCELED",
      };

      await updateTransactionRecord(databases, piData.transactionId, payload);
      break;
    }

    case "payment_intent.payment_failed": {
      //! TRANSACTION LEDGER - PHASE 2/3
      const failureReason = pi.last_payment_error?.message ?? "unknown";

      const payload = {
        paymentStatus: "FAILED",
        rawMetadata: JSON.stringify({ "failureReason": failureReason }),
      };

      await updateTransactionRecord(databases, piData.transactionId, payload);
      await updatePaymentProposal(databases, piData.transactionId, "payment_failed");
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object;
      console.log(`[WEBHOOK-SNAPSHOT] Charge Refunded:`, charge);

      break;
    }
  }

  await completeWebhookEvent(databases, event.id);
  } catch (error) {
    await failWebhookEvent(databases, event.id, error);
    console.error("[WEBHOOK-SNAPSHOT] Processing failed", error);
    return NextErrorJson("Webhook processing failed", 500);
  }

  return NextResponse.json({ received: true });
};

/**───────────────── HELPERS ──────────────────────────────────*/
const updateTransactionRecord = async (databases, transactionId, payload) => {
  const result = await databases.updateDocument({
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_TRANSACTIONS_LEDGER,
    documentId: transactionId,
    data: payload,
  });

  return result;
};

const updatePaymentProposal = async (databases, transactionId, status) => {
  const result = await databases.updateDocument({
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_TRANSACTION,
    documentId: transactionId,
    data: { paymentStatus: status },
  });

  return result;
};
