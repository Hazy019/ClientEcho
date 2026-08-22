import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { adminAuditLog, creators } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

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
    const { targetEmail, reason } = body;

    if (!targetEmail) {
      return NextResponse.json(
        { error: "Target creator email is required" },
        { status: 400 }
      );
    }

    // Lookup creator by email
    const [creator] = await db
      .select()
      .from(creators)
      .where(eq(creators.email, targetEmail));

    // Perform atomic transaction: mark creator subscription status as suspended and log to immutable audit trail
    await db.transaction(async (tx) => {
      if (creator) {
        await tx
          .update(creators)
          .set({
            subscriptionStatus: "suspended",
            updatedAt: new Date(),
          })
          .where(eq(creators.id, creator.id));
      }

      await tx.insert(adminAuditLog).values({
        adminId: user.email || user.id,
        action: "ACCOUNT_SUSPENSION",
        targetType: "creator_account",
        targetId: creator?.id || targetEmail,
        details: {
          reason: reason || "Flagged for abusive public form submissions / terms violation",
          targetEmail: targetEmail,
          timestamp: new Date().toISOString(),
        },
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "Unknown",
      });
    });

    return NextResponse.json({
      success: true,
      message: `Account suspension recorded for ${targetEmail}.`,
    });
  } catch (err: any) {
    console.error("Admin suspension error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process suspension action" },
      { status: 500 }
    );
  }
}
