/**
 * ClientEcho Pricing Single Source of Truth
 * 
 * Defines subscription plan metrics, pricing display constants, and Stripe Price IDs.
 */

export const PRO_PLAN = {
  priceMonthly: 6,
  priceDisplay: "$6",
  pricePeriod: "/ month",
  planName: "Pro Workspace Plan",
  description: "Designed for growing agencies and high-volume product creators requiring unlimited scale.",
  stripePriceId:
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY ||
    process.env.STRIPE_PRICE_ID_PRO_MONTHLY ||
    "price_pro_monthly_6usd",
} as const;

export const STARTER_PLAN = {
  priceMonthly: 0,
  priceDisplay: "$0",
  pricePeriod: "/ forever",
  planName: "Starter Free Plan",
  description: "Ideal for individual creators testing magic link approvals and public submission forms.",
  widgetLimit: 1,
  testimonialLimit: 25,
} as const;
