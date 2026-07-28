import { STRIPE_API_VERSION } from "@/lib/stripe/constants";
import Stripe from "stripe";

/**
 * VERSION: 2026-05-27.dahlia (change in: /lib/stripe/constants.js)
 *
 * USING: Stripe Connect for Platforms, AccountsV2 API (preview, but recommended)
 * PURPOSE: Initialize Stripe client with v2 API version and config.
 */

const config = {
  apiVersion: STRIPE_API_VERSION,
  maxNetworkRetries: 2,
  appInfo: {
    name: "EasyCoop",
    version: "1.0.0",
  },
};

const key = process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key_for_build_time_purposes";
export const stripe = new Stripe(key, config);