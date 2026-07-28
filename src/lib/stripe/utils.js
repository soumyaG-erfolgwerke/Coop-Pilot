import { COLLECTION_ID_COOP_SUBSCRIPTIONS, DATABASE_ID } from "@/lib/appwrite-server";
import { Query } from "node-appwrite";

const SUBS_REQS = [
  "billingPlanId",
  "stripeSubscriptionStatus",
  "stripeSubscriptionExpiresAt",
];

export const getSubscription = async (databases, coopId) => {
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
