import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { widgets, creators } from "@/db/schema";
import { widgetSchema } from "@/lib/validation/schemas";
import { checkDualRateLimit } from "@/lib/security/rate-limit";
import { sanitizeAndValidateCss } from "@/lib/security/css-sanitizer";
import { logger } from "@/lib/logger";
import { eq, sql, and } from "drizzle-orm";

// GET /api/widgets -> List creator's widgets & subscription state
export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch creator profile for subscription state & CSS trial count
    let [creatorProfile] = await db
      .select()
      .from(creators)
      .where(eq(creators.id, user.id));

    if (!creatorProfile) {
      // Auto-create creator record if missing
      [creatorProfile] = await db
        .insert(creators)
        .values({
          id: user.id,
          email: user.email || "creator@domain.com",
          name: user.user_metadata?.name || null,
          subscriptionStatus: "free",
          customCssTrialsUsed: 0,
        })
        .returning();
    }

    const creatorWidgets = await db
      .select()
      .from(widgets)
      .where(eq(widgets.creatorId, user.id));

    return NextResponse.json({
      widgets: creatorWidgets,
      creator: {
        subscriptionStatus: creatorProfile.subscriptionStatus || "free",
        customCssTrialsUsed: creatorProfile.customCssTrialsUsed || 0,
      },
    });
  } catch (error) {
    console.error("Fetch widgets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/widgets -> Create or update widget with Pro paywall enforcement & CSS trial counter
export async function POST(req: Request) {
  let body: any = null;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Rate-limit authenticated widget creation requests per IP & user
    const reqHeaders = await req.headers;
    const ip = reqHeaders.get("x-forwarded-for") || "127.0.0.1";
    const rateLimit = await checkDualRateLimit(ip, `widget-create-${user.id}`);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: rateLimit.reason || "Too many widget creation attempts. Please slow down." },
        { status: 429 }
      );
    }

    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
    const validation = widgetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;
    const themeConfig = (data.themeConfig || {}) as Record<string, any>;

    // 2. Fetch Creator Profile
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
          customCssTrialsUsed: 0,
        })
        .returning();
    }

    const isPro = ["pro", "active"].includes(creator.subscriptionStatus);

    // 3. Multi-Tenant Slug Ownership & Free Tier Cap Enforcement
    const [slugOwner] = await db
      .select({ id: widgets.id, creatorId: widgets.creatorId, slug: widgets.slug })
      .from(widgets)
      .where(eq(widgets.slug, data.slug));

    const isUpdatingSameSlug = Boolean(slugOwner && slugOwner.creatorId === user.id);

    // If slug is owned by a DIFFERENT creator, reject with a 409 conflict
    if (slugOwner && slugOwner.creatorId !== user.id) {
      return NextResponse.json(
        {
          error: `The URL "${data.slug}" is already taken. Try a different one.`,
          field: "slug",
        },
        { status: 409 }
      );
    }

    // 3. Flat Workspace Widget Cap (3 active widgets limit for free tier to test designs)
    const existingWidgets = await db
      .select()
      .from(widgets)
      .where(eq(widgets.creatorId, user.id));

    const MAX_FREE_WIDGETS = 3;
    if (existingWidgets.length >= MAX_FREE_WIDGETS && !isUpdatingSameSlug) {
      return NextResponse.json(
        {
          error: `Your workspace is currently limited to ${MAX_FREE_WIDGETS} active widgets. Upgrade to Pro for unlimited widgets.`,
          code: "LIMIT_REACHED",
        },
        { status: 400 }
      );
    }

    // 4. Customization Fields (Fully unlocked for all workspaces during billing pause)
    const fontPairing = themeConfig.fontPairing || "Manrope";
    const accentColor = themeConfig.accentColor || "#2D2D2D";
    const layoutVariant = themeConfig.layoutVariant || "grid";
    const customCss = themeConfig.customCss || "";

    // 5. Scoped Custom CSS Sanitization (Security check applies to all users)
    let finalCss = "";
    if (customCss && typeof customCss === "string" && customCss.trim().length > 0) {
      try {
        const sanitized = sanitizeAndValidateCss(customCss);
        if (!sanitized.valid) {
          return NextResponse.json(
            { error: sanitized.error || "Invalid Custom CSS format." },
            { status: 400 }
          );
        }
        finalCss = sanitized.sanitizedCss || "";
      } catch (cssErr: any) {
        console.error("CSS Sanitizer exception:", cssErr);
        return NextResponse.json(
          { error: "Malformed Custom CSS could not be parsed." },
          { status: 400 }
        );
      }
    }

    const sanitizedThemeConfig = {
      ...themeConfig,
      fontPairing,
      accentColor,
      layoutVariant,
      customCss: finalCss,
    };

    // 6. Check slug uniqueness or update existing widget (IDOR safe)
    if (isUpdatingSameSlug) {
      const [updatedWidget] = await db
        .update(widgets)
        .set({
          name: data.name,
          themeConfig: sanitizedThemeConfig,
          isActive: data.isActive,
          updatedAt: new Date(),
        })
        .where(and(eq(widgets.slug, data.slug), eq(widgets.creatorId, user.id)))
        .returning();

      return NextResponse.json({ success: true, widget: updatedWidget });
    }

    const [newWidget] = await db
      .insert(widgets)
      .values({
        creatorId: user.id,
        name: data.name,
        slug: data.slug,
        themeConfig: sanitizedThemeConfig,
        isActive: data.isActive,
      })
      .returning();

    return NextResponse.json({ success: true, widget: newWidget });
  } catch (error: any) {
    if (
      error?.code === "23505" ||
      error?.constraint === "widgets_slug_key" ||
      (typeof error?.message === "string" && error.message.includes("widgets_slug_key"))
    ) {
      return NextResponse.json(
        {
          error: `The URL "${body?.slug || "chosen"}" is already taken. Try a different one.`,
          field: "slug",
        },
        { status: 409 }
      );
    }
    logger.error("Widget save error", error, { route: "/api/widgets", slug: body?.slug });
    return NextResponse.json(
      { error: "Something went wrong saving your widget." },
      { status: 500 }
    );
  }
}
