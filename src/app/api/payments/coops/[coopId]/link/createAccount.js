/**
 **Create Connected Account TEMPLATE
 *
 * Purpose: When a new Coop registers, create a Stripe Connect Account with the right capabilities.
 * Trigger: A new Coop completes EasyCoop registration.
 * Result: A Stripe Account object that can be used for onboarding, payments, etc.
 * UX Notes: This step is invisible to the User.
 *
 * Ref: https://docs.stripe.com/connect/accounts-v2
 * Ref: https://docs.stripe.com/connect/saas/tasks/create
 *
 * !This step generates a unusable TEMPLATE account that must be connected to a specific Coop.
 * For the Onboarding URL - Refer to api/payments/account/link/route.js (Step 1.2)
 */

import {
  COLLECTION_ID_COOPERATIVES,
  COLLECTION_ID_PROFILE,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { stripe } from "@/lib/stripe/client";
import {
  COUNTRY_CODE,
  DEFAULT_COUNTRY,
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE,
  STRIPE_ACC_CONFIG,
} from "@/lib/stripe/constants";
import { Query } from "node-appwrite";

export const createStripeAccount = async (databases, coopId, profileId) => {
  const coopDoc = await getCoopDetails(databases, coopId);
  const profileDoc = await getProfileDetails(databases, profileId);

  const account = await stripe.v2.core.accounts.create({
    configuration: {
      merchant: { capabilities: STRIPE_ACC_CONFIG.caps.merchant },
      customer: { capabilities: STRIPE_ACC_CONFIG.caps.customer },
    },

    display_name: coopDoc.name,
    contact_email: profileDoc.contactEmail ?? undefined,
    contact_phone: profileDoc.telephoneNo ?? undefined,

    dashboard: STRIPE_ACC_CONFIG.dashboard,

    identity: buildCoopIdentity(coopDoc, profileDoc),

    defaults: {
      currency: DEFAULT_CURRENCY,
      locales: [DEFAULT_LOCALE],
      responsibilities: {
        losses_collector: STRIPE_ACC_CONFIG.defaults.losses_collector,
        fees_collector: STRIPE_ACC_CONFIG.defaults.fees_collector,
      },
    },

    metadata: {
      dc_coopId: coopId ?? undefined,
      dc_RegNumber: coopDoc.RegNumber ?? undefined,
      dc_profileId: profileId ?? undefined,
    },

    include: [
      "configuration.merchant",
      "configuration.customer",
      "identity",
      "future_requirements",
    ],
  });

  return account.id;
};

/**───────────────── HELPERS ──────────────────────────────────*/
const COOPERATE_FIELDS = [
  "name",
  "country",
  "state",
  "street",
  "houseNo",
  "postalCode",
  "location",
  "RegNumber",
];

const PROFILE_FIELDS = [
  "street",
  "houseNo",
  "postalCode",
  "location",
  "contactEmail",
  "telephoneNo",
];

const getProfileDetails = async (databases, profileId) => {
  const result = await databases.getDocument({
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_PROFILE,
    documentId: profileId,
    queries: [Query.select(PROFILE_FIELDS)],
  });

  return result;
};

const getCoopDetails = async (databases, coopId) => {
  const result = await databases.getDocument({
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_COOPERATIVES,
    documentId: coopId,
    queries: [Query.select(COOPERATE_FIELDS)],
  });

  return result;
};

const buildCoopIdentity = (coopDoc, profileDoc) => ({
  entity_type: STRIPE_ACC_CONFIG.entity_type,
  country: COUNTRY_CODE[coopDoc.country] ?? DEFAULT_COUNTRY,
  business_details: {
    //? structure: STRIPE_ACC_CONFIG.structure,
    registered_name: coopDoc.name ?? undefined,
    phone: profileDoc.telephoneNo ?? undefined,
    address: {
      country: COUNTRY_CODE[coopDoc.country] ?? DEFAULT_COUNTRY,
      state: coopDoc.state ?? undefined,
      city: coopDoc.location ?? undefined,
      line1:
        `${coopDoc.street ?? ""} ${coopDoc.houseNo ?? ""}`.trim() || undefined,
      postal_code: coopDoc.postalCode ?? undefined,
    },
  },
});
