/**
 **Step 3.1: Create Stripe Customer
 *
 * Purpose: When a new Member registers, create a Stripe Customer for them.
 * Trigger: A new Member completes EasyCoop registration.
 * Result: A Stripe Customer object that can be used for payments.
 * UX Notes: This step is invisible to the User.
 *
 * Ref: https://stripe.com/docs/api/customers/create
 */

import {
  COLLECTION_ID_PROFILE,
  createAdminClient,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { stripe } from "@/lib/stripe/client";
import { NextResponse } from "next/server";
import { Query } from "node-appwrite";

export const createStripeCustomer = async (
  coopId,
  profileId,
  coopAccountId,
) => {
  try {
    const { databases } = createAdminClient();

    const profileDoc = await getProfileDetails(databases, profileId);
    if (!profileDoc) {
      throw new Error("Profile details not found");
    }
    
    const customer = await stripe.customers.create(
      {
        name: `${profileDoc.FirstName} ${profileDoc.LastName}`,
        email: profileDoc.contactEmail,
        phone: profileDoc.telephoneNo,
        metadata: { dc_profileId: profileId, dc_coopId: coopId },
      },
      {
        stripeAccount: coopAccountId,
      },
    );

    return customer.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextErrorJson(message, 500);
  }
};

/**───────────────── HELPERS ──────────────────────────────────*/

const NextErrorJson = (message, status = 500) =>
  NextResponse.json({ success: false, error: message }, { status });

const PROFILE_FIELDS = ["FirstName", "LastName", "contactEmail", "telephoneNo"];

const getProfileDetails = async (databases, profileId) => {
  const doc = await databases
    .getDocument({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID_PROFILE,
      documentId: profileId,
      queries: [Query.select(PROFILE_FIELDS)],
    })
    .catch(() => null);

  return doc;
};
