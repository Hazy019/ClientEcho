"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, Sparkles, SlidersHorizontal, BarChart3, Settings, CreditCard, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/testimonials", label: "Approval Queue", icon: CheckSquare },
  { href: "/widgets",      label: "Widgets",         icon: Sparkles },
  { href: "/channels",     label: "Channels",         icon: SlidersHorizontal },
  { href: "/dashboard",    label: "Analytics",        icon: BarChart3 },
  { href: "/settings",     label: "Settings",         icon: Settings },
  { href: "/billing",      label: "Billing",          icon: CreditCard },
];

export default function DashboardNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const isActive = (href: string) => pathname === href;

  const NavLink = ({ href, label, icon: Icon, mobile = false }: {
    href: string;
    label: string;
    icon: React.ElementType;
    mobile?: boolean;
  }) => {
    const active = isActive(href);
    if (mobile) {
      return (
        <Link
          href={href}
          onClick={() => setDrawerOpen(false)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 text-sm font-medium ${
            active
              ? "bg-surface-white text-ink-900 shadow-sm font-semibold"
              : "text-surface-white/70 hover:bg-surface-white/10 hover:text-surface-white"
          }`}
        >
          <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-ink-900" : "text-surface-white/60"}`} />
          <span>{label}</span>
          {active && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-ink-900" />
          )}
        </Link>
      );
    }
    return (
      <Link
        href={href}
        className={`transition-all duration-150 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
          active
            ? "bg-surface-white/15 text-surface-white font-semibold"
            : "text-surface-white/60 hover:bg-surface-white/10 hover:text-surface-white"
        }`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{label}</span>
        {/* Active underline bar — visual rhyming with the system's pill/badge aesthetic */}
        {active && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface-white rounded-full opacity-0" />
        )}
      </Link>
    );
  };

  return (
    <>
      {/* ── Desktop Navigation: lg and above ── */}
      <nav className="hidden lg:flex items-center gap-1 text-xs font-medium text-surface-white/70 relative">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>

      {/* ── Mobile Hamburger Button: below lg ── */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-surface-white/70 hover:text-surface-white hover:bg-surface-white/10 transition-colors"
        aria-label="Open navigation menu"
        aria-expanded={drawerOpen}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-[60] bg-ink-900/80 backdrop-blur-sm"
              style={{ top: 0 }}
            />

            {/* Drawer Panel */}
            <motion.div
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 z-[70] w-72 bg-ink-900 border-r border-ink-800 flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-ink-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-surface-white rounded-lg flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                      <circle cx="12" cy="12" r="10" stroke="#2D2D2D" strokeWidth="2"/>
                      <path d="M8 12l2.5 2.5L16 9" stroke="#2D2D2D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="font-display font-bold text-base text-surface-white">ClientEcho</span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-white/50 hover:text-surface-white hover:bg-surface-white/10 transition-colors"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Nav Links */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                <p className="text-[10px] font-mono uppercase tracking-widest text-surface-white/30 px-4 pb-2 pt-1">
                  Navigation
                </p>
                {navItems.map((item) => (
                  <NavLink key={item.href} {...item} mobile />
                ))}
              </nav>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-ink-800">
                <div className="px-4 py-2 rounded-xl bg-ink-800 border border-surface-white/8">
                  <p className="text-[10px] font-mono text-surface-white/40 uppercase tracking-wider mb-0.5">
                    Workspace
                  </p>
                  <p className="text-xs text-surface-white/70 font-medium truncate">
                    Creator Dashboard
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
