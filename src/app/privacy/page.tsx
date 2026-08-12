import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Lock } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-ink-900 text-surface-white font-sans p-6 md:p-12 selection:bg-surface-white selection:text-ink-900">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-mono text-surface-white/60 hover:text-surface-white transition">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to ClientEcho</span>
        </Link>

        <div className="flex items-center gap-4 pb-6 border-b border-surface-white/10">
          <div className="w-10 h-10 bg-surface-white rounded-xl flex items-center justify-center p-1.5">
            <Image src="/ClientEcho_logo.png" alt="ClientEcho Logo" width={32} height={32} className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Privacy Policy</h1>
            <p className="text-xs font-mono text-surface-white/60">Last updated: August 2026</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-surface-white/80 leading-relaxed">
          <p>
            ClientEcho respects your privacy. This policy details how we collect, process, and protect your data when you use our testimonial collection platform.
          </p>

          <h2 className="font-display text-lg font-bold text-surface-white pt-2">1. Data Collection & Isolation</h2>
          <p>
            We collect creator email addresses, names, and testimonial payloads submitted via magic links or public forms. All tenant data is strictly isolated using PostgreSQL Row-Level Security (RLS).
          </p>

          <h2 className="font-display text-lg font-bold text-surface-white pt-2">2. Reviewer Confidentiality</h2>
          <p>
            Reviewers approving testimonials via magic links submit data with single-use cryptographic tokens. Reviewer emails are stored securely and never sold or used for marketing.
          </p>

          <h2 className="font-display text-lg font-bold text-surface-white pt-2">3. Security Controls</h2>
          <p>
            All inputs pass through HTML sanitization and rate limiting. Payments are handled securely via PCI-compliant Stripe integrations.
          </p>
        </div>
      </div>
    </div>
  );
}
