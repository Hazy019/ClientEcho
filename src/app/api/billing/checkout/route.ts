import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { creators } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getBaseUrl } from "@/lib/email";

import { PRO_PLAN } from "@/lib/config/pricing";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret
  ? new Stripe(stripeSecret, { apiVersion: "2025-02-24.acacia" as any })
  : null;

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let [creator] = await db
      .select()
      .from(creators)
      .where(eq(creators.id, user.id));

    if (!creator) {
      [creator] = await db
        .insert(creators)
        .values({
          id: user.id,
          email: user.email || "creator@domain.com",
          subscriptionStatus: "free",
        })
        .returning();
    }

    const appUrl = getBaseUrl(req);

    if (!stripe) {
      console.log("[DEV MOCK STRIPE CHECKOUT] Simulating Stripe Checkout upgrade for creator:", user.id);
      // In dev mode without Stripe key set, simulate instant upgrade
      await db
        .update(creators)
        .set({ subscriptionStatus: "pro", updatedAt: new Date() })
        .where(eq(creators.id, user.id));

      return NextResponse.json({
        url: `${appUrl}/billing?upgraded=true`,
        mock: true,
      });
    }

    let stripeCustomerId = creator.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: creator.email,
        metadata: { creatorId: creator.id },
      });
      stripeCustomerId = customer.id;
      await db
        .update(creators)
        .set({ stripeCustomerId: customer.id })
        .where(eq(creators.id, user.id));
    }

    const priceId = PRO_PLAN.stripePriceId;
    const lineItem = priceId && !priceId.startsWith("price_pro_monthly_")
      ? { price: priceId, quantity: 1 }
      : {
          price_data: {
            currency: "usd",
            product_data: {
              name: `ClientEcho ${PRO_PLAN.planName}`,
              description: PRO_PLAN.description,
            },
            unit_amount: PRO_PLAN.priceMonthly * 100, // $6.00
            recurring: { interval: "month" as const },
          },
          quantity: 1,
        };

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [lineItem],
      client_reference_id: creator.id,
      metadata: { creatorId: creator.id },
      success_url: `${appUrl}/billing?success=true`,
      cancel_url: `${appUrl}/billing?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Checkout creation error:", error);
    return NextResponse.json({ error: error.message || "Failed to create checkout session" }, { status: 500 });
  }
}
