import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "ClientEcho terms of service, acceptable use policies, and verification badge integrity guidelines.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-ink-900 text-surface-white font-sans p-6 md:p-12 selection:bg-surface-white selection:text-ink-900">
      <main className="max-w-3xl mx-auto space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-mono text-surface-white/60 hover:text-surface-white transition">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to ClientEcho</span>
        </Link>

        <header className="flex items-center gap-4 pb-6 border-b border-surface-white/10">
          <div className="w-10 h-10 bg-surface-white rounded-xl flex items-center justify-center p-1.5">
            <Image src="/ClientEcho_logo.png" alt="ClientEcho Logo" width={32} height={32} className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Terms of Service</h1>
            <p className="text-xs font-mono text-surface-white/60">Last updated: August 2026</p>
          </div>
        </header>

        <article className="space-y-6 text-sm text-surface-white/80 leading-relaxed">
          <p>
            Welcome to ClientEcho. By accessing or using our website, services, or testimonial ingestion widgets, you agree to be bound by these Terms of Service.
          </p>

          <h2 className="font-display text-lg font-bold text-surface-white pt-2">1. Account Responsibility</h2>
          <p>
            You are responsible for maintaining the security of your account credentials and for all activities conducted under your workspace. Creators must ensure they have lawful permission to publish client testimonials.
          </p>

          <h2 className="font-display text-lg font-bold text-surface-white pt-2">2. Verification & Trust Badges</h2>
          <p>
            ClientEcho provides cryptographic magic-link verification and source-tagging. Attempting to tamper with verification hashes or falsify verification badges is strictly prohibited.
          </p>

          <h2 className="font-display text-lg font-bold text-surface-white pt-2">3. Subscription & Billing</h2>
          <p>
            Subscriptions are billed monthly or annually via Stripe. You may cancel your subscription at any time within your dashboard settings.
          </p>
        </article>
      </main>
    </div>
  );
}
