/**
 **WEBHOOK-SNAPSHOT: Platform Events V1 Endpoint.
 *
 * Used for: Coop Subscription lifecycle tracking.
 * Fires on: Subscription creation, updates, deletions initiated by CoopAdmin/System.
 * Result: Manages CoopSubscription DB Table.
 *
 * Ref: https://docs.stripe.com/webhooks#snapshot-events
 */

import {
  COLLECTION_ID_COOP_SUBSCRIPTIONS,
  createAdminClient,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { stripe } from "@/lib/stripe/client";
import { NextResponse } from "next/server";
import { claimWebhookEvent, completeWebhookEvent, failWebhookEvent } from "@/lib/payments/webhook-idempotency";

const NextErrorJson = (message, status = 500) =>
  NextResponse.json({ success: false, error: message }, { status });

const SUBSCRIPTION_EVENTS = new Set([
  "customer.subscription.created",
  "customer.subscription.deleted",
  "customer.subscription.updated",
]);

export const POST = async (req) => {
  const body = await req.text();
  const sign = req.headers.get("stripe-signature") ?? "";

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sign,
      process.env.STRIPE_WEBHOOK_SECRET_SNAPSHOT,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextErrorJson(message, 400);
  }

  if (!SUBSCRIPTION_EVENTS.has(event.type)) {
    console.log(`[WEBHOOK-SNAPSHOT] Unhandled Event: ${event.type}`);
    return NextResponse.json({
      received: true,
      unhandled: true,
      eventType: event.type,
    });
  }

  const sub = event.data.object;
  const lineItem = sub.items?.data[0];
  const expiry = lineItem?.current_period_end  

  const subData = {
    subId: sub.id ?? null,
    coopId: sub.metadata?.dc_coopId ?? null,
    planId: sub.metadata?.dc_planId ?? null,
    docId: sub.metadata?.dc_docId ?? null,
    prevStatus: event.data.previous_attributes?.status ?? null,
    status: sub.status.toUpperCase() ?? null,
    priceId: lineItem?.price?.id ?? null,
    expiresAt: expiry ? new Date(lineItem.current_period_end * 1000).toISOString(): null
  };

  const { databases } = createAdminClient();
  const claim = await claimWebhookEvent(databases, event, "platform-snapshot");
  if (!claim.process) return NextResponse.json({ received: true, duplicate: true, reason: claim.reason });

  try {
  switch (event.type) {
    case "customer.subscription.created": {
      const payload = {
        coopId: subData.coopId,
        billingPlanId: subData.planId,
        stripeSubscriptionId: subData.subId,
        stripeSubscriptionStatus: subData.status,
        stripeSubscriptionPriceId: subData.priceId,
        stripeSubscriptionExpiresAt: subData.expiresAt,
      };

      await databases.upsertDocument({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID_COOP_SUBSCRIPTIONS,
        documentId: subData.docId,
        data: payload,
      });
      break;
    }

    case "customer.subscription.updated": {
      if (subData.prevStatus && subData.prevStatus !== subData.status) {
        await databases.updateDocument({
          databaseId: DATABASE_ID,
          collectionId: COLLECTION_ID_COOP_SUBSCRIPTIONS,
          documentId: subData.docId,
          data: {
            stripeSubscriptionStatus: subData.status,
            stripeSubscriptionExpiresAt: subData.expiresAt,
          },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      await databases.updateDocument({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID_COOP_SUBSCRIPTIONS,
        documentId: subData.docId,
        data: {
          stripeSubscriptionStatus: subData.status,
        },
      });

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
