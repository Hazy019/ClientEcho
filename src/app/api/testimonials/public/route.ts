import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { db } from "@/db";
import { testimonials, widgets, creators } from "@/db/schema";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { publicFormSchema } from "@/lib/validation/schemas";
import { sanitizeHtml, sanitizePlainText } from "@/lib/security/sanitizer";
import { checkDualRateLimit } from "@/lib/security/rate-limit";
import { validateVideoUrl } from "@/lib/security/video-url";
import { logger } from "@/lib/logger";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const body = await req.json();

    // Step 1: Cloudflare Turnstile verification
    const isTurnstileValid = await verifyTurnstileToken(body.turnstileToken, ip);
    if (!isTurnstileValid) {
      return NextResponse.json({ error: "CAPTCHA verification failed. Please try again." }, { status: 422 });
    }

    // Step 2: Zod schema validation
    const validation = publicFormSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Step 3: DOMPurify sanitization (applied AFTER Zod validation)
    const cleanAuthorName = sanitizePlainText(data.authorName);
    const cleanAuthorEmail = data.authorEmail ? sanitizePlainText(data.authorEmail) : null;
    const cleanAuthorTitle = data.authorTitle ? sanitizePlainText(data.authorTitle) : null;
    const cleanContent = sanitizeHtml(data.content);

    // Step 4: Upstash rate-limit check (applied per-IP AND per-widget-slug)
    const rateLimit = await checkDualRateLimit(ip, data.widgetSlug);
    if (!rateLimit.success) {
      return NextResponse.json({ error: rateLimit.reason }, { status: 429 });
    }

    // Validate video URL against YouTube/Vimeo/Loom allowlist
    const videoCheck = validateVideoUrl(data.videoUrl);
    if (!videoCheck.isValid) {
      return NextResponse.json({ error: videoCheck.error }, { status: 400 });
    }

    // Lookup target active widget
    const [targetWidget] = await db
      .select()
      .from(widgets)
      .where(eq(widgets.slug, data.widgetSlug));

    if (!targetWidget || !targetWidget.isActive) {
      return NextResponse.json({ error: "Widget not found or inactive" }, { status: 404 });
    }

    // Step 5: Insert as pending testimonial
    const [inserted] = await db
      .insert(testimonials)
      .values({
        widgetId: targetWidget.id,
        creatorId: targetWidget.creatorId,
        authorName: cleanAuthorName,
        authorEmail: cleanAuthorEmail,
        authorTitle: cleanAuthorTitle,
        content: cleanContent,
        rating: data.rating,
        status: "pending",
        source: "public_form",
        videoUrl: videoCheck.normalizedUrl || null,
      })
      .returning();

    // Step 6: Conditionally send notification email to creator based on preferences
    try {
      const [creator] = await db
        .select()
        .from(creators)
        .where(eq(creators.id, targetWidget.creatorId));

      if (creator) {
        const creatorSettings = (creator.settings || {}) as Record<string, any>;
        if (creatorSettings.notifyOnSubmission !== false) {
          const { sendNewSubmissionNotificationEmail } = await import("@/lib/email");
          await sendNewSubmissionNotificationEmail({
            creatorEmail: creator.email,
            creatorName: creator.name || undefined,
            authorName: cleanAuthorName,
            content: cleanContent,
            widgetName: targetWidget.name,
          });
        }
      }
    } catch (emailErr) {
      console.error("Failed to trigger submission notification email:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Thank you! Your testimonial has been submitted for review.",
      id: inserted.id,
    });
  } catch (error: any) {
    logger.error("Public testimonial submission error", error, { route: "/api/testimonials/public" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
