import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { creators, magicLinkTokens, testimonials, widgets } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
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
          name: user.user_metadata?.name || "Workspace Creator",
          subscriptionStatus: "free",
        })
        .returning();
    }

    const defaultSettings = {
      magicLinksEnabled: true,
      publicFormEnabled: true,
      manualImportEnabled: true,
      requireRating: true,
      formIntroCopy: "Share your experience working with us! Your feedback helps us improve and build social proof.",
    };

    const currentSettings = {
      ...defaultSettings,
      ...(creator.settings || {}),
    };

    // Query real magic_link_tokens joined with testimonials and widgets for creator
    const rawTokens = await db
      .select({
        id: magicLinkTokens.id,
        clientEmail: magicLinkTokens.clientEmail,
        createdAt: magicLinkTokens.createdAt,
        expiresAt: magicLinkTokens.expiresAt,
        usedAt: magicLinkTokens.usedAt,
        authorName: testimonials.authorName,
        widgetName: widgets.name,
      })
      .from(magicLinkTokens)
      .innerJoin(testimonials, eq(magicLinkTokens.testimonialId, testimonials.id))
      .innerJoin(widgets, eq(testimonials.widgetId, widgets.id))
      .where(eq(testimonials.creatorId, user.id))
      .orderBy(desc(magicLinkTokens.createdAt))
      .limit(50);

    const formattedLog = rawTokens.map((t) => {
      const now = new Date();
      let status: "pending" | "approved" | "expired" = "pending";
      if (t.usedAt) {
        status = "approved";
      } else if (new Date(t.expiresAt) < now) {
        status = "expired";
      }

      return {
        id: t.id,
        recipientEmail: t.clientEmail,
        recipientName: t.authorName || t.clientEmail.split("@")[0],
        widgetName: t.widgetName,
        sentAt: t.createdAt.toISOString(),
        status,
      };
    });

    return NextResponse.json({
      settings: currentSettings,
      sentMagicLinks: formattedLog,
    });
  } catch (error: any) {
    console.error("GET /api/channels error:", error);
    return NextResponse.json({ error: error.message || "Failed to load channel configurations" }, { status: 500 });
  }
}

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
    const {
      magicLinksEnabled,
      publicFormEnabled,
      manualImportEnabled,
      requireRating,
      formIntroCopy,
    } = body;

    let [creator] = await db
      .select()
      .from(creators)
      .where(eq(creators.id, user.id));

    if (!creator) {
      return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
    }

    const updatedSettings = {
      ...(creator.settings || {}),
      magicLinksEnabled: typeof magicLinksEnabled === "boolean" ? magicLinksEnabled : true,
      publicFormEnabled: typeof publicFormEnabled === "boolean" ? publicFormEnabled : true,
      manualImportEnabled: typeof manualImportEnabled === "boolean" ? manualImportEnabled : true,
      requireRating: typeof requireRating === "boolean" ? requireRating : true,
      formIntroCopy: typeof formIntroCopy === "string" ? formIntroCopy : "Share your experience working with us!",
    };

    const [updated] = await db
      .update(creators)
      .set({
        settings: updatedSettings,
        updatedAt: new Date(),
      })
      .where(eq(creators.id, user.id))
      .returning();

    return NextResponse.json({
      success: true,
      settings: updated.settings,
    });
  } catch (error: any) {
    console.error("POST /api/channels error:", error);
    return NextResponse.json({ error: error.message || "Failed to save channel configurations" }, { status: 500 });
  }
}
