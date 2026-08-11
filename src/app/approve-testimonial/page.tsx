"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, AlertCircle, Clock, Star, Loader2 } from "lucide-react";

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

  const handleSubmitApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
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
        alert(data.error || "Failed to submit approval.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-indigo-600 font-medium">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Verifying magic link token...</span>
        </div>
      </div>
    );
  }

  if (!validState.valid && validState.reason === "already_approved") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Already Approved!</h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            Thank you! This testimonial draft has already been verified and published. No further action is needed.
          </p>
        </div>
      </div>
    );
  }

  if (!validState.valid && validState.reason === "expired") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Link Expired</h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            This magic link has expired for security reasons. Please ask the creator to send a new testimonial request.
          </p>
        </div>
      </div>
    );
  }

  if (!validState.valid) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Link</h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            We couldn't verify this magic link token. Please check the URL in your email or contact support.
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Testimonial Published!</h1>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            Your review has been successfully approved and published. Thank you for your feedback!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Review & Approve Testimonial</h1>
          <p className="text-slate-500 text-sm mt-1">
            Please verify or refine your testimonial below.
          </p>
        </div>

        <form onSubmit={handleSubmitApproval} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Title / Company (Optional)
            </label>
            <input
              type="text"
              value={authorTitle}
              placeholder="e.g. Founder at Acme Inc"
              onChange={(e) => setAuthorTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Rating
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 focus:outline-none"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Testimonial Content
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <span>Approve & Publish Testimonial</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ApproveTestimonialPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="flex items-center gap-3 text-indigo-600 font-medium">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading page...</span>
          </div>
        </div>
      }
    >
      <ApproveTestimonialContent />
    </Suspense>
  );
}
