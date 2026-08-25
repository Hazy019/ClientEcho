import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { testimonials, magicLinkTokens } from "@/db/schema";
import { generateMagicLinkToken } from "@/lib/tokens/magic-link";
import { sendMagicLinkApprovalEmail, getBaseUrl } from "@/lib/email";
import { eq, and, isNull } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { testimonialId, sendEmail = true } = body;
    if (!testimonialId) {
      return NextResponse.json({ error: "Testimonial ID is required" }, { status: 400 });
    }

    const [testimonial] = await db
      .select()
      .from(testimonials)
      .where(and(eq(testimonials.id, testimonialId), eq(testimonials.creatorId, user.id)));

    if (!testimonial) {
      return NextResponse.json({ error: "Testimonial not found or unauthorized" }, { status: 404 });
    }

    if (testimonial.source !== "magic_link") {
      return NextResponse.json(
        { error: "Only magic link testimonials can be resent" },
        { status: 400 }
      );
    }

    if (testimonial.status !== "pending") {
      return NextResponse.json(
        { error: "This testimonial has already been approved or rejected" },
        { status: 400 }
      );
    }

    const clientEmail = testimonial.authorEmail;
    if (!clientEmail) {
      return NextResponse.json(
        { error: "No client email associated with this testimonial" },
        { status: 400 }
      );
    }

    // Generate fresh 32-byte token and expiry
    const { rawToken, tokenHash, expiresAt } = generateMagicLinkToken(72);

    // Expire previous unused tokens for this testimonial to prevent duplicate active tokens
    await db
      .update(magicLinkTokens)
      .set({ expiresAt: new Date() })
      .where(and(eq(magicLinkTokens.testimonialId, testimonial.id), isNull(magicLinkTokens.usedAt)));

    // Insert fresh magic link token for this testimonial
    await db.insert(magicLinkTokens).values({
      testimonialId: testimonial.id,
      tokenHash,
      clientEmail,
      expiresAt,
    });

    const meta = (testimonial.metadata || {}) as Record<string, any>;
    const promptMessage = meta.promptMessage || undefined;

    const appUrl = getBaseUrl(req);
    const approvalUrl = `${appUrl}/approve-testimonial?token=${encodeURIComponent(rawToken)}`;

    let emailResult: { success: boolean; error?: string } = { success: false };

    if (sendEmail) {
      // Send email with new token in a safe try-catch
      try {
        emailResult = await sendMagicLinkApprovalEmail({
          toEmail: clientEmail,
          creatorName: user.user_metadata?.name || user.email || "Freelancer",
          creatorEmail: user.email || undefined,
          rawToken,
          promptMessage,
          appUrl,
        });
      } catch (emailErr: any) {
        console.error("[RESEND_MAGIC_LINK_EMAIL_DISPATCH_ERROR]", emailErr);
        emailResult = { success: false, error: emailErr?.message || "Failed to dispatch email" };
      }
    }

    return NextResponse.json({
      success: true,
      emailSent: emailResult.success,
      emailError: emailResult.error || null,
      approvalUrl,
      devApprovalUrl: approvalUrl,
    });
  } catch (error: any) {
    console.error("Resend magic link error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
