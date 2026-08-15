import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { creators } from "@/db/schema";
import { eq } from "drizzle-orm";

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
      notifyOnSubmission: true,
      notifyOnApproval: true,
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

    return NextResponse.json({
      creator: {
        id: creator.id,
        email: creator.email, // Server-enforced read-only email
        name: creator.name || "Workspace Creator",
        settings: currentSettings,
      },
    });
  } catch (error: any) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ error: error.message || "Failed to load settings" }, { status: 500 });
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
    const { workspaceName, notifyOnSubmission, notifyOnApproval } = body;

    let [creator] = await db
      .select()
      .from(creators)
      .where(eq(creators.id, user.id));

    if (!creator) {
      return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
    }

    const updatedSettings = {
      ...(creator.settings || {}),
      notifyOnSubmission: typeof notifyOnSubmission === "boolean" ? notifyOnSubmission : true,
      notifyOnApproval: typeof notifyOnApproval === "boolean" ? notifyOnApproval : true,
    };

    const [updated] = await db
      .update(creators)
      .set({
        name: workspaceName !== undefined ? workspaceName : creator.name,
        settings: updatedSettings,
        updatedAt: new Date(),
      })
      .where(eq(creators.id, user.id))
      .returning();

    return NextResponse.json({
      success: true,
      creator: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        settings: updated.settings,
      },
    });
  } catch (error: any) {
    console.error("POST /api/settings error:", error);
    return NextResponse.json({ error: error.message || "Failed to save settings" }, { status: 500 });
  }
}
