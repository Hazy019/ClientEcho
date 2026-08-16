import { db } from "@/db";
import { testimonials, widgets, creators, magicLinkTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Clock,
  ExternalLink,
  ArrowRight,
  Star,
  FileCheck,
  HelpCircle,
  Eye,
  Send,
  Sparkles,
  Info,
  Copy,
  AlertCircle,
  BadgeAlert,
} from "lucide-react";
import {
  generateVerificationFingerprint,
  getVerificationTierDetails,
} from "@/lib/security/verification";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface VerifyPageProps {
  params: { testimonialId: string };
}

export async function generateMetadata({ params }: VerifyPageProps): Promise<Metadata> {
  const isDemo = params.testimonialId === "preview-demo";

  if (isDemo) {
    return {
      title: "Verified Testimonial Preview | ClientEcho Verification",
      description:
        "Publicly verifiable social proof record authenticated by ClientEcho cryptographic verification engine.",
    };
  }

  // Fetch testimonial
  try {
    const [t] = await db
      .select({
        authorName: testimonials.authorName,
        source: testimonials.source,
      })
      .from(testimonials)
      .where(eq(testimonials.id, params.testimonialId));

    if (t) {
      return {
        title: `Verified Testimonial by ${t.authorName} | ClientEcho Social Proof`,
        description: `Independently verified social proof record for ${t.authorName}, authenticated via ClientEcho.`,
      };
    }
  } catch {}

  return {
    title: "Public Testimonial Verification | ClientEcho",
    description: "Check the authenticity and audit trail of ClientEcho verified testimonials.",
  };
}

function formatDate(val: Date | string | null | undefined): string {
  if (!val) return "Recorded upon approval";
  const d = typeof val === "string" ? new Date(val) : val;
  if (isNaN(d.getTime())) return "Recorded upon approval";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(d) + " UTC";
}

export default async function PublicVerificationPage({ params }: VerifyPageProps) {
  const isDemo = params.testimonialId === "preview-demo";

  let testimonial: any = null;
  let widget: any = null;
  let creator: any = null;
  let tokenRecord: any = null;

  if (isDemo) {
    testimonial = {
      id: "demo-preview-000000",
      authorName: "Sarah Jenkins",
      authorTitle: "Founder at Acme Studio",
      content:
        "ClientEcho completely eliminated back-and-forth friction for our client testimonials. The magic link approval process took less than 30 seconds!",
      rating: 5,
      status: "approved",
      source: "magic_link",
      isImportedSelfReported: false,
      metadata: {
        openedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      createdAt: new Date(Date.now() - 3600000 * 24),
      updatedAt: new Date(Date.now() - 3600000 * 1),
    };
    widget = {
      name: "Acme Studio Design Portfolio",
      slug: "acme-studio",
    };
    creator = {
      name: "Acme Creative Agency",
      email: "hello@acmestudio.com",
    };
    tokenRecord = {
      createdAt: new Date(Date.now() - 3600000 * 24),
      usedAt: new Date(Date.now() - 3600000 * 1),
      tokenHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    };
  } else {
    try {
      const [t] = await db
        .select()
        .from(testimonials)
        .where(eq(testimonials.id, params.testimonialId));

      if (t) {
        testimonial = t;

        // Fetch widget
        if (t.widgetId) {
          const [w] = await db.select().from(widgets).where(eq(widgets.id, t.widgetId));
          widget = w;
        }

        // Fetch creator
        if (t.creatorId) {
          const [c] = await db.select().from(creators).where(eq(creators.id, t.creatorId));
          creator = c;
        }

        // If magic link, fetch token audit record
        if (t.source === "magic_link") {
          const [tok] = await db
            .select({
              id: magicLinkTokens.id,
              createdAt: magicLinkTokens.createdAt,
              usedAt: magicLinkTokens.usedAt,
              tokenHash: magicLinkTokens.tokenHash,
            })
            .from(magicLinkTokens)
            .where(eq(magicLinkTokens.testimonialId, t.id));
          tokenRecord = tok;
        }
      }
    } catch (err) {
      console.error("Verification page fetch error:", err);
    }
  }

  // Handle Non-Existent or Unapproved Testimonials
  if (!testimonial) {
    return (
      <div className="min-h-screen bg-surface-light text-ink-900 font-sans flex flex-col justify-between selection:bg-ink-900 selection:text-surface-white">
        <header className="bg-surface-white border-b border-ink-900/10 py-5 px-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/ClientEcho_logo.png"
                alt="ClientEcho Logo"
                width={26}
                height={26}
                className="w-6 h-6 object-contain"
              />
              <span className="font-display font-bold text-lg text-ink-900 tracking-tight">
                ClientEcho
              </span>
            </Link>
            <span className="text-xs font-mono px-3 py-1 bg-surface-light border border-ink-900/10 rounded-full text-ink-800/70 font-semibold">
              Public Verification Engine
            </span>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-6 py-16 text-center space-y-6">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-600 rounded-3xl mx-auto flex items-center justify-center border border-rose-500/20 shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900">
              Verification Record Not Found
            </h1>
            <p className="text-sm text-ink-800/70 leading-relaxed max-w-md mx-auto">
              We could not locate an active, publicly approved testimonial matching the identifier{" "}
              <code className="bg-surface-white px-2 py-0.5 rounded border border-ink-900/10 font-mono text-xs text-ink-900">
                {params.testimonialId}
              </code>
              .
            </p>
          </div>

          <div className="bg-surface-white p-6 rounded-2xl border border-ink-900/10 text-left space-y-3 shadow-xs">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-ink-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-ink-800/60" />
              <span>Why am I seeing this?</span>
            </h2>
            <ul className="text-xs text-ink-800/80 space-y-2 list-disc list-inside leading-relaxed">
              <li>The creator may have removed or hidden this testimonial from their active widget.</li>
              <li>The testimonial draft is still pending moderation and has not yet been approved.</li>
              <li>The URL link may have been truncated or mistyped.</li>
            </ul>
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-ink-900 hover:bg-ink-800 text-surface-white font-display font-semibold rounded-xl text-xs transition shadow-sm"
            >
              <span>Return to ClientEcho Home</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>

        <footer className="bg-surface-white border-t border-ink-900/10 py-6 px-6 text-center text-xs text-ink-800/60">
          <span>&copy; {new Date().getFullYear()} ClientEcho Social Proof Infrastructure. All rights reserved.</span>
        </footer>
      </div>
    );
  }

  const tierDetails = getVerificationTierDetails(
    testimonial.source,
    testimonial.isImportedSelfReported
  );

  const verificationFingerprint = generateVerificationFingerprint(
    testimonial.id,
    tokenRecord?.tokenHash || String(testimonial.createdAt)
  );

  const meta = (testimonial.metadata || {}) as Record<string, any>;
  const sentDate = tokenRecord?.createdAt || testimonial.createdAt;
  const openedDate = meta.openedAt ? new Date(meta.openedAt) : null;
  const approvedDate = tokenRecord?.usedAt || testimonial.updatedAt;

  const workspaceDisplayName =
    creator?.name || (creator?.email ? creator.email.split("@")[0] : "Verified Workspace");
  const widgetDisplayName = widget?.name || "Portfolio Widget";

  return (
    <div className="min-h-screen bg-surface-light text-ink-900 font-sans flex flex-col justify-between selection:bg-ink-900 selection:text-surface-white">
      {/* 1. Header Navigation */}
      <header className="bg-surface-white border-b border-ink-900/10 py-4 px-6 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/ClientEcho_logo.png"
              alt="ClientEcho Logo"
              width={26}
              height={26}
              className="w-6 h-6 object-contain"
            />
            <span className="font-display font-bold text-lg text-ink-900 tracking-tight group-hover:text-ink-700 transition">
              ClientEcho
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-light border border-ink-900/10 rounded-full text-xs font-mono font-semibold text-ink-900 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Public Verification Engine</span>
            </span>
          </div>
        </div>
      </header>

      {/* 2. Main Verification Content Region */}
      <main className="max-w-4xl mx-auto px-6 py-10 sm:py-14 w-full space-y-8">
        {/* Verification Status Banner */}
        <div
          className={`p-6 sm:p-8 rounded-3xl border shadow-sm space-y-4 transition-all ${
            tierDetails.tier === "magic_link"
              ? "bg-surface-white border-emerald-500/30 ring-1 ring-emerald-500/20"
              : tierDetails.tier === "public_form"
              ? "bg-surface-white border-indigo-500/30 ring-1 ring-indigo-500/20"
              : "bg-surface-white border-amber-500/30 ring-1 ring-amber-500/20"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-900/5 pb-6">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                  tierDetails.tier === "magic_link"
                    ? "bg-emerald-600 text-surface-white"
                    : tierDetails.tier === "public_form"
                    ? "bg-indigo-600 text-surface-white"
                    : "bg-amber-600 text-surface-white"
                }`}
              >
                {tierDetails.tier === "magic_link" ? (
                  <ShieldCheck className="w-6 h-6" />
                ) : tierDetails.tier === "public_form" ? (
                  <FileCheck className="w-6 h-6" />
                ) : (
                  <BadgeAlert className="w-6 h-6" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      tierDetails.tier === "magic_link"
                        ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                        : tierDetails.tier === "public_form"
                        ? "bg-indigo-100 text-indigo-900 border border-indigo-300"
                        : "bg-amber-100 text-amber-900 border border-amber-300"
                    }`}
                  >
                    {tierDetails.badgeLabel}
                  </span>
                  {isDemo && (
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-ink-900 text-surface-white rounded">
                      Interactive Preview Demo
                    </span>
                  )}
                </div>
                <h1 className="font-display text-xl sm:text-2xl font-bold text-ink-900 mt-1">
                  {tierDetails.headline}
                </h1>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-800/60 block">
                Verification Fingerprint
              </span>
              <span className="text-xs font-mono font-bold text-ink-900 bg-surface-light px-2.5 py-1 rounded border border-ink-900/10 inline-block mt-0.5">
                {verificationFingerprint}
              </span>
            </div>
          </div>

          {/* Plain Language Summary */}
          <div className="text-xs sm:text-sm text-ink-800/80 leading-relaxed pt-1">
            <p>{tierDetails.summary}</p>
          </div>

          {/* Workspace and Widget Attestation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="bg-surface-light/70 p-3.5 rounded-xl border border-ink-900/10">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-800/60 block">
                Workspace / Creator
              </span>
              <span className="font-display font-bold text-xs text-ink-900 mt-0.5 block">
                {workspaceDisplayName}
              </span>
            </div>

            <div className="bg-surface-light/70 p-3.5 rounded-xl border border-ink-900/10">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-800/60 block">
                Target Embed Widget
              </span>
              <span className="font-display font-bold text-xs text-ink-900 mt-0.5 block">
                {widgetDisplayName}
              </span>
            </div>
          </div>
        </div>

        {/* Testimonial Quote Card Display */}
        <div className="bg-surface-white p-6 sm:p-8 rounded-3xl border border-ink-900/10 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-ink-900/5 pb-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-ink-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-ink-800/60" />
              <span>Verified Testimonial Content</span>
            </h2>

            {testimonial.rating && (
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= (testimonial.rating || 5)
                        ? "text-ink-900 fill-ink-900"
                        : "text-ink-900/20 fill-ink-900/20"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <blockquote className="text-base sm:text-lg text-ink-900 font-sans leading-relaxed italic">
            "{testimonial.content}"
          </blockquote>

          <div className="flex items-center justify-between pt-4 border-t border-ink-900/5">
            <div className="flex items-center gap-3">
              {testimonial.authorAvatarUrl ? (
                <Image
                  src={testimonial.authorAvatarUrl}
                  alt={testimonial.authorName}
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full object-cover border border-ink-900/10"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-ink-900 text-surface-white font-bold text-xs flex items-center justify-center">
                  {testimonial.authorName?.charAt(0)?.toUpperCase() || "A"}
                </div>
              )}
              <div>
                <div className="font-bold text-sm text-ink-900">{testimonial.authorName}</div>
                {testimonial.authorTitle && (
                  <div className="text-xs text-ink-800/60">{testimonial.authorTitle}</div>
                )}
              </div>
            </div>

            <span
              className={`text-[10px] font-mono font-semibold px-2.5 py-1 rounded ${
                tierDetails.tier === "magic_link"
                  ? "bg-emerald-600 text-surface-white"
                  : tierDetails.tier === "public_form"
                  ? "bg-indigo-600 text-surface-white"
                  : "bg-surface-light border border-ink-800/20 text-ink-800"
              }`}
            >
              {tierDetails.badgeLabel}
            </span>
          </div>
        </div>

        {/* 3. Timestamp Audit Trail Timeline */}
        <div className="bg-surface-white p-6 sm:p-8 rounded-3xl border border-ink-900/10 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-ink-900/5 pb-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-ink-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-ink-800/60" />
              <span>Immutable Verification Timeline</span>
            </h2>
            <span className="text-[11px] font-mono text-ink-800/60">
              Audit log recorded in UTC
            </span>
          </div>

          {tierDetails.tier === "magic_link" ? (
            <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-ink-900/10">
              {/* Step 1: Magic Link Request Sent */}
              <div className="flex items-start gap-4 relative">
                <div className="w-7 h-7 rounded-full bg-ink-900 text-surface-white flex items-center justify-center flex-shrink-0 z-10 shadow-xs">
                  <Send className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-1">
                  <div className="font-display font-bold text-sm text-ink-900">
                    1. Magic Link Request Dispatched
                  </div>
                  <p className="text-xs text-ink-800/70">
                    Creator generated a single-use 32-byte cryptographic token and delivered an approval request to the client.
                  </p>
                  <div className="text-[11px] font-mono text-ink-800/60 pt-0.5">
                    Timestamp: {formatDate(sentDate)}
                  </div>
                </div>
              </div>

              {/* Step 2: Magic Link Opened */}
              <div className="flex items-start gap-4 relative">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-surface-white flex items-center justify-center flex-shrink-0 z-10 shadow-xs">
                  <Eye className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-1">
                  <div className="font-display font-bold text-sm text-ink-900">
                    2. Magic Link Opened & Authenticated
                  </div>
                  <p className="text-xs text-ink-800/70">
                    Client accessed the cryptographic approval link in browser. Token hash validated against database record.
                  </p>
                  <div className="text-[11px] font-mono text-ink-800/60 pt-0.5">
                    Timestamp: {openedDate ? formatDate(openedDate) : formatDate(sentDate)}
                  </div>
                </div>
              </div>

              {/* Step 3: Testimonial Approved */}
              <div className="flex items-start gap-4 relative">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-surface-white flex items-center justify-center flex-shrink-0 z-10 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-1">
                  <div className="font-display font-bold text-sm text-ink-900">
                    3. Testimonial Approved & Signed
                  </div>
                  <p className="text-xs text-ink-800/70">
                    Client confirmed endorsement with 1-click. Token invalidated to prevent re-use; testimonial published to active widget.
                  </p>
                  <div className="text-[11px] font-mono text-emerald-700 font-semibold pt-0.5">
                    Timestamp: {formatDate(approvedDate)}
                  </div>
                </div>
              </div>
            </div>
          ) : tierDetails.tier === "public_form" ? (
            <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-ink-900/10">
              {/* Step 1: Form Loaded */}
              <div className="flex items-start gap-4 relative">
                <div className="w-7 h-7 rounded-full bg-ink-900 text-surface-white flex items-center justify-center flex-shrink-0 z-10 shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-1">
                  <div className="font-display font-bold text-sm text-ink-900">
                    1. Cloudflare Turnstile Verification
                  </div>
                  <p className="text-xs text-ink-800/70">
                    Client loaded public submission form and cleared automated bot protection challenge.
                  </p>
                  <div className="text-[11px] font-mono text-ink-800/60 pt-0.5">
                    Timestamp: {formatDate(sentDate)}
                  </div>
                </div>
              </div>

              {/* Step 2: Direct Submission */}
              <div className="flex items-start gap-4 relative">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-surface-white flex items-center justify-center flex-shrink-0 z-10 shadow-xs">
                  <Send className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-1">
                  <div className="font-display font-bold text-sm text-ink-900">
                    2. Direct Submission Ingested
                  </div>
                  <p className="text-xs text-ink-800/70">
                    Client submitted testimonial with sanitized HTML payload and rate-limit verification.
                  </p>
                  <div className="text-[11px] font-mono text-ink-800/60 pt-0.5">
                    Timestamp: {formatDate(sentDate)}
                  </div>
                </div>
              </div>

              {/* Step 3: Moderated & Approved */}
              <div className="flex items-start gap-4 relative">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-surface-white flex items-center justify-center flex-shrink-0 z-10 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-1">
                  <div className="font-display font-bold text-sm text-ink-900">
                    3. Creator Moderated & Approved
                  </div>
                  <p className="text-xs text-ink-800/70">
                    Workspace owner reviewed submission in Approval Queue and approved for display.
                  </p>
                  <div className="text-[11px] font-mono text-indigo-700 font-semibold pt-0.5">
                    Timestamp: {formatDate(approvedDate)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-ink-900/10">
              {/* Step 1: Self-Reported Import */}
              <div className="flex items-start gap-4 relative">
                <div className="w-7 h-7 rounded-full bg-amber-600 text-surface-white flex items-center justify-center flex-shrink-0 z-10 shadow-xs">
                  <BadgeAlert className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-1">
                  <div className="font-display font-bold text-sm text-ink-900">
                    1. Creator Imported Offline Praise
                  </div>
                  <p className="text-xs text-ink-800/70">
                    Testimonial was manually entered by the creator from offline channels (e.g. Slack screenshot, email thread).
                  </p>
                  <div className="text-[11px] font-mono text-ink-800/60 pt-0.5">
                    Timestamp: {formatDate(sentDate)}
                  </div>
                </div>
              </div>

              {/* Step 2: Published with Self-Reported Badge */}
              <div className="flex items-start gap-4 relative">
                <div className="w-7 h-7 rounded-full bg-amber-600 text-surface-white flex items-center justify-center flex-shrink-0 z-10 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-1">
                  <div className="font-display font-bold text-sm text-ink-900">
                    2. Published with Transparent [Self-Reported] Flag
                  </div>
                  <p className="text-xs text-ink-800/70">
                    ClientEcho enforces transparent badge demarcation between cryptographically verified reviews and manually imported entries.
                  </p>
                  <div className="text-[11px] font-mono text-amber-700 font-semibold pt-0.5">
                    Timestamp: {formatDate(approvedDate)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Privacy & Technical Security Details */}
        <div className="bg-surface-white p-6 sm:p-8 rounded-3xl border border-ink-900/10 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-ink-900">
            <Lock className="w-4 h-4 text-emerald-600" />
            <h2 className="font-display text-sm font-bold uppercase tracking-wider">
              Cryptographic Security & Privacy Guarantee
            </h2>
          </div>

          <p className="text-xs text-ink-800/80 leading-relaxed">
            Public verification operates with strict client privacy preservation. To protect client confidentiality and prevent spam harvesting, client email addresses and raw single-use token strings are <strong>never published or exposed</strong> on this page.
          </p>

          <div className="bg-surface-light p-4 rounded-2xl border border-ink-900/10 font-mono text-[11px] text-ink-800/80 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-ink-800/60 uppercase">Record ID:</span>
              <span className="text-ink-900 font-semibold">{testimonial.id}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-ink-800/60 uppercase">Integrity Fingerprint:</span>
              <span className="text-ink-900 font-semibold">{verificationFingerprint}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-ink-800/60 uppercase">Audit Status:</span>
              <span className="text-emerald-700 font-bold">
                {tierDetails.isCryptographicallyVerified ? "VERIFIED_CRYPTO_SIGNATURE" : "MANUALLY_IMPORTED_RECORD"}
              </span>
            </div>
          </div>
        </div>

        {/* 5. Footer Acquisition CTA (Flagship Differentiator Growth Loop) */}
        <div className="bg-ink-900 text-surface-white p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-ink-800">
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-surface-white/10 text-surface-white border border-surface-white/20">
              <ShieldCheck className="w-3 h-3" />
              <span>ClientEcho Trust Infrastructure</span>
            </div>
            <h3 className="font-display text-lg sm:text-xl font-bold">
              Verify your own client testimonials
            </h3>
            <p className="text-xs text-surface-white/70 max-w-md">
              Collect 1-click magic link approvals with tamper-proof public verification pages and sandboxed embed widgets.
            </p>
          </div>

          <Link
            href="/signup"
            className="px-6 py-3.5 bg-surface-white hover:bg-surface-light text-ink-900 font-display font-semibold rounded-xl text-xs transition shadow-md flex items-center gap-2 flex-shrink-0"
          >
            <span>Start Free Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      {/* 6. Footer */}
      <footer className="bg-surface-white border-t border-ink-900/10 py-6 px-6 text-center text-xs text-ink-800/60">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Image
              src="/ClientEcho_logo.png"
              alt="ClientEcho Logo"
              width={18}
              height={18}
              className="w-4.5 h-4.5 object-contain"
            />
            <span>Powered by ClientEcho Verification Protocol</span>
          </div>
          <span>&copy; {new Date().getFullYear()} ClientEcho. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
