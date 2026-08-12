import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { testimonials, widgets } from "@/db/schema";
import { invalidateWidgetCache } from "@/lib/cache/redis";
import { eq, and } from "drizzle-orm";


export const dynamic = "force-dynamic";

// GET /api/testimonials -> Fetch creator's testimonials
export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const creatorTestimonials = await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.creatorId, user.id));

    return NextResponse.json({ testimonials: creatorTestimonials });
  } catch (error) {
    console.error("Fetch testimonials error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/testimonials -> Update testimonial status (approve / reject)
export async function PATCH(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status } = await req.json();
    if (!id || !["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Verify creator owns the testimonial before updating
    const [updated] = await db
      .update(testimonials)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(testimonials.id, id), eq(testimonials.creatorId, user.id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Testimonial not found or unauthorized" }, { status: 404 });
    }

    // Invalidate Redis cache for associated widget
    try {
      const [targetWidget] = await db.select().from(widgets).where(eq(widgets.id, updated.widgetId));
      if (targetWidget?.slug) {
        await invalidateWidgetCache(targetWidget.slug);
      }
    } catch (cacheErr) {
      console.error("Cache invalidation error:", cacheErr);
    }

    return NextResponse.json({ success: true, testimonial: updated });

  } catch (error) {
    console.error("Update testimonial status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/testimonials -> Delete owned testimonial
export async function DELETE(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing testimonial id" }, { status: 400 });
    }

    const [deleted] = await db
      .delete(testimonials)
      .where(and(eq(testimonials.id, id), eq(testimonials.creatorId, user.id)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Testimonial not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Testimonial deleted" });
  } catch (error) {
    console.error("Delete testimonial error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
