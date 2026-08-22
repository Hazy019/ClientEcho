import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { testimonials, magicLinkTokens, widgets } from "@/db/schema";
import { magicLinkRequestSchema } from "@/lib/validation/schemas";
import { sanitizeHtml, sanitizePlainText } from "@/lib/security/sanitizer";
import { generateMagicLinkToken } from "@/lib/tokens/magic-link";
import { sendMagicLinkApprovalEmail } from "@/lib/email";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = magicLinkRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify creator owns the widget
    const [widget] = await db
      .select()
      .from(widgets)
      .where(and(eq(widgets.id, data.widgetId), eq(widgets.creatorId, user.id)));

    if (!widget) {
      return NextResponse.json({ error: "Widget not found or unauthorized" }, { status: 404 });
    }

    // Sanitize input AFTER Zod validation
    const cleanAuthorName = sanitizePlainText(data.authorName);
    const cleanContent = sanitizeHtml(data.content);
    const cleanPrompt = data.promptMessage ? sanitizePlainText(data.promptMessage) : undefined;

    // Generate cryptographically random 32-byte token and store hash
    const { rawToken, tokenHash, expiresAt } = generateMagicLinkToken(72);

    // Atomically insert draft testimonial and single-use magic link token
    const newTestimonial = await db.transaction(async (tx) => {
      const [t] = await tx
        .insert(testimonials)
        .values({
          widgetId: widget.id,
          creatorId: user.id,
          authorName: cleanAuthorName,
          authorEmail: data.clientEmail,
          content: cleanContent,
          rating: data.rating,
          status: "pending",
          source: "magic_link",
          metadata: {
            promptMessage: cleanPrompt,
          },
        })
        .returning();

      await tx.insert(magicLinkTokens).values({
        testimonialId: t.id,
        tokenHash,
        clientEmail: data.clientEmail,
        expiresAt,
      });

      return t;
    });

    // Send email with raw token link
    const emailResult = await sendMagicLinkApprovalEmail({
      toEmail: data.clientEmail,
      creatorName: user.user_metadata?.name || user.email || "Freelancer",
      creatorEmail: user.email || undefined,
      rawToken,
      promptMessage: cleanPrompt,
    });

    // Construct approval URL for dev mode fallback
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const approvalUrl = `${appUrl}/approve-testimonial?token=${encodeURIComponent(rawToken)}`;
    console.log(`\n=========================================\n[DEV MAGIC LINK GENERATED]\nRecipient: ${data.clientEmail}\nApproval URL: ${approvalUrl}\n=========================================\n`);

    return NextResponse.json({
      success: true,
      testimonialId: newTestimonial.id,
      emailSent: emailResult.success,
      devApprovalUrl: approvalUrl,
    });
  } catch (error: any) {
    console.error("Magic link request error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
