import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { widgets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const slugParamSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(50, "Slug must be at most 50 characters")
  .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens");

// GET /api/widgets/check-slug?slug=my-portfolio -> Check real-time slug availability across all tenants
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawSlug = (searchParams.get("slug") || "").trim().toLowerCase();

    if (!rawSlug) {
      return NextResponse.json(
        { available: false, error: "Slug query parameter is required." },
        { status: 400 }
      );
    }

    const validation = slugParamSchema.safeParse(rawSlug);
    if (!validation.success) {
      return NextResponse.json(
        {
          available: false,
          error: validation.error.errors[0]?.message || "Invalid slug format.",
        },
        { status: 400 }
      );
    }

    const slug = validation.data;

    // Check if user is authenticated (optional, allows identifying own widgets)
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Query across ALL tenants to check global uniqueness
    const [existingWidget] = await db
      .select({ id: widgets.id, creatorId: widgets.creatorId, slug: widgets.slug })
      .from(widgets)
      .where(eq(widgets.slug, slug));

    if (!existingWidget) {
      return NextResponse.json({
        available: true,
        slug,
        isOwner: false,
        message: `"${slug}" is available!`,
      });
    }

    // If widget exists and belongs to the currently logged in user
    if (user && existingWidget.creatorId === user.id) {
      return NextResponse.json({
        available: true,
        slug,
        isOwner: true,
        message: `"${slug}" is your existing widget URL.`,
      });
    }

    // Slug is already taken by another creator
    return NextResponse.json({
      available: false,
      slug,
      isOwner: false,
      message: `The URL "${slug}" is already taken. Try a different one.`,
    });
  } catch (error) {
    console.error("Check slug error:", error);
    return NextResponse.json(
      { available: false, error: "Failed to check slug availability." },
      { status: 500 }
    );
  }
}
