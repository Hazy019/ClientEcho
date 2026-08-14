import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/db";
import { passwordResetTokens } from "@/db/schema";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkDualRateLimit } from "@/lib/security/rate-limit";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Upstash sliding-window rate limiting per-IP and per-email
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateLimit = await checkDualRateLimit(ip, `forgot-pwd-${cleanEmail}`);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: rateLimit.reason || "Too many password reset attempts. Please wait before trying again." },
        { status: 429 }
      );
    }

    // 2. Generate cryptographically secure 32-byte random token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 45 * 60 * 1000); // 45 minutes

    // 3. Store hash in DB
    try {
      await db.insert(passwordResetTokens).values({
        userEmail: cleanEmail,
        tokenHash,
        expiresAt,
      });

      // 4. Send email via Resend
      await sendPasswordResetEmail({
        toEmail: cleanEmail,
        rawToken,
      });
    } catch (dbErr) {
      console.error("[FORGOT PASSWORD DB/EMAIL WARN]", dbErr);
      // Fail silently to preserve generic timing response
    }

    // 5. ALWAYS return generic confirmation to prevent account enumeration
    return NextResponse.json({
      success: true,
      message: "If an account exists for this email, a reset link has been sent.",
    });
  } catch (err) {
    console.error("[FORGOT PASSWORD ROUTE ERROR]", err);
    return NextResponse.json({
      success: true,
      message: "If an account exists for this email, a reset link has been sent.",
    });
  }
}
