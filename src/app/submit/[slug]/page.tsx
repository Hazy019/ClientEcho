"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Star, CheckCircle, AlertCircle, Video, ShieldCheck, Loader2, Send, Home, Sparkles } from "lucide-react";

function SubmitTestimonialContent() {
  const params = useParams();
  const slug = (params?.slug as string) || "";

  const [loading, setLoading] = useState(true);
  const [widgetInfo, setWidgetInfo] = useState<{
    found: boolean;
    name?: string;
    creatorName?: string;
  }>({ found: false });

  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [authorTitle, setAuthorTitle] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [videoUrl, setVideoUrl] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("bypass_token_dev");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    async function checkWidget() {
      try {
        const res = await fetch(`/api/widgets/check-slug?slug=${encodeURIComponent(slug)}`);
        const data = await res.json();
        // If slug is taken (meaning it exists), it is a valid target widget!
        if (data.available === false || data.isOwner === true) {
          setWidgetInfo({
            found: true,
            name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          });
        } else {
          setWidgetInfo({ found: false });
        }
      } catch {
        setWidgetInfo({ found: false });
      } finally {
        setLoading(false);
      }
    }

    checkWidget();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (content.trim().length < 10) {
      setErrorMessage("Please share a testimonial with at least 10 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/testimonials/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widgetSlug: slug,
          authorName: authorName.trim(),
          authorEmail: authorEmail.trim() || undefined,
          authorTitle: authorTitle.trim() || undefined,
          content: content.trim(),
          rating,
          videoUrl: videoUrl.trim() || undefined,
          turnstileToken,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        setErrorMessage(data.error || "Failed to submit testimonial. Please try again.");
      }
    } catch {
      setErrorMessage("Network error connecting to the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-light flex items-center justify-center p-6 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-ink-900" />
      </div>
    );
  }

  if (!widgetInfo.found && !loading) {
    return (
      <div className="min-h-screen bg-surface-light flex items-center justify-center p-6 font-sans">
        <div className="bg-surface-white max-w-md w-full p-8 rounded-3xl shadow-xl border border-ink-900/10 text-center space-y-5 animate-fade-in-up">
          <div className="w-14 h-14 bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-900">
            Form Not Found
          </h1>
          <p className="text-ink-800/70 text-sm leading-relaxed">
            The testimonial submission form for <span className="font-mono font-semibold">"{slug}"</span> doesn't exist or is currently inactive.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-ink-900 hover:bg-ink-800 text-surface-white font-medium text-xs rounded-xl transition shadow-xs"
            >
              <Home className="w-4 h-4" />
              <span>Return to ClientEcho Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface-light flex items-center justify-center p-6 font-sans">
        <div className="bg-surface-white max-w-md w-full p-8 rounded-3xl shadow-xl border border-ink-900/10 text-center space-y-5 animate-fade-in-up">
          <div className="w-14 h-14 bg-ink-900 text-surface-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
            <CheckCircle className="w-7 h-7" />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-900">
            Testimonial Received!
          </h1>
          <p className="text-ink-800/70 text-sm leading-relaxed">
            Thank you, <strong>{authorName}</strong>! Your review has been submitted to the creator for moderation and will appear in their live social proof widget once approved.
          </p>
          <div className="pt-2 flex items-center justify-center gap-1.5 text-xs font-mono text-ink-900 font-semibold">
            <ShieldCheck className="w-4 h-4 text-ink-900" />
            <span>Secure Social Proof Powered by ClientEcho</span>
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
    <div className="min-h-screen bg-surface-light py-12 px-4 sm:px-6 font-sans">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-white border border-ink-900/10 text-xs font-mono font-semibold text-ink-900 shadow-xs mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Client Testimonial Intake</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-ink-900 tracking-tight">
            Share Your Experience
          </h1>
          <p className="text-ink-800/70 text-sm max-w-md mx-auto leading-relaxed">
            Your feedback helps build trusted social proof. Please share a brief review below.
          </p>
        </div>

        {/* Submission Form Card */}
        <div className="bg-surface-white p-6 sm:p-8 rounded-3xl border border-ink-900/10 shadow-xl space-y-6 animate-fade-in-up">
          {errorMessage && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Rating Stars */}
            <div className="space-y-1.5 text-center">
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70">
                Your Rating
              </label>
              <div className="flex items-center justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 focus:outline-none transition transform hover:scale-110"
                    aria-label={`${star} star rating`}
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating
                          ? "fill-ink-900 text-ink-900"
                          : "text-ink-900/20"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Author Name */}
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 mb-1">
                Your Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full px-4 py-3 bg-surface-light border border-ink-900/10 rounded-2xl text-sm focus:outline-none focus:border-ink-900 focus:bg-surface-white transition"
              />
            </div>

            {/* Author Email & Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 mb-1">
                  Email (Private)
                </label>
                <input
                  type="email"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full px-4 py-3 bg-surface-light border border-ink-900/10 rounded-2xl text-sm focus:outline-none focus:border-ink-900 focus:bg-surface-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 mb-1">
                  Role / Company (Optional)
                </label>
                <input
                  type="text"
                  value={authorTitle}
                  onChange={(e) => setAuthorTitle(e.target.value)}
                  placeholder="e.g. Head of Product"
                  className="w-full px-4 py-3 bg-surface-light border border-ink-900/10 rounded-2xl text-sm focus:outline-none focus:border-ink-900 focus:bg-surface-white transition"
                />
              </div>
            </div>

            {/* Testimonial Content */}
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 mb-1">
                Your Testimonial <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What was it like working together? What results did you achieve?"
                className="w-full px-4 py-3 bg-surface-light border border-ink-900/10 rounded-2xl text-sm focus:outline-none focus:border-ink-900 focus:bg-surface-white transition leading-relaxed"
              />
            </div>

            {/* Optional Video Link */}
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 mb-1 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-ink-800/60" />
                <span>Video Testimonial Link (Optional)</span>
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... or https://loom.com/share/..."
                className="w-full px-4 py-3 bg-surface-light border border-ink-900/10 rounded-2xl text-sm focus:outline-none focus:border-ink-900 focus:bg-surface-white transition"
              />
              <p className="text-[11px] text-ink-800/50 mt-1">
                Supports YouTube, Vimeo, and Loom video links.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-ink-900 hover:bg-ink-800 text-surface-white font-display font-semibold rounded-2xl text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Testimonial...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Testimonial</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Seal */}
        <div className="text-center text-xs font-mono text-ink-800/50 flex items-center justify-center gap-1.5 pt-2">
          <ShieldCheck className="w-4 h-4 text-ink-900" />
          <span>ClientEcho 1-Click Verification & Trust Engine</span>
        </div>
      </div>
    </div>
  );
}

export default function SubmitTestimonialPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-light flex items-center justify-center p-6 text-ink-900 font-sans">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      }
    >
      <SubmitTestimonialContent />
    </Suspense>
  );
}
