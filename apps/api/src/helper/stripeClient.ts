import Stripe from "stripe";

export const STRIPE_API_VERSION = "2025-02-24.acacia" as const;

export function createStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION });
}
