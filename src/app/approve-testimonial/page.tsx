"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  Loader2,
  Edit3,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Eye,
  Check,
  Lock,
} from "lucide-react";
import { SkeletonBlock } from "@/components/ui/SkeletonBlock";

export const dynamic = "force-dynamic";

const RATING_LABELS: Record<number, string> = {
  5: "Exceptional — 5 out of 5 stars",
  4: "Great Experience — 4 out of 5 stars",
  3: "Good / Satisfactory — 3 out of 5 stars",
  2: "Fair / Needs Work — 2 out of 5 stars",
  1: "Poor Experience — 1 out of 5 stars",
};

function StarRating({
  rating,
  hoverRating,
  onRate,
  onHover,
  onLeave,
}: {
  rating: number;
  hoverRating: number | null;
  onRate: (v: number) => void;
  onHover: (v: number) => void;
  onLeave: () => void;
}) {
  const activeDisplayRating = hoverRating !== null ? hoverRating : rating;
  return (
    // onMouseLeave lives on the CONTAINER, not each button.
    // This prevents the flicker when moving between star buttons
    // (individual button leave fires before the next button's enter).
    <div
      className="flex items-center justify-center gap-2"
      onMouseLeave={onLeave}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          type="button"
          key={star}
          onClick={() => onRate(star)}
          onMouseEnter={() => onHover(star)}
          className="focus:outline-none transition-transform duration-150 hover:scale-110 active:scale-95 cursor-pointer"
          title={`Rate ${star} star${star > 1 ? "s" : ""}`}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            className={`w-9 h-9 sm:w-10 sm:h-10 transition-all duration-150 drop-shadow-sm ${
              star <= activeDisplayRating
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-neutral-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ApproveTestimonialContent() {
  const searchParams = useSearchParams();
  const rawTokenParam = searchParams.get("token") || "";
  const token = rawTokenParam.trim();

  const [loading, setLoading] = useState(true);
  const [validState, setValidState] = useState<{
    valid: boolean;
    reason?: string;
    testimonial?: any;
  }>({ valid: false });

  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [authorName, setAuthorName] = useState("");
  const [authorTitle, setAuthorTitle] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const verifyToken = () => {
    if (!token) {
      setLoading(false);
      setValidState({ valid: false, reason: "missing_token" });
      return;
    }

    setLoading(true);
    fetch(`/api/testimonials/approve-token?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        setValidState(data);
        if (data.valid && data.testimonial) {
          setAuthorName(data.testimonial.authorName || "");
          setAuthorTitle(data.testimonial.authorTitle || "");
          setContent(data.testimonial.content || "");
          setRating(data.testimonial.rating || 5);
        }
      })
      .catch(() => setValidState({ valid: false, reason: "network_error" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    verifyToken();
  }, [token]);

  const handleSubmitApproval = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token) return;

    if (!authorName.trim()) { setSubmitError("Please provide your name."); return; }
    if (!content.trim()) { setSubmitError("Testimonial content cannot be empty."); return; }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/testimonials/approve-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          authorName: authorName.trim(),
          authorTitle: authorTitle.trim() || undefined,
          content: content.trim(),
          rating,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setSubmitError(data.error || "Failed to submit approval. Please try again.");
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Shared page shell ───────────────────────────────────────────────────
  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="w-full min-h-screen min-h-[100dvh] bg-gradient-to-b from-[#fbfbfa] via-[#f5f5f3] to-[#ebebe8] flex flex-col items-center justify-start sm:justify-center font-sans px-4 py-8 sm:py-12 pb-[calc(env(safe-area-inset-bottom,0px)+3rem)] overflow-y-auto custom-scrollbar">
      <div className="w-full max-w-lg flex flex-col items-center my-auto">
        {children}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs font-mono text-neutral-400">
          <span>Powered by</span>
          <span className="font-bold text-neutral-600">ClientEcho</span>
          <span>&bull;</span>
          <span>Secure Social Proof</span>
        </div>
      </div>
    </div>
  );

  const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div
      className={`w-full bg-white rounded-[24px] sm:rounded-[28px] shadow-[0_10px_35px_-5px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] border border-black/[0.06] overflow-hidden animate-fade-in-up transition-all ${className}`}
    >
      {children}
    </div>
  );

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Shell>
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-black/5 pb-6">
            <SkeletonBlock className="w-10 h-10 rounded-2xl" />
            <div className="space-y-2 flex-1">
              <SkeletonBlock className="w-40 h-5 rounded-lg" />
              <SkeletonBlock className="w-24 h-3 rounded-lg" />
            </div>
          </div>
          <SkeletonBlock className="w-full h-24 rounded-2xl" />
          <SkeletonBlock className="w-32 h-10 rounded-xl mx-auto" />
          <SkeletonBlock className="w-full h-12 rounded-2xl" />
        </Card>
      </Shell>
    );
  }

  // ─── Already approved ────────────────────────────────────────────────────
  if (!validState.valid && validState.reason === "already_approved") {
    return (
      <Shell>
        <Card className="p-8 sm:p-10 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold text-neutral-900">Already Confirmed!</h1>
            <p className="text-neutral-500 text-sm leading-relaxed">
              This testimonial has already been verified and published. No further action needed.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-sm rounded-2xl transition shadow-sm"
          >
            Visit ClientEcho Home
          </Link>
        </Card>
      </Shell>
    );
  }

  // ─── Expired ─────────────────────────────────────────────────────────────
  if (!validState.valid && validState.reason === "expired") {
    return (
      <Shell>
        <Card className="p-8 sm:p-10 text-center space-y-6">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold text-neutral-900">Link Expired</h1>
            <p className="text-neutral-500 text-sm leading-relaxed">
              This magic approval link has expired for security reasons. Please contact your service provider for a fresh link.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-sm rounded-2xl transition border border-neutral-200"
          >
            Return to ClientEcho
          </Link>
        </Card>
      </Shell>
    );
  }

  // ─── Invalid / Error ─────────────────────────────────────────────────────
  if (!validState.valid) {
    const isNetworkError = validState.reason === "network_error" || validState.reason === "error";

    return (
      <Shell>
        <Card className="p-8 sm:p-10 text-center space-y-6">
          <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
            <AlertCircle className="w-8 h-8 text-rose-600" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold text-neutral-900">
              {isNetworkError ? "Connection Error" : "Invalid Link"}
            </h1>
            <p className="text-neutral-500 text-sm leading-relaxed">
              {isNetworkError
                ? "We couldn't connect to verify this magic link. Please check your internet connection and try again."
                : "We couldn't verify this magic link. Please check the URL from your invitation email or request a new invite from your creator."}
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            {isNetworkError && (
              <button
                type="button"
                onClick={verifyToken}
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-sm rounded-2xl transition shadow-sm cursor-pointer"
              >
                Try Again
              </button>
            )}
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-sm rounded-2xl transition border border-neutral-200"
            >
              Return to ClientEcho
            </Link>
          </div>
        </Card>
      </Shell>
    );
  }

  // ─── Success ─────────────────────────────────────────────────────────────
  if (success) {
    return (
      <Shell>
        <Card className="p-8 sm:p-10 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-md">
            <CheckCircle className="w-9 h-9 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-neutral-900">Testimonial Published!</h1>
            <p className="text-neutral-500 text-sm leading-relaxed">
              Thank you, <strong className="text-neutral-900">{authorName}</strong>! Your endorsement is now live on the creator's portfolio.
            </p>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 py-2.5 px-4 rounded-xl font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cryptographically Verified & Published</span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-sm rounded-2xl transition border border-neutral-200"
          >
            Learn More About ClientEcho
          </Link>
        </Card>
      </Shell>
    );
  }

  // ─── Main form ───────────────────────────────────────────────────────────
  return (
    <Shell>
      <Card>
        {/* ── Card Header ── */}
        <div className="px-6 sm:px-8 pt-7 pb-5 text-center border-b border-black/[0.05] bg-gradient-to-b from-neutral-50/50 to-white space-y-3">
          {/* Logo — centered */}
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-black/[0.07] mb-2.5 transition-transform hover:scale-105">
            <Image
              src="/ClientEcho_logo.png"
              alt="ClientEcho"
              width={32}
              height={32}
              className="w-7 h-7 object-contain"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100/90 border border-neutral-200/80 text-[10px] font-mono uppercase tracking-wider text-neutral-600 font-bold">
            <Lock className="w-2.5 h-2.5 text-neutral-500" />
            <span>Secure 1-Click Verification</span>
          </div>

          <h1 className="font-display text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight leading-snug">
            Confirm Your Testimonial
          </h1>
          <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto">
            Review the draft below. Adjust the rating, tweak the wording, or approve it instantly with 1 click.
          </p>
        </div>

        {/* ── Form container with smooth flow ── */}
        <form onSubmit={handleSubmitApproval} className="flex flex-col">
          <div className="p-6 sm:p-8 space-y-5">
            {/* ── Personal Note from Creator ── */}
            {validState.testimonial?.promptMessage && (
              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/60 space-y-1.5 text-left">
                <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-amber-800">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Personal Note from Creator</span>
                </div>
                <p className="text-sm text-neutral-700 leading-relaxed italic">
                  "{validState.testimonial.promptMessage}"
                </p>
              </div>
            )}

            {/* ── Star Rating ── */}
            <div className="text-center space-y-2.5 bg-neutral-50/80 rounded-2xl border border-neutral-200/70 px-5 py-4">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400">
                Your Rating — Click a Star to Change
              </div>
              <StarRating
                rating={rating}
                hoverRating={hoverRating}
                onRate={setRating}
                onHover={setHoverRating}
                onLeave={() => setHoverRating(null)}
              />
              <div className="text-xs font-semibold text-neutral-700">
                {RATING_LABELS[hoverRating !== null ? hoverRating : rating]}
              </div>
            </div>

            {/* ── Testimonial Preview / Edit ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400">
                  {isEditing ? "Edit Your Review" : "Testimonial Preview"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-xl border border-neutral-200/80 transition cursor-pointer active:scale-95"
                >
                  {isEditing ? (
                    <><Eye className="w-3.5 h-3.5" /> View Preview</>
                  ) : (
                    <><Edit3 className="w-3.5 h-3.5" /> Edit / Tweak</>
                  )}
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-3.5 p-5 bg-neutral-50/80 rounded-2xl border border-neutral-200/80 text-left">
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider font-mono">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="e.g. John Smith"
                      className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm font-medium focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/5 bg-white transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider font-mono">
                      Title / Company <span className="text-neutral-400 font-normal normal-case">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={authorTitle}
                      placeholder="e.g. Founder at Acme Corp"
                      onChange={(e) => setAuthorTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm font-medium focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/5 bg-white transition"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider font-mono">
                        Testimonial Copy
                      </label>
                      <span className="text-[10px] font-mono text-neutral-400">{content.length} / 2000</span>
                    </div>
                    <textarea
                      rows={4}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write or adjust your testimonial quote..."
                      className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/5 bg-white transition leading-relaxed custom-scrollbar"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-neutral-50/80 rounded-2xl border border-neutral-200/80 p-5 sm:p-6 text-center space-y-3">
                  <p className="text-sm sm:text-base text-neutral-800 italic leading-relaxed font-sans">
                    "{content}"
                  </p>
                  <div className="pt-3 border-t border-neutral-200/70 text-sm font-bold text-neutral-900">
                    — {authorName || "Your Name"}
                    {authorTitle && (
                      <span className="font-normal text-neutral-500 ml-1">({authorTitle})</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Error Banner ── */}
            {submitError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 text-left">
                <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* ── Submit Action & Trust Signals ── */}
            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 px-6 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-2xl text-sm sm:text-base shadow-lg shadow-neutral-900/10 transition-all active:scale-[0.99] flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing Testimonial...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isEditing ? "Confirm & Publish My Edits" : "Approve & Publish Testimonial"}</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-neutral-400">
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" />
                <span>No password required · Powered by ClientEcho</span>
              </div>
            </div>
          </div>
        </form>
      </Card>
    </Shell>
  );
}

export default function ApproveTestimonialPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        </div>
      }
    >
      <ApproveTestimonialContent />
    </Suspense>
  );
}
