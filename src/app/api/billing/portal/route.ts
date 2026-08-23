import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { creators } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getBaseUrl } from "@/lib/email";

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

    const [creator] = await db
      .select()
      .from(creators)
      .where(eq(creators.id, user.id));

    if (!creator) {
      return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
    }

    const appUrl = getBaseUrl(req);

    if (!stripe || !creator.stripeCustomerId) {
      console.log("[DEV MOCK STRIPE PORTAL] Returning mock portal URL for creator:", user.id);
      return NextResponse.json({
        url: "https://billing.stripe.com/p/login/test",
        mock: true,
      });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: creator.stripeCustomerId,
      return_url: `${appUrl}/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error("Stripe Portal creation error:", error);
    return NextResponse.json({ error: error.message || "Failed to create portal session" }, { status: 500 });
  }
}
