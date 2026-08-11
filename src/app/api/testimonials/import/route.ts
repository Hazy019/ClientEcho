import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { testimonials, widgets } from "@/db/schema";
import { manualImportSchema } from "@/lib/validation/schemas";
import { sanitizeHtml, sanitizePlainText } from "@/lib/security/sanitizer";
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
    const validation = manualImportSchema.safeParse(body);

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

    const cleanAuthorName = sanitizePlainText(data.authorName);
    const cleanAuthorTitle = data.authorTitle ? sanitizePlainText(data.authorTitle) : null;
    const cleanContent = sanitizeHtml(data.content);

    // Insert imported testimonial with forced is_imported_self_reported = true
    const [imported] = await db
      .insert(testimonials)
      .values({
        widgetId: widget.id,
        creatorId: user.id,
        authorName: cleanAuthorName,
        authorTitle: cleanAuthorTitle,
        content: cleanContent,
        rating: data.rating,
        status: "approved",
        source: "manual_import",
        proofImageUrl: data.proofImageUrl || null,
        isImportedSelfReported: true, // HARDCODED TRUST SIGNAL FLAG
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "Testimonial imported successfully",
      testimonial: imported,
    });
  } catch (error: any) {
    console.error("Manual import error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
