export const NEXT_BASE_URL =
  process.env.DEPLOYMENT_URL ?? "http://localhost:3000";

export const STRIPE_AUTH_ROLES = new Set(["coopadmin", "superadmin"]);
export const STRIPE_API_VERSION = process.env.STRIPE_API_VERSION;
export const STRIPE_API_BASE_URL = "https://api.stripe.com";

export const STRIPE_ACC_CONFIG = {
  dashboard: "none",
  entity_type: "company",
  structure: "cooperative",

  caps: {
    merchant: {
      //? ideal_payments(NL), bancontact_payments(BE), may be added
      card_payments: { requested: true },
      sepa_debit_payments: { requested: true },
    },
    customer: {
      automatic_indirect_tax: { requested: true },
    },
  },

  defaults: {
    fees_collector: "application",
    losses_collector: "application",
  },
};

export const DEFAULT_COUNTRY = "DE";
export const DEFAULT_LOCALE = "de-DE";
export const DEFAULT_CURRENCY = "EUR";
export const VERIFICATION_AMOUNT_EUR = "1";

export const COUNTRY_CODE = {
  Germany: "DE",
  Netherlands: "NL",
  Belgium: "BE",
  Spain: "ES",
  France: "FR",
  Austria: "AT",
  Britain: "GB",
  India: "IN",
};

export const STRIPE_SUBSCRIPTION_PLAN = "tier_0";
export const SUBSCRIPTION_TAB_URL = `${NEXT_BASE_URL}/dashboard?tab=subscriptions`;
