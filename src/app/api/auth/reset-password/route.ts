import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/db";
import { passwordResetTokens } from "@/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { rawToken, newPassword } = await req.json();

    if (!rawToken || typeof rawToken !== "string") {
      return NextResponse.json({ error: "Missing password reset token." }, { status: 400 });
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // 1. Hash the raw token
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // 2. Query valid token in DB
    const [tokenRecord] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Invalid, expired, or already used password reset link. Please request a new one." },
        { status: 400 }
      );
    }

    // 3. Update password in Supabase Auth
    const supabase = createClient();
    const { error: updateErr } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateErr) {
      console.error("[RESET PASSWORD SUPABASE ERROR]", updateErr);
    }

    // 4. Immediately invalidate token (mark usedAt)
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, tokenRecord.id));

    return NextResponse.json({
      success: true,
      message: "Your password has been successfully reset. Please sign in with your new password.",
    });
  } catch (err: any) {
    console.error("[RESET PASSWORD ROUTE ERROR]", err);
    return NextResponse.json(
      { error: err?.message || "An unexpected error occurred during password reset." },
      { status: 500 }
    );
  }
}
