import { ID } from "node-appwrite";
import { COLLECTION_ID_STRIPE_WEBHOOK_EVENTS, DATABASE_ID } from "@/lib/appwrite-server";

const activeClaims = globalThis.__coopilotWebhookClaims || new Set();
globalThis.__coopilotWebhookClaims = activeClaims;
const STALE_PROCESSING_MS = 5 * 60 * 1000;

export async function claimWebhookEvent(databases, event, endpoint) {
  if (!event?.id || !event?.type) throw new Error("Stripe event identity is missing");
  if (activeClaims.has(event.id)) return { process: false, reason: "in-progress" };
  activeClaims.add(event.id);
  try {
    await databases.createDocument({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID_STRIPE_WEBHOOK_EVENTS,
      documentId: event.id,
      data: { status: "PROCESSING", eventType: event.type, endpoint },
    });
    return { process: true };
  } catch (error) {
    if (error?.code !== 409) {
      activeClaims.delete(event.id);
      throw error;
    }
    const existing = await databases.getDocument({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID_STRIPE_WEBHOOK_EVENTS,
      documentId: event.id,
    });
    if (existing.status === "PROCESSED") {
      activeClaims.delete(event.id);
      return { process: false, reason: "processed" };
    }
    const age = Date.now() - new Date(existing.$updatedAt || existing.$createdAt).getTime();
    if (existing.status === "PROCESSING" && age < STALE_PROCESSING_MS) {
      activeClaims.delete(event.id);
      return { process: false, reason: "in-progress" };
    }
    await databases.updateDocument({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID_STRIPE_WEBHOOK_EVENTS,
      documentId: event.id,
      data: { status: "PROCESSING", error: null, processedAt: null },
    });
    return { process: true };
  }
}

export async function completeWebhookEvent(databases, eventId) {
  await databases.updateDocument({
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_STRIPE_WEBHOOK_EVENTS,
    documentId: eventId,
    data: { status: "PROCESSED", processedAt: new Date().toISOString(), error: null },
  });
  activeClaims.delete(eventId);
}

export async function failWebhookEvent(databases, eventId, error) {
  const message = error instanceof Error ? error.message : "Webhook processing failed";
  await databases.updateDocument({
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_STRIPE_WEBHOOK_EVENTS,
    documentId: eventId,
    data: { status: "FAILED", error: message.slice(0, 1000) },
  }).catch(() => {});
  activeClaims.delete(eventId);
}
