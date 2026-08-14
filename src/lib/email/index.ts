import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendMagicLinkApprovalEmail(params: {
  toEmail: string;
  creatorName: string;
  rawToken: string;
  promptMessage?: string;
}): Promise<{ success: boolean; error?: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const approvalUrl = `${appUrl}/approve-testimonial?token=${encodeURIComponent(params.rawToken)}`;

  if (!resend) {
    console.log(`[DEV / TEST] Magic link email for ${params.toEmail}: ${approvalUrl}`);
    return { success: true };
  }

  try {
    const fromEmail = process.env.EMAIL_FROM || "ClientEcho <noreply@clientecho.com>";
    await resend.emails.send({
      from: fromEmail,
      to: params.toEmail,
      subject: `${params.creatorName || "A freelancer"} requested a testimonial from you`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #111827;">
          <h2 style="color: #4f46e5; margin-bottom: 16px;">Testimonial Request</h2>
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            Hi there! <strong>${params.creatorName || "Your service provider"}</strong> has requested a client testimonial for their work.
          </p>
          ${params.promptMessage ? `<blockquote style="border-left: 4px solid #4f46e5; padding-left: 12px; color: #4b5563; font-style: italic; margin-bottom: 24px;">${params.promptMessage}</blockquote>` : ""}
          <div style="margin: 30px 0;">
            <a href="${approvalUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Review & Approve Testimonial
            </a>
          </div>
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            If you did not request this email or do not wish to leave a review, you can safely ignore this email.
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (err: any) {
    console.error("Failed to send Resend email:", err);
    return { success: false, error: err.message || "Failed to send email" };
  }
}

export async function sendPasswordResetEmail(params: {
  toEmail: string;
  rawToken: string;
}): Promise<{ success: boolean; error?: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(params.rawToken)}`;

  if (!resend) {
    console.log(`[DEV / TEST] Password reset email for ${params.toEmail}: ${resetUrl}`);
    return { success: true };
  }

  try {
    const fromEmail = process.env.EMAIL_FROM || "ClientEcho <noreply@clientecho.com>";
    await resend.emails.send({
      from: fromEmail,
      to: params.toEmail,
      subject: "Reset Your ClientEcho Password",
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #2D2D2D; background-color: #ffffff;">
          <h2 style="color: #2D2D2D; font-size: 20px; font-weight: bold; margin-bottom: 16px;">Password Reset Request</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #33363B; margin-bottom: 24px;">
            We received a request to reset your password for your ClientEcho workspace. Click the button below to set a new password:
          </p>
          <div style="margin: 24px 0;">
            <a href="${resetUrl}" style="background-color: #2D2D2D; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 12px; font-weight: 600; display: inline-block; font-size: 14px;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 13px; color: #666; margin-top: 24px; line-height: 1.5;">
            This link is valid for 45 minutes and can only be used once. If you did not request a password reset, you can safely ignore this email.
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (err: any) {
    console.error("Failed to send Password Reset Resend email:", err);
    return { success: false, error: err.message || "Failed to send reset email" };
  }
}

export async function sendEmailVerificationLink(params: {
  toEmail: string;
  rawToken: string;
}): Promise<{ success: boolean; error?: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${appUrl}/api/auth/verify-email?token=${encodeURIComponent(params.rawToken)}`;

  if (!resend) {
    console.log(`[DEV / TEST] Email verification link for ${params.toEmail}: ${verifyUrl}`);
    return { success: true };
  }

  try {
    const fromEmail = process.env.EMAIL_FROM || "ClientEcho <noreply@clientecho.com>";
    await resend.emails.send({
      from: fromEmail,
      to: params.toEmail,
      subject: "Activate Your ClientEcho Workspace",
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #2D2D2D; background-color: #ffffff;">
          <h2 style="color: #2D2D2D; font-size: 20px; font-weight: bold; margin-bottom: 16px;">Verify Your Email Address</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #33363B; margin-bottom: 24px;">
            Thank you for creating your ClientEcho workspace! Click below to verify your email address and activate your account.
          </p>
          <div style="margin: 24px 0;">
            <a href="${verifyUrl}" style="background-color: #2D2D2D; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 12px; font-weight: 600; display: inline-block; font-size: 14px;">
              Verify Email Address
            </a>
          </div>
          <p style="font-size: 13px; color: #666; margin-top: 24px; line-height: 1.5;">
            This link expires in 24 hours. If you did not create a ClientEcho account, no further action is required.
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (err: any) {
    console.error("Failed to send Verification email:", err);
    return { success: false, error: err.message || "Failed to send verification email" };
  }
}

