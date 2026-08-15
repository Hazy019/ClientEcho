"use client";

import React, { useState } from "react";
import { HelpCircle, X, Search, Send, MessageSquare, BookOpen, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How do 1-Click Magic Links work for client approval?",
    answer: "Magic links generate a single-use 32-byte cryptographic SHA-256 token. When your client opens the link, they can review or edit their draft testimonial and approve it with one click — no account creation or login required.",
  },
  {
    question: "How do I embed a widget on my website?",
    answer: "Go to the Widgets tab, select your widget, copy the HTML iframe script payload, and paste it into your website builder (Webflow, Framer, WordPress, HTML).",
  },
  {
    question: "Are public form submissions protected against spam?",
    answer: "Yes! All public form submissions are sanitized with DOMPurify, validated via Zod, rate-limited via Upstash, and protected with Cloudflare Turnstile CAPTCHA.",
  },
  {
    question: "What is included in the Pro plan vs Starter Free?",
    answer: "Starter Free allows 1 active widget and 25 approved testimonials with ClientEcho branding. Pro unlocks unlimited widgets, custom Google Fonts, accent colors, carousel layouts, and removes footer branding.",
  },
];

export default function HelpSupportButton() {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"faq" | "contact">("faq");
  const [searchQuery, setSearchQuery] = useState("");

  // Contact form state
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmitSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Support message sent successfully! We'll reply shortly.", "success");
        setSubject("");
        setMessage("");
        setIsOpen(false);
      } else {
        showToast(data.error || "Failed to send support message.", "error");
      }
    } catch {
      showToast("Network error while sending support request.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-ink-900 hover:bg-ink-800 text-surface-white p-3.5 rounded-full shadow-2xl border border-surface-white/20 transition-transform active:scale-95 flex items-center gap-2 group"
        aria-label="Help and Support"
      >
        <HelpCircle className="w-5 h-5 text-surface-white" />
        <span className="text-xs font-display font-semibold pr-1 hidden sm:inline">
          Help & Support
        </span>
      </button>

      {/* Support Popover Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 max-w-md w-[92vw] sm:w-[420px] bg-ink-900 text-surface-white rounded-3xl border border-surface-white/15 shadow-2xl overflow-hidden font-sans animate-fade-in-up">
          {/* Header */}
          <div className="p-5 border-b border-surface-white/10 flex items-center justify-between bg-ink-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-surface-white text-ink-900 rounded-xl flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-surface-white">
                  ClientEcho Support
                </h3>
                <p className="text-[11px] text-surface-white/60">
                  Search FAQs or contact our support team
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-surface-white/60 hover:text-surface-white transition rounded-lg"
              aria-label="Close help popup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-2 text-xs font-medium border-b border-surface-white/10 bg-ink-900">
            <button
              onClick={() => setActiveTab("faq")}
              className={`py-3 flex items-center justify-center gap-1.5 transition ${
                activeTab === "faq"
                  ? "border-b-2 border-surface-white text-surface-white font-semibold bg-surface-white/5"
                  : "text-surface-white/60 hover:text-surface-white"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Help & FAQ</span>
            </button>
            <button
              onClick={() => setActiveTab("contact")}
              className={`py-3 flex items-center justify-center gap-1.5 transition ${
                activeTab === "contact"
                  ? "border-b-2 border-surface-white text-surface-white font-semibold bg-surface-white/5"
                  : "text-surface-white/60 hover:text-surface-white"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Contact Support</span>
            </button>
          </div>

          {/* Tab 1: FAQs */}
          {activeTab === "faq" && (
            <div className="p-5 space-y-4 max-h-[380px] overflow-y-auto custom-scrollbar">
              <div className="relative">
                <Search className="w-4 h-4 text-surface-white/40 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search FAQ topics..."
                  className="w-full pl-9 pr-3.5 py-2 bg-ink-800 border border-surface-white/15 rounded-xl text-xs text-surface-white placeholder:text-surface-white/40 focus:outline-none focus:border-surface-white"
                />
              </div>

              <div className="space-y-3 pt-1">
                {filteredFaqs.length === 0 ? (
                  <p className="text-xs text-surface-white/50 italic py-4 text-center">
                    No matching FAQ answers found. Switch to Contact Support tab to send us a message!
                  </p>
                ) : (
                  filteredFaqs.map((faq, index) => (
                    <div
                      key={index}
                      className="p-3.5 bg-ink-800/80 rounded-2xl border border-surface-white/10 space-y-1.5"
                    >
                      <h4 className="font-display font-semibold text-xs text-surface-white">
                        {faq.question}
                      </h4>
                      <p className="text-[11px] text-surface-white/70 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Contact Form */}
          {activeTab === "contact" && (
            <form onSubmit={handleSubmitSupport} className="p-5 space-y-4 max-h-[380px] overflow-y-auto">
              <div>
                <label className="block text-[11px] font-mono uppercase text-surface-white/60 mb-1">
                  Subject / Topic
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Widget customization question"
                  required
                  className="w-full px-3.5 py-2.5 bg-ink-800 border border-surface-white/15 rounded-xl text-xs text-surface-white placeholder:text-surface-white/40 focus:outline-none focus:border-surface-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-surface-white/60 mb-1">
                  Message Details
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or question in detail..."
                  required
                  className="w-full px-3.5 py-2.5 bg-ink-800 border border-surface-white/15 rounded-xl text-xs text-surface-white placeholder:text-surface-white/40 focus:outline-none focus:border-surface-white"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-surface-white hover:bg-surface-light text-ink-900 font-display font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{submitting ? "Sending..." : "Send Support Request"}</span>
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
