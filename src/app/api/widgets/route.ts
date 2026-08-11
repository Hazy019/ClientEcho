import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { widgets } from "@/db/schema";
import { widgetSchema } from "@/lib/validation/schemas";
import { eq } from "drizzle-orm";

// GET /api/widgets -> List creator's widgets
export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const creatorWidgets = await db
      .select()
      .from(widgets)
      .where(eq(widgets.creatorId, user.id));

    return NextResponse.json({ widgets: creatorWidgets });
  } catch (error) {
    console.error("Fetch widgets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/widgets -> Create new widget
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
    const validation = widgetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check slug uniqueness
    const [existing] = await db
      .select()
      .from(widgets)
      .where(eq(widgets.slug, data.slug));

    if (existing) {
      return NextResponse.json(
        { error: "Widget slug is already taken. Please choose a unique slug." },
        { status: 400 }
      );
    }

    const [newWidget] = await db
      .insert(widgets)
      .values({
        creatorId: user.id,
        name: data.name,
        slug: data.slug,
        themeConfig: data.themeConfig,
        isActive: data.isActive,
      })
      .returning();

    return NextResponse.json({ success: true, widget: newWidget });
  } catch (error: any) {
    console.error("Create widget error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
