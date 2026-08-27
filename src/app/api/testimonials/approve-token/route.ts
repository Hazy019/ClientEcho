import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { db } from "@/db";
import { magicLinkTokens, testimonials, widgets } from "@/db/schema";
import { hashMagicLinkToken, normalizeToken } from "@/lib/tokens/magic-link";
import { magicLinkApproveSchema } from "@/lib/validation/schemas";
import { sanitizeHtml, sanitizePlainText } from "@/lib/security/sanitizer";
import { invalidateWidgetCache } from "@/lib/cache/redis";
import { eq } from "drizzle-orm";


// GET /api/testimonials/approve-token?token=... -> Validate token state
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawToken = normalizeToken(searchParams.get("token"));

    if (!rawToken || rawToken.length < 32) {
      return NextResponse.json({ valid: false, reason: "invalid" }, { status: 400 });
    }

    const tokenHash = hashMagicLinkToken(rawToken);

    const [tokenRecord] = await db
      .select()
      .from(magicLinkTokens)
      .where(eq(magicLinkTokens.tokenHash, tokenHash));

    if (!tokenRecord) {
      return NextResponse.json({ valid: false, reason: "not_found" }, { status: 404 });
    }

    // Fetch associated testimonial
    const [testimonial] = await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.id, tokenRecord.testimonialId));

    if (!testimonial) {
      return NextResponse.json({ valid: false, reason: "testimonial_not_found" }, { status: 404 });
    }

    if (tokenRecord.usedAt || testimonial.status === "approved") {
      return NextResponse.json({
        valid: false,
        reason: "already_approved",
        testimonial: {
          id: testimonial.id,
          authorName: testimonial.authorName,
          authorTitle: testimonial.authorTitle,
          content: testimonial.content,
          rating: testimonial.rating,
        },
      });
    }

    if (new Date(tokenRecord.expiresAt) < new Date()) {
      return NextResponse.json({
        valid: false,
        reason: "expired",
        testimonial: {
          id: testimonial.id,
          authorName: testimonial.authorName,
        },
      });
    }

    // Non-blocking telemetry: Record openedAt timestamp in testimonial metadata if first time viewing
    const meta = ((testimonial.metadata as Record<string, any>) || {});
    if (!meta.openedAt) {
      try {
        const nowIso = new Date().toISOString();
        await db
          .update(testimonials)
          .set({
            metadata: {
              ...meta,
              openedAt: nowIso,
            },
          })
          .where(eq(testimonials.id, testimonial.id));
      } catch (telemetryErr) {
        console.warn("[TELEMETRY_WARNING] Non-blocking openedAt tracking failed:", telemetryErr);
      }
    }

    return NextResponse.json({
      valid: true,
      testimonial: {
        id: testimonial.id,
        authorName: testimonial.authorName,
        authorTitle: testimonial.authorTitle,
        content: testimonial.content,
        rating: testimonial.rating,
        promptMessage: meta.promptMessage || null,
      },
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json({ valid: false, reason: "error" }, { status: 500 });
  }
}

// POST /api/testimonials/approve-token -> Approve testimonial & mark token used
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = magicLinkApproveSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { token, authorName, authorTitle, content, rating } = validation.data;
    const cleanToken = normalizeToken(token);
    const tokenHash = hashMagicLinkToken(cleanToken);

    const [tokenRecord] = await db
      .select()
      .from(magicLinkTokens)
      .where(eq(magicLinkTokens.tokenHash, tokenHash));

    if (!tokenRecord) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    if (tokenRecord.usedAt) {
      return NextResponse.json({ error: "already_approved" }, { status: 400 });
    }

    if (new Date(tokenRecord.expiresAt) < new Date()) {
      return NextResponse.json({ error: "expired" }, { status: 400 });
    }

    // Update draft content if client edited it
    const updateData: Record<string, any> = {
      status: "approved",
      updatedAt: new Date(),
    };

    if (authorName) updateData.authorName = sanitizePlainText(authorName);
    if (authorTitle) updateData.authorTitle = sanitizePlainText(authorTitle);
    if (content) updateData.content = sanitizeHtml(content);
    if (rating !== undefined) updateData.rating = rating;

    // Execute atomic transaction for status update + marking token used
    const updatedTestimonial = await db.transaction(async (tx) => {
      const [t] = await tx
        .update(testimonials)
        .set(updateData)
        .where(eq(testimonials.id, tokenRecord.testimonialId))
        .returning();

      await tx
        .update(magicLinkTokens)
        .set({ usedAt: new Date() })
        .where(eq(magicLinkTokens.testimonialId, tokenRecord.testimonialId));

      return t;
    });

    // Invalidate Redis cache & notify creator
    if (updatedTestimonial?.widgetId) {
      try {
        const [targetWidget] = await db
          .select()
          .from(widgets)
          .where(eq(widgets.id, updatedTestimonial.widgetId));
        if (targetWidget?.slug) {
          await invalidateWidgetCache(targetWidget.slug);
        }

        // Notify creator if notifyOnApproval preference is enabled
        const { creators } = await import("@/db/schema");
        const [creator] = await db
          .select()
          .from(creators)
          .where(eq(creators.id, updatedTestimonial.creatorId));

        if (creator) {
          const creatorSettings = (creator.settings || {}) as Record<string, any>;
          if (creatorSettings.notifyOnApproval !== false) {
            const { sendMagicLinkApprovedNotificationEmail } = await import("@/lib/email");
            await sendMagicLinkApprovedNotificationEmail({
              creatorEmail: creator.email,
              creatorName: creator.name || undefined,
              clientEmail: tokenRecord.clientEmail,
              authorName: updatedTestimonial.authorName,
              widgetName: targetWidget?.name || "Portfolio Widget",
            });
          }
        }
      } catch (cacheErr) {
        console.error("Cache invalidation / approval email notification error:", cacheErr);
      }
    }

    return NextResponse.json({
      success: true,
      testimonialId: updatedTestimonial.id,
      message: "Testimonial approved successfully!",
    });

  } catch (error) {
    console.error("Token approval error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
