import { Resend } from "resend";
import nodemailer from "nodemailer";
import { logger } from "@/lib/logger";

const resendApiKey = process.env.RESEND_API_KEY;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

function getSmtpTransporter() {
  const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.SMTP_PASSWORD;

  if (gmailUser && gmailAppPassword) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser.trim(),
        pass: gmailAppPassword.replace(/\s+/g, "").trim(),
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 5000, // 5s connection timeout to avoid hanging
      greetingTimeout: 4000,   // 4s greeting timeout
      socketTimeout: 6000,     // 6s socket timeout
    });
  }
  return null;
}

export function getBaseUrl(req?: Request): string {
  // 1. Explicit environment variable configured by user
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  // 2. Request context (Headers from incoming HTTP request)
  if (req) {
    try {
      const proto = req.headers.get("x-forwarded-proto") || "https";
      const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
      if (host && !host.includes("localhost")) {
        return `${proto}://${host}`.replace(/\/$/, "");
      }
    } catch {}
  }

  // 3. Vercel Production / Deployment URLs
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
  }

  // 4. Fallback default production domain
  if (process.env.NODE_ENV === "production") {
    return "https://client-echo-web.vercel.app";
  }

  // 5. Development localhost fallback
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function getFromAddress(senderName?: string): string {
  const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
  const displayName = senderName ? `${senderName} via ClientEcho` : "ClientEcho";
  if (gmailUser) {
    return `${displayName} <${gmailUser.trim()}>`;
  }
  const envFrom = process.env.EMAIL_FROM || process.env.RESEND_FROM_ADDRESS;
  if (envFrom && !envFrom.includes("@clientecho.com")) {
    return envFrom;
  }
  // Default to Resend testing domain if no Gmail SMTP is configured
  return `${displayName} <onboarding@resend.dev>`;
}

/**
 * Universal email dispatcher: routes through Gmail SMTP if configured,
 * otherwise falls back to Resend API.
 * Uses strict timeouts to guarantee non-blocking execution.
 * Configured with authentic 1-to-1 transactional headers for Primary Inbox delivery.
 */
async function sendEmailMessage(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  from?: string;
  headers?: Record<string, string>;
}): Promise<{ success: boolean; error?: string }> {
  const fromAddress = options.from || getFromAddress();
  const transporter = getSmtpTransporter();

  // Generate unique RFC 5322 Message-ID to ensure distinct deliverability tracking
  const userDomain = (process.env.GMAIL_USER || "mail.clientecho.com").split("@")[1] || "clientecho.com";
  const uniqueMessageId = `<${Date.now()}.${Math.random().toString(36).substring(2, 11)}@${userDomain}>`;

  // Authentic 1-to-1 transactional headers (No Auto-Submitted or List-Unsubscribe to avoid Promotions/Updates tabs)
  const deliverabilityHeaders: Record<string, string> = {
    "Message-ID": uniqueMessageId,
    "X-Priority": "3",
    "X-MSMail-Priority": "Normal",
    "Importance": "Normal",
    ...options.headers,
  };

  // 1. Send via Gmail SMTP if configured (Primary Inbox Delivery)
  if (transporter) {
    try {
      const sendPromise = transporter.sendMail({
        from: fromAddress,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo,
        headers: deliverabilityHeaders,
      });

      const timeoutPromise = new Promise<{ timeout: true }>((resolve) =>
        setTimeout(() => resolve({ timeout: true }), 6000)
      );

      const result = await Promise.race([sendPromise, timeoutPromise]);
      if (result && "timeout" in result) {
        logger.error(`[GMAIL_SMTP_TIMEOUT] Timeout while sending email to ${options.to}`);
        return { success: false, error: "SMTP connection timed out" };
      }

      logger.info(`[GMAIL_SMTP] Email delivered to ${options.to}: [${options.subject}]`);
      return { success: true };
    } catch (err: any) {
      logger.error(`[GMAIL_SMTP_ERROR] Failed to send to ${options.to}`, err);
      return { success: false, error: err?.message || "Failed to send email via Gmail SMTP" };
    }
  }

  // 2. Send via Resend API
  if (resend) {
    try {
      const sendPromise = resend.emails.send({
        from: fromAddress,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo,
        headers: deliverabilityHeaders,
      });

      const timeoutPromise = new Promise<{ timeout: true }>((resolve) =>
        setTimeout(() => resolve({ timeout: true }), 6000)
      );

      const result = await Promise.race([sendPromise, timeoutPromise]);
      if (result && "timeout" in result) {
        logger.error(`[RESEND_TIMEOUT] Timeout while sending email via Resend to ${options.to}`);
        return { success: false, error: "Resend API request timed out" };
      }

      return { success: true };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      logger.error(`Failed to send email via Resend`, err, { recipient: options.to });
      return { success: false, error: errMsg || "Failed to send email" };
    }
  }

  // 3. Local / Dev fallback logger
  logger.info(`[DEV / TEST] Email logged for ${options.to}: [${options.subject}]`);
  return { success: true };
}

export async function sendMagicLinkApprovalEmail(params: {
  toEmail: string;
  creatorName: string;
  creatorEmail?: string;
  replyToEmail?: string;
  rawToken: string;
  promptMessage?: string;
  appUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  const appUrl = params.appUrl || getBaseUrl();
  const approvalUrl = `${appUrl}/approve-testimonial?token=${encodeURIComponent(params.rawToken)}`;
  const replyTo = params.replyToEmail || params.creatorEmail;

  const plainText = `
Hi ${params.toEmail.split("@")[0] || "there"},

${params.creatorName || "Your service provider"} has prepared a draft testimonial for you to review and approve on ClientEcho.

${params.promptMessage ? `Note from ${params.creatorName}:\n"${params.promptMessage}"\n\n` : ""}You can review the draft quote, adjust the wording or star rating, and approve it here:
${approvalUrl}

This secure review link is unique to your email address and does not require an account.
Sent via ClientEcho Verification Engine.
If you did not expect this invitation, you can safely ignore this email.
`.trim();

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Testimonial Review Request</title>
    </head>
    <body style="margin: 0; padding: 24px 12px; background-color: #f8f8f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D2D2D;">
      <!-- Hidden Preheader -->
      <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
        ${params.creatorName || "Your service provider"} has invited you to review a draft testimonial on ClientEcho.
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e7e7e5; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
        <!-- Header -->
        <tr>
          <td style="padding: 32px 32px 20px 32px; border-bottom: 1px solid #f0f0ee; text-align: center;">
            <div style="font-size: 11px; font-weight: 700; font-family: monospace; text-transform: uppercase; letter-spacing: 0.08em; color: #555555; background-color: #f4f4f2; padding: 4px 12px; border-radius: 20px; display: inline-block; margin-bottom: 12px;">
              Testimonial Review
            </div>
            <h1 style="font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0; line-height: 1.3;">
              Review Request from ${params.creatorName || "Your Service Provider"}
            </h1>
          </td>
        </tr>

        <!-- Body Content -->
        <tr>
          <td style="padding: 28px 32px;">
            <p style="font-size: 15px; line-height: 1.6; color: #3d3d3d; margin: 0 0 20px 0;">
              Hi there, <strong>${params.creatorName || "your service provider"}</strong> has prepared a quick draft testimonial for your recent work together.
            </p>

            ${
              params.promptMessage
                ? `
                <div style="background-color: #f9f9f8; border-left: 3px solid #2D2D2D; padding: 14px 18px; margin-bottom: 24px; border-radius: 0 12px 12px 0; font-size: 14px; line-height: 1.6; color: #444444; font-style: italic;">
                  "${params.promptMessage}"
                </div>
                `
                : ""
            }

            <p style="font-size: 14px; line-height: 1.5; color: #666666; margin: 0 0 24px 0;">
              You can review the quote, adjust the wording, and approve it in one step:
            </p>

            <!-- CTA Button -->
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
              <tr>
                <td style="background-color: #2D2D2D; border-radius: 12px; text-align: center;">
                  <a href="${approvalUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 12px;">
                    Review &amp; Approve Testimonial &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <p style="font-size: 12px; line-height: 1.6; color: #888888; margin: 0;">
              Or open this direct link in your browser:<br>
              <a href="${approvalUrl}" style="color: #2D2D2D; word-break: break-all; text-decoration: underline;">${approvalUrl}</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding: 20px 32px; background-color: #fafaf9; border-top: 1px solid #f0f0ee; text-align: center;">
            <p style="font-size: 12px; color: #888888; line-height: 1.5; margin: 0 0 6px 0;">
              Secure single-use review link. Powered by <strong>ClientEcho</strong> verification.
            </p>
            <p style="font-size: 11px; color: #aaaaaa; margin: 0;">
              Sent to ${params.toEmail}. If you received this by mistake, you can safely ignore it.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const fromAddress = getFromAddress(params.creatorName);

  return sendEmailMessage({
    to: params.toEmail,
    from: fromAddress,
    replyTo: replyTo || undefined,
    subject: `${params.creatorName || "Your service provider"} invited you to review a testimonial draft`,
    text: plainText,
    html,
  });
}

export async function sendNewSubmissionNotificationEmail(params: {
  creatorEmail: string;
  creatorName?: string;
  authorName: string;
  content: string;
  widgetName: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendEmailMessage({
    to: params.creatorEmail,
    subject: `New Testimonial Submitted by ${params.authorName}`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #2D2D2D; background-color: #ffffff;">
        <h2 style="color: #2D2D2D; font-size: 20px; font-weight: bold; margin-bottom: 16px;">New Testimonial Submission</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #33363B; margin-bottom: 16px;">
          A new client testimonial was submitted for your widget <strong>${params.widgetName}</strong>.
        </p>
        <blockquote style="border-left: 4px solid #2D2D2D; padding-left: 14px; color: #444; font-style: italic; margin-bottom: 24px;">
          "${params.content}" — <strong>${params.authorName}</strong>
        </blockquote>
        <p style="font-size: 14px; color: #666;">
          Log in to your ClientEcho dashboard Approval Queue to review and publish this testimonial.
        </p>
      </div>
    `,
  });
}

export async function sendMagicLinkApprovedNotificationEmail(params: {
  creatorEmail: string;
  creatorName?: string;
  clientEmail: string;
  authorName: string;
  widgetName: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendEmailMessage({
    to: params.creatorEmail,
    subject: `Magic Link Approved by ${params.authorName}!`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #2D2D2D; background-color: #ffffff;">
        <h2 style="color: #2D2D2D; font-size: 20px; font-weight: bold; margin-bottom: 16px;">Testimonial Approved!</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #33363B; margin-bottom: 16px;">
          Great news! <strong>${params.authorName}</strong> (${params.clientEmail}) clicked your 1-click magic link and approved their testimonial for widget <strong>${params.widgetName}</strong>.
        </p>
        <p style="font-size: 14px; color: #666;">
          The approved testimonial is now live in your embed widget.
        </p>
      </div>
    `,
  });
}

export async function sendSupportEmail(params: {
  fromEmail: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  const supportInbox = process.env.SUPPORT_EMAIL || "support@clientecho.com";

  return sendEmailMessage({
    to: supportInbox,
    replyTo: params.fromEmail,
    subject: `[Dashboard Support Query] ${params.subject}`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #2D2D2D;">
        <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 12px;">New Dashboard Support Request</h3>
        <p><strong>From:</strong> ${params.fromEmail}</p>
        <p><strong>Subject:</strong> ${params.subject}</p>
        <div style="background-color: #F7FAFC; padding: 16px; border-radius: 12px; margin-top: 16px; font-size: 14px; line-height: 1.6;">
          ${params.message.replace(/\n/g, "<br/>")}
        </div>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(params: {
  toEmail: string;
  rawToken: string;
  appUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  const appUrl = params.appUrl || getBaseUrl();
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(params.rawToken)}`;

  return sendEmailMessage({
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
}

export async function sendEmailVerificationLink(params: {
  toEmail: string;
  rawToken: string;
  appUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  const appUrl = params.appUrl || getBaseUrl();
  const verifyUrl = `${appUrl}/api/auth/verify-email?token=${encodeURIComponent(params.rawToken)}`;

  return sendEmailMessage({
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
}
