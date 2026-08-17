"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, AlertCircle, Clock, Star, Loader2, Edit2, ShieldCheck, AlertTriangle } from "lucide-react";
import { SkeletonBlock } from "@/components/ui/SkeletonBlock";

export const dynamic = "force-dynamic";

function ApproveTestimonialContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [validState, setValidState] = useState<{
    valid: boolean;
    reason?: string;
    testimonial?: any;
  }>({ valid: false });

  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [authorName, setAuthorName] = useState("");
  const [authorTitle, setAuthorTitle] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setValidState({ valid: false, reason: "missing_token" });
      return;
    }

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
      .catch(() => {
        setValidState({ valid: false, reason: "error" });
      })
      .finally(() => setLoading(false));
  }, [token]);

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmitApproval = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/testimonials/approve-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          authorName,
          authorTitle,
          content,
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
      setSubmitError("Network error connecting to the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-light flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-xl w-full bg-surface-white p-8 rounded-3xl border border-ink-900/10 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-ink-900/10 pb-6">
            <SkeletonBlock className="w-10 h-10 rounded-xl" />
            <div className="space-y-2 flex-1">
              <SkeletonBlock className="w-48 h-5 rounded-md" />
              <SkeletonBlock className="w-32 h-3 rounded-md" />
            </div>
          </div>
          <div className="space-y-3">
            <SkeletonBlock className="w-24 h-4 rounded-md" />
            <SkeletonBlock className="w-full h-24 rounded-2xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SkeletonBlock className="w-full h-10 rounded-xl" />
            <SkeletonBlock className="w-full h-10 rounded-xl" />
          </div>
          <SkeletonBlock className="w-full h-12 rounded-2xl" />
        </div>
      </div>
    );
  }

  // State: Token already used
  if (!validState.valid && validState.reason === "already_approved") {
    return (
      <div className="min-h-screen bg-surface-light flex items-center justify-center p-6 font-sans">
        <div className="bg-surface-white max-w-md w-full p-8 rounded-3xl shadow-xl border border-ink-900/10 text-center space-y-5 animate-fade-in-up">
          <div className="w-14 h-14 bg-ink-900 text-surface-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
            <CheckCircle className="w-7 h-7" />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Already Confirmed!</h1>
          <p className="text-ink-800/70 text-sm leading-relaxed">
            Thank you! This testimonial draft has already been verified and published. No further action is needed.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-ink-900 hover:bg-ink-800 text-surface-white font-medium text-xs rounded-xl transition shadow-xs"
            >
              <span>Visit ClientEcho Home</span>
            </Link>
          </div>
          <div className="text-[11px] font-mono text-ink-800/40 uppercase tracking-widest">
            ClientEcho Verification Seal
          </div>
        </div>
      </div>
    );
  }

  // State: Token expired
  if (!validState.valid && validState.reason === "expired") {
    return (
      <div className="min-h-screen bg-surface-light flex items-center justify-center p-6 font-sans">
        <div className="bg-surface-white max-w-md w-full p-8 rounded-3xl shadow-xl border border-ink-900/10 text-center space-y-5 animate-fade-in-up">
          <div className="w-14 h-14 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <Clock className="w-7 h-7" />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Link Expired</h1>
          <p className="text-ink-800/70 text-sm leading-relaxed">
            This magic approval link has expired for security reasons. Please contact your service provider to request a fresh verification link.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-surface-light hover:bg-ink-900/5 text-ink-900 border border-ink-900/10 font-medium text-xs rounded-xl transition"
            >
              <span>Return to ClientEcho Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // State: Invalid token
  if (!validState.valid) {
    return (
      <div className="min-h-screen bg-surface-light flex items-center justify-center p-6 font-sans">
        <div className="bg-surface-white max-w-md w-full p-8 rounded-3xl shadow-xl border border-ink-900/10 text-center space-y-5 animate-fade-in-up">
          <div className="w-14 h-14 bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Invalid Link</h1>
          <p className="text-ink-800/70 text-sm leading-relaxed">
            We couldn't verify this magic link token. Please check the link URL from your invitation email or ask the creator for a new invite.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-surface-light hover:bg-ink-900/5 text-ink-900 border border-ink-900/10 font-medium text-xs rounded-xl transition"
            >
              <span>Return to ClientEcho Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // State: Post-Submit Success State
  if (success) {
    return (
      <div className="min-h-screen bg-surface-light flex items-center justify-center p-6 font-sans">
        <div className="bg-surface-white max-w-md w-full p-8 rounded-3xl shadow-xl border border-ink-900/10 text-center space-y-5 animate-fade-in-up">
          <div className="w-14 h-14 bg-ink-900 text-surface-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
            <CheckCircle className="w-7 h-7" />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Testimonial Published!</h1>
          <p className="text-ink-800/70 text-sm leading-relaxed">
            Thank you! Your testimonial has been verified with 1-click and published to the live widget.
          </p>
          <div className="pt-2 flex items-center justify-center gap-1.5 text-xs font-mono text-ink-900 font-semibold">
            <ShieldCheck className="w-4 h-4 text-ink-900" />
            <span>Verified & Approved</span>
          </div>
          <div className="pt-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-surface-light hover:bg-ink-900/5 text-ink-900 border border-ink-900/10 font-medium text-xs rounded-xl transition"
            >
              <span>Learn More About ClientEcho</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-light flex items-center justify-center p-6 font-sans">
      <div className="bg-surface-white max-w-lg w-full p-8 rounded-3xl shadow-xl border border-ink-900/10 space-y-6 animate-fade-in-up">
        {/* Creator Context Header */}
        <div className="text-center space-y-2 border-b border-ink-900/10 pb-6">
          <div className="w-10 h-10 bg-ink-900 text-surface-white rounded-xl flex items-center justify-center mx-auto p-1.5 mb-2">
            <Image
              src="/ClientEcho_logo.png"
              alt="ClientEcho Logo"
              width={28}
              height={28}
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-900">
            Confirm Your Testimonial
          </h1>
          <p className="text-ink-800/70 text-xs leading-relaxed max-w-sm mx-auto">
            Please review the draft testimonial below and confirm with 1-click.
          </p>
        </div>

        {/* Testimonial Review Form */}
        <form onSubmit={handleSubmitApproval} className="space-y-6">
          {/* Rating */}
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                disabled={!isEditing}
                onClick={() => setRating(star)}
                className="p-1 focus:outline-none disabled:cursor-default"
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= rating ? "fill-ink-900 text-ink-900" : "text-ink-900/20"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Testimonial Quote Box */}
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-ink-900/20 rounded-xl text-sm focus:outline-none focus:border-ink-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 mb-1">
                  Title / Company (Optional)
                </label>
                <input
                  type="text"
                  value={authorTitle}
                  placeholder="e.g. Founder at Acme Inc"
                  onChange={(e) => setAuthorTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-ink-900/20 rounded-xl text-sm focus:outline-none focus:border-ink-900"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 mb-1">
                  Testimonial Copy
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-ink-900/20 rounded-xl text-sm focus:outline-none focus:border-ink-900"
                  required
                />
              </div>
            </div>
          ) : (
            <div className="bg-surface-light p-6 rounded-2xl border border-ink-900/10 space-y-3 text-center">
              <p className="text-sm text-ink-900 italic leading-relaxed">
                "{content}"
              </p>
              <div className="text-xs font-display font-bold text-ink-900 pt-1">
                — {authorName} {authorTitle && <span className="font-normal text-ink-800/60">({authorTitle})</span>}
              </div>
            </div>
          )}

          {submitError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-700 flex items-center gap-2 text-left">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Primary Action Button (1-Click Approve) */}
          <div className="space-y-3 pt-2 text-center">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-ink-900 hover:bg-ink-800 text-surface-white font-display font-semibold rounded-2xl text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Testimonial...</span>
                </>
              ) : (
                <span>Approve & Publish Testimonial</span>
              )}
            </button>

            {/* Smaller "Suggest an edit" Link */}
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5 text-xs text-ink-800/70 hover:text-ink-900 font-medium transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditing ? "Done tweaking draft" : "Suggest an edit to this draft"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ApproveTestimonialPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-light flex items-center justify-center p-6 text-ink-900 font-sans">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      }
    >
      <ApproveTestimonialContent />
    </Suspense>
  );
}
