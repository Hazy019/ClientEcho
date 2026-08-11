import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { db } from "@/db";
import { magicLinkTokens } from "@/db/schema";
import { lt, isNull, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    // Verify cron authorization header if configured
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }

    const now = new Date();
    const deleted = await db
      .delete(magicLinkTokens)
      .where(and(lt(magicLinkTokens.expiresAt, now), isNull(magicLinkTokens.usedAt)))
      .returning();

    return NextResponse.json({
      success: true,
      purgedCount: deleted.length,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Cron purge error:", error);
    return NextResponse.json({ error: "Cron execution failed" }, { status: 500 });
  }
}
