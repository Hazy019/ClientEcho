import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { adminAuditLog, creators, widgets } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET /api/admin/suspend -> Fetch creator accounts and latest audit trail
export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.app_metadata?.role !== "tech_admin") {
      return NextResponse.json(
        { error: "Forbidden: Tech Admin role required" },
        { status: 403 }
      );
    }

    const [allCreators, latestLogs] = await Promise.all([
      db.select().from(creators).orderBy(desc(creators.createdAt)).limit(100),
      db.select().from(adminAuditLog).orderBy(desc(adminAuditLog.createdAt)).limit(50),
    ]);

    return NextResponse.json({
      success: true,
      creators: allCreators,
      logs: latestLogs,
    });
  } catch (err: any) {
    console.error("Admin fetch creators error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch admin data" },
      { status: 500 }
    );
  }
}

// POST /api/admin/suspend -> Suspend or Unsuspend a creator account with immutable audit trail
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Enforce Tech Admin Role Requirement
    if (!user || user.app_metadata?.role !== "tech_admin") {
      return NextResponse.json(
        { error: "Forbidden: Tech Admin role required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { targetEmail, reason, action = "suspend" } = body;

    if (!targetEmail) {
      return NextResponse.json(
        { error: "Target creator email is required" },
        { status: 400 }
      );
    }

    const isSuspend = action === "suspend";

    // Lookup creator by email
    const [creator] = await db
      .select()
      .from(creators)
      .where(eq(creators.email, targetEmail.toLowerCase().trim()));

    // Perform atomic transaction: mutate subscription status & active widgets, log to immutable audit trail
    await db.transaction(async (tx) => {
      if (creator) {
        const nextStatus = isSuspend
          ? "suspended"
          : creator.stripeSubscriptionId
          ? "active"
          : "free";

        await tx
          .update(creators)
          .set({
            subscriptionStatus: nextStatus,
            updatedAt: new Date(),
          })
          .where(eq(creators.id, creator.id));

        // Disable or re-enable associated widgets
        await tx
          .update(widgets)
          .set({
            isActive: !isSuspend,
            updatedAt: new Date(),
          })
          .where(eq(widgets.creatorId, creator.id));
      }

      await tx.insert(adminAuditLog).values({
        adminId: user.email || user.id,
        action: isSuspend ? "ACCOUNT_SUSPENSION" : "ACCOUNT_UNSUSPENSION",
        targetType: "creator_account",
        targetId: creator?.id || targetEmail,
        details: {
          action: isSuspend ? "suspend" : "unsuspend",
          reason:
            reason ||
            (isSuspend
              ? "Flagged for abusive public form submissions / terms violation"
              : "Reinstated by Tech Administrator"),
          targetEmail: targetEmail.toLowerCase().trim(),
          timestamp: new Date().toISOString(),
        },
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "Unknown",
      });
    });

    const [updatedCreators, latestLogs] = await Promise.all([
      db.select().from(creators).orderBy(desc(creators.createdAt)).limit(100),
      db.select().from(adminAuditLog).orderBy(desc(adminAuditLog.createdAt)).limit(50),
    ]);

    return NextResponse.json({
      success: true,
      message: isSuspend
        ? `Account ${targetEmail} suspended successfully.`
        : `Account ${targetEmail} reactivated and un-suspended successfully.`,
      creators: updatedCreators,
      logs: latestLogs,
    });
  } catch (err: any) {
    console.error("Admin suspension/unsuspension error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process administrative action" },
      { status: 500 }
    );
  }
}
