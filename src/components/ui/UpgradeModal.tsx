"use client";

import { Crown, Check, X, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  featureName?: string;
  description?: string;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  title = "Upgrade to Pro Workspace",
  featureName = "Pro Feature Access",
  description = "Unlock unlimited widgets, custom typography, accent colors, layout variants, and bulk approvals.",
}: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop Fade */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 bg-ink-900/75 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative bg-ink-900 text-surface-white max-w-xl w-full p-6 sm:p-8 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-surface-white/10 space-y-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-surface-white text-ink-900">
                <Crown className="w-3.5 h-3.5" />
                <span>{featureName}</span>
              </div>
              <h2 className="font-display text-2xl font-bold text-surface-white pt-1">
                {title}
              </h2>
              <p className="text-xs text-surface-white/70 leading-relaxed max-w-md">
                {description}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-surface-white/50 hover:text-surface-white transition rounded-xl"
              aria-label="Close upgrade modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Plan Comparison Snippet (Visual Rhyming with Landing Page) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
            {/* Free Plan */}
            <div className="bg-ink-800 p-5 rounded-2xl border border-surface-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-surface-white">Starter Free</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-white/10 text-surface-white/70">
                  Current
                </span>
              </div>
              <div className="font-display text-2xl font-bold">$0</div>
              <ul className="space-y-2 text-surface-white/60 text-[11px]">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-surface-white/40" />
                  <span>1 Active Widget</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-surface-white/40" />
                  <span>25 Approved Testimonials</span>
                </li>
                <li className="flex items-center gap-2 text-surface-white/40">
                  <X className="w-3.5 h-3.5" />
                  <span>"Powered by ClientEcho" logo</span>
                </li>
              </ul>
            </div>

            {/* Pro Plan */}
            <div className="bg-surface-white text-ink-900 p-5 rounded-2xl shadow-lg space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-ink-900">Pro Workspace</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-ink-900 text-surface-white">
                  Recommended
                </span>
              </div>
              <div className="font-display text-2xl font-extrabold">$19 <span className="text-xs font-mono font-normal text-ink-800/60">/ mo</span></div>
              <ul className="space-y-2 text-ink-900 text-[11px] font-medium">
                <li className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-ink-900" />
                  <span><strong>Unlimited</strong> Active Widgets</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-ink-900" />
                  <span><strong>Unlimited</strong> Testimonials & Bulk Moderation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-ink-900" />
                  <span>Pro Fonts, Colors & Unlimited CSS</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-3 text-xs font-medium text-surface-white/70 hover:text-surface-white transition"
            >
              Maybe Later
            </button>
            <Link
              href="/signup"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 bg-surface-white hover:bg-surface-light text-ink-900 font-display font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 group"
            >
              <span>Upgrade Workspace for $19/mo</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
