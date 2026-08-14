import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { widgets, creators } from "@/db/schema";
import { widgetSchema } from "@/lib/validation/schemas";
import { checkDualRateLimit } from "@/lib/security/rate-limit";
import { sanitizeAndValidateCss } from "@/lib/security/css-sanitizer";
import { eq, sql } from "drizzle-orm";

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

    const body = await req.json();
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

    const isPro = creator.subscriptionStatus === "pro";

    // 3. Free Tier Active Widget Count Cap Enforcement
    const existingWidgets = await db
      .select()
      .from(widgets)
      .where(eq(widgets.creatorId, user.id));

    const isUpdatingSameSlug = existingWidgets.some((w) => w.slug === data.slug);

    if (!isPro && existingWidgets.length >= 1 && !isUpdatingSameSlug) {
      return NextResponse.json(
        {
          error: "Free Starter plan is limited to 1 active widget. Upgrade to Pro for unlimited widgets!",
          code: "LIMIT_REACHED",
        },
        { status: 402 }
      );
    }

    // 4. Pro Fields Gating Enforcement
    const fontPairing = themeConfig.fontPairing || "Manrope";
    const accentColor = themeConfig.accentColor || "#2D2D2D";
    const layoutVariant = themeConfig.layoutVariant || "grid";
    const customCss = themeConfig.customCss || "";

    if (!isPro) {
      if (["Syne", "Roboto", "Outfit"].includes(fontPairing)) {
        return NextResponse.json(
          { error: "Custom typography overrides require a Pro Workspace plan.", code: "PRO_REQUIRED" },
          { status: 402 }
        );
      }

      if (accentColor !== "#2D2D2D" && accentColor !== "#4f46e5") {
        return NextResponse.json(
          { error: "Accent color customization requires a Pro Workspace plan.", code: "PRO_REQUIRED" },
          { status: 402 }
        );
      }

      if (layoutVariant !== "grid") {
        return NextResponse.json(
          { error: "Carousel and Rotator widget layouts require a Pro Workspace plan.", code: "PRO_REQUIRED" },
          { status: 402 }
        );
      }
    }

    // 5. Scoped Custom CSS Sanitization & Free Trial Counter
    let finalCss = "";
    if (customCss && typeof customCss === "string" && customCss.trim().length > 0) {
      const sanitized = sanitizeAndValidateCss(customCss);
      if (!sanitized.valid) {
        return NextResponse.json(
          { error: sanitized.error || "Invalid Custom CSS format." },
          { status: 400 }
        );
      }
      finalCss = sanitized.sanitizedCss || "";

      if (!isPro) {
        if (creator.customCssTrialsUsed >= 3) {
          return NextResponse.json(
            {
              error: "You have used all 3 free Custom CSS trial edits. Upgrade to Pro for unlimited CSS customization!",
              code: "PRO_REQUIRED",
            },
            { status: 402 }
          );
        }

        // Increment customCssTrialsUsed atomically in DB
        await db
          .update(creators)
          .set({ customCssTrialsUsed: sql`${creators.customCssTrialsUsed} + 1` })
          .where(eq(creators.id, user.id));
      }
    }

    const sanitizedThemeConfig = {
      ...themeConfig,
      fontPairing: isPro ? fontPairing : fontPairing === "Inter" ? "Inter" : "Manrope",
      accentColor: isPro ? accentColor : "#2D2D2D",
      layoutVariant: isPro ? layoutVariant : "grid",
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
        .where(eq(widgets.slug, data.slug))
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
    console.error("Create widget error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
