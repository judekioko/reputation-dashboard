import Stripe from "stripe";

let _stripe: Stripe | undefined;

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!_stripe) {
      if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
      _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-10-28.acacia" });
    }
    return Reflect.get(_stripe, prop, _stripe);
  },
});

export const PLAN_PRICE_IDS = {
  starter: process.env.STRIPE_PRICE_STARTER ?? "",
  growth: process.env.STRIPE_PRICE_GROWTH ?? "",
} as const;
