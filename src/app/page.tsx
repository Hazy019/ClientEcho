import Link from "next/link";
import Image from "next/image";
import { Send, ShieldCheck, Zap, Lock, ArrowRight, CheckCircle2, HelpCircle, Check, Sparkles, CreditCard } from "lucide-react";
import { FadeInUp, ScrollReveal } from "@/components/motion/MotionWrapper";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-white text-ink-900 font-sans selection:bg-ink-900 selection:text-surface-white">
      {/* 1. Navbar: --ink-900 fill, distinct logo mark + text wordmark left, nav center, CTA right */}
      <nav className="bg-ink-900 text-surface-white sticky top-0 z-50 border-b border-ink-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-surface-white rounded-lg flex items-center justify-center p-1">
              <Image
                src="/ClientEcho_logo.png"
                alt="ClientEcho Logomark"
                width={24}
                height={24}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-surface-white">
              ClientEcho
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-xs font-medium text-surface-white/70">
            <a href="#features" className="hover:text-surface-white transition">
              Features
            </a>
            <a href="#pricing" className="hover:text-surface-white transition">
              Pricing
            </a>
            <a href="#trust" className="hover:text-surface-white transition">
              Security & RLS
            </a>
            <a href="#help" className="hover:text-surface-white transition">
              Help & FAQ
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs font-medium text-surface-white/80 hover:text-surface-white transition"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2 bg-surface-white text-ink-900 font-medium text-xs rounded-full hover:bg-surface-light transition shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section: --ink-800 fill, badge + Syne headline + Manrope subhead + CTAs */}
      <section className="bg-ink-800 text-surface-white py-20 px-6 border-b border-ink-900">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <FadeInUp delay={0.0}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono tracking-wider uppercase bg-surface-white/10 text-surface-white border border-surface-white/20 backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-surface-white" />
              <span>Zero-Friction Client Testimonials</span>
            </div>
          </FadeInUp>

          <FadeInUp delay={0.08}>
            <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight leading-tight text-surface-white">
              Gather & Embed Social Proof <br />
              <span className="text-surface-white/70 italic font-normal">
                Without the Client Friction
              </span>
            </h1>
          </FadeInUp>

          <FadeInUp delay={0.16}>
            <p className="text-surface-white/80 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              ClientEcho enables solo creators, developers, and agencies to collect 1-click magic link approvals, import offline praise with hardcoded trust signals, and embed sandboxed widgets in minutes.
            </p>
          </FadeInUp>

          <FadeInUp delay={0.24}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 bg-surface-white text-ink-900 font-display font-semibold rounded-2xl shadow-lg hover:bg-surface-light transition flex items-center justify-center gap-2 group"
              >
                <span>Start Free Workspace</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 bg-transparent text-surface-white font-medium rounded-2xl border border-surface-white/20 hover:bg-surface-white/10 transition flex items-center justify-center gap-2"
              >
                <span>Open Dashboard</span>
              </Link>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* 3. Subordinated Device Stage: max-width 520px centered, no hover scale */}
      <section className="bg-surface-light py-16 px-6 border-b border-ink-900/10">
        <ScrollReveal delay={0.1} className="max-w-5xl mx-auto text-center space-y-4">
          <div className="relative inline-block w-full max-w-[520px] mx-auto rounded-2xl overflow-hidden shadow-xl border border-ink-900/10 bg-surface-white p-2">
            <Image
              src="/Tablet_mockup.png"
              alt="ClientEcho Creator Dashboard on Tablet"
              width={1000}
              height={667}
              className="w-full h-auto rounded-xl object-contain"
              priority
            />
          </div>
          <p className="text-[11px] font-mono text-ink-800/60 uppercase tracking-widest pt-2">
            Multi-Tenant Creator & Agency Workspace
          </p>
        </ScrollReveal>
      </section>

      {/* 4. Feature Card Row: 3 Cards */}
      <section id="features" className="bg-surface-white py-24 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <ScrollReveal className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="font-display text-3xl font-bold text-ink-900">
              Engineered for Modern Trust & Conversion
            </h2>
            <p className="text-ink-800/70 text-sm leading-relaxed">
              Every surface is designed to maximize completion rates and maintain complete database isolation.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ScrollReveal delay={0.08} className="h-full">
              <div className="bg-surface-light p-8 rounded-3xl border border-ink-900/10 space-y-4 h-full">
                <div className="w-12 h-12 bg-ink-900 text-surface-white rounded-2xl flex items-center justify-center">
                  <Send className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-ink-900">
                  1-Click Magic Link Approval
                </h3>
                <p className="text-sm text-ink-800/80 leading-relaxed">
                  Draft testimonials for busy clients. Generate 32-byte cryptographically random SHA-256 tokens for instant 1-click approvals without login prompts.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.16} className="h-full">
              <div className="bg-surface-light p-8 rounded-3xl border border-ink-900/10 space-y-4 h-full">
                <div className="w-12 h-12 bg-ink-900 text-surface-white rounded-2xl flex items-center justify-center">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-ink-900">
                  Public Form & Bot Protection
                </h3>
                <p className="text-sm text-ink-800/80 leading-relaxed">
                  Integrated Cloudflare Turnstile, strict Zod validation, DOMPurify HTML sanitization, and dual Upstash sliding-window rate limiting per IP and slug.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.24} className="h-full">
              <div className="bg-surface-light p-8 rounded-3xl border border-ink-900/10 space-y-4 h-full">
                <div className="w-12 h-12 bg-ink-900 text-surface-white rounded-2xl flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-ink-900">
                  Sandboxed Embed Widget
                </h3>
                <p className="text-sm text-ink-800/80 leading-relaxed">
                  Lightweight async iframe embed script serving edge-cached payloads with auto-resizing postMessage listener and cross-origin security.
                </p>
              </div>
            </ScrollReveal>
          </div>

          {/* 5. Trust Bar: Security Badges */}
          <div id="trust" className="pt-12 border-t border-ink-900/10 text-center space-y-6">
            <h4 className="font-display text-xs uppercase tracking-widest text-ink-800/60 font-semibold">
              Security & Compliance Differentiators
            </h4>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="px-4 py-2 rounded-full border border-ink-800 text-ink-900 text-xs font-mono font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-ink-900" />
                <span>Postgres Row-Level Security (RLS) Enforced</span>
              </div>
              <div className="px-4 py-2 rounded-full border border-ink-800 text-ink-900 text-xs font-mono font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-ink-900" />
                <span>Stripe-Secured Subscription Billing</span>
              </div>
              <div className="px-4 py-2 rounded-full border border-ink-800 text-ink-900 text-xs font-mono font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-ink-900" />
                <span>Upstash Dual Rate Limiting</span>
              </div>
              <div className="px-4 py-2 rounded-full border border-ink-800 text-ink-900 text-xs font-mono font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-ink-900" />
                <span>Immutable Admin Audit Trail</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Pricing / Subscription Section (Transparency First) */}
      <section id="pricing" className="bg-surface-light py-24 px-6 border-t border-ink-900/10">
        <div className="max-w-6xl mx-auto space-y-16">
          <ScrollReveal className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-ink-900 text-surface-white">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Transparent Pricing</span>
            </div>
            <h2 className="font-display text-3xl font-bold text-ink-900">
              Simple, Predictable Plans for Solo Creators & Agencies
            </h2>
            <p className="text-ink-800/70 text-sm leading-relaxed">
              All plans include Stripe billing, encrypted magic links, and RLS security. Cancel anytime.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Free Tier */}
            <ScrollReveal delay={0.08} className="h-full">
              <div className="bg-surface-white p-8 rounded-3xl border border-ink-900/10 shadow-sm flex flex-col justify-between h-full space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-2xl font-bold text-ink-900">Free Tier</h3>
                    <span className="px-3 py-1 bg-surface-light text-ink-900 font-mono text-xs rounded-full border border-ink-900/10 font-semibold">
                      Starter
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-4xl font-bold text-ink-900">$0</span>
                    <span className="text-xs text-ink-800/60 font-mono">/ forever</span>
                  </div>
                  <p className="text-xs text-ink-800/70 leading-relaxed">
                    Ideal for individual creators testing magic links and public submission forms.
                  </p>
                  <ul className="space-y-3 text-xs text-ink-900 pt-2">
                    <li className="flex items-center gap-2.5">
                      <div className="w-5 h-5 bg-ink-900 text-surface-white rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>1 Active Testimonial Widget</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="w-5 h-5 bg-ink-900 text-surface-white rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>Magic Link + Public Form Workflows</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="w-5 h-5 bg-ink-900 text-surface-white rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>Up to 25 Approved Testimonials</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-ink-800/60">
                      <div className="w-5 h-5 bg-surface-light border border-ink-900/20 text-ink-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 opacity-40" />
                      </div>
                      <span>"Powered by ClientEcho" Branding</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/signup"
                  className="w-full py-3.5 bg-ink-800 hover:bg-ink-900 text-surface-white font-display font-semibold rounded-xl text-xs text-center transition shadow-sm"
                >
                  Create Free Workspace
                </Link>
              </div>
            </ScrollReveal>

            {/* Pro Tier */}
            <ScrollReveal delay={0.16} className="h-full">
              <div className="bg-ink-900 text-surface-white p-8 rounded-3xl border border-ink-800 shadow-xl flex flex-col justify-between h-full space-y-6 relative overflow-hidden">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-2xl font-bold">Pro Tier</h3>
                    <span className="px-3 py-1 bg-surface-white text-ink-900 font-mono text-xs rounded-full font-bold">
                      Recommended
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-4xl font-bold">$19</span>
                    <span className="text-xs text-surface-white/60 font-mono">/ month</span>
                  </div>
                  <p className="text-xs text-surface-white/70 leading-relaxed">
                    Designed for growing agencies and high-volume product creators requiring unlimited scale.
                  </p>
                  <ul className="space-y-3 text-xs text-surface-white pt-2">
                    <li className="flex items-center gap-2.5">
                      <div className="w-5 h-5 bg-surface-white text-ink-900 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span><strong>Unlimited</strong> Active Widgets</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="w-5 h-5 bg-surface-white text-ink-900 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span><strong>Unlimited</strong> Testimonials & Moderation</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="w-5 h-5 bg-surface-white text-ink-900 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>Remove "Powered by ClientEcho" Branding</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="w-5 h-5 bg-surface-white text-ink-900 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>Custom Widget Themes & Bulk Operations</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/signup"
                  className="w-full py-3.5 bg-surface-white hover:bg-surface-light text-ink-900 font-display font-semibold rounded-xl text-xs text-center transition shadow-md"
                >
                  Upgrade to Pro Workspace
                </Link>
              </div>
            </ScrollReveal>
          </div>

          <p className="text-center text-xs font-mono text-ink-800/60">
            Billing is monthly, cancel anytime directly from your dashboard settings via PCI-compliant Stripe integration.
          </p>
        </div>
      </section>

      {/* 7. Help & FAQ Section */}
      <section id="help" className="bg-surface-white py-24 px-6 border-t border-ink-900/10">
        <div className="max-w-4xl mx-auto space-y-12">
          <ScrollReveal className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-surface-light text-ink-900 border border-ink-900/10">
              <HelpCircle className="w-3.5 h-3.5 text-ink-900" />
              <span>User-Centered Support</span>
            </div>
            <h2 className="font-display text-3xl font-bold text-ink-900">
              Frequently Asked Questions & Reviewer Guidance
            </h2>
            <p className="text-ink-800/70 text-sm leading-relaxed">
              Everything you and your clients need to know about magic links, privacy, and data ownership.
            </p>
          </ScrollReveal>

          <div className="space-y-6">
            <ScrollReveal delay={0.08}>
              <div className="bg-surface-light p-6 rounded-2xl border border-ink-900/10 space-y-2">
                <h3 className="font-display font-bold text-base text-ink-900 flex items-center gap-2">
                  <Send className="w-4 h-4 text-ink-900" />
                  <span>How do Magic Links work for client reviewers?</span>
                </h3>
                <p className="text-xs text-ink-800/80 leading-relaxed">
                  When a creator sends a Magic Link, the reviewer receives an email containing a single-use cryptographically hashed token. Clicking the link allows the reviewer to review and approve the draft testimonial with 1-click — without requiring them to create a password or log in.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.16}>
              <div className="bg-surface-light p-6 rounded-2xl border border-ink-900/10 space-y-2">
                <h3 className="font-display font-bold text-base text-ink-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-ink-900" />
                  <span>What do the three trust verification badges mean?</span>
                </h3>
                <p className="text-xs text-ink-800/80 leading-relaxed">
                  <strong>1. Verified Magic Link</strong> indicates 1-click cryptographic approval by the client.<br />
                  <strong>2. Verified Submission</strong> indicates submission via an active public form with Cloudflare Turnstile bot protection.<br />
                  <strong>3. Self-Reported / Imported</strong> indicates manual praise imported by the creator (Slack, email screenshots).
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.24}>
              <div className="bg-surface-light p-6 rounded-2xl border border-ink-900/10 space-y-2">
                <h3 className="font-display font-bold text-base text-ink-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-ink-900" />
                  <span>Who owns the data, and can testimonials be removed later?</span>
                </h3>
                <p className="text-xs text-ink-800/80 leading-relaxed">
                  Creators retain full data ownership. Testimonials can be deleted or hidden at any time from the Approval Queue. If a creator downgrades from Pro to Free, excess widgets are deactivated safely without deleting raw data.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink-900 text-surface-white py-12 px-6 border-t border-ink-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-surface-white/60">
          <div className="flex items-center gap-3">
            <Image
              src="/ClientEcho_logo.png"
              alt="ClientEcho Logo"
              width={24}
              height={24}
              className="w-6 h-6 object-contain"
            />
            <span className="font-display font-bold text-surface-white">ClientEcho</span>
            <span>&copy; {new Date().getFullYear()} ClientEcho SaaS. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-surface-white transition">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-surface-white transition">
              Privacy Policy
            </Link>
            <Link href="/login" className="hover:text-surface-white transition">
              Sign In
            </Link>
            <Link href="/signup" className="hover:text-surface-white transition">
              Create Account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
