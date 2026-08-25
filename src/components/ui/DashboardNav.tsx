"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { CheckSquare, LayoutGrid, SlidersHorizontal, BarChart3, Settings, CreditCard, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/testimonials", label: "Approval Queue", icon: CheckSquare },
  { href: "/widgets",      label: "Widgets",         icon: LayoutGrid },
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
          className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-150 text-base font-semibold ${
            active
              ? "bg-surface-white text-ink-900 shadow-md font-bold"
              : "text-surface-white/80 hover:bg-surface-white/10 hover:text-surface-white"
          }`}
        >
          <Icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-ink-900" : "text-surface-white/70"}`} />
          <span>{label}</span>
          {active && (
            <span className="ml-auto w-2 h-2 rounded-full bg-ink-900" />
          )}
        </Link>
      );
    }
    return (
      <Link
        href={href}
        className={`transition-all duration-150 flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold relative ${
          active
            ? "bg-surface-white/20 text-surface-white font-bold shadow-xs border border-surface-white/15"
            : "text-surface-white/80 hover:bg-surface-white/10 hover:text-surface-white border border-transparent"
        }`}
      >
        <Icon className={`w-4 h-4 sm:w-[18px] sm:h-[18px] flex-shrink-0 ${active ? "text-surface-white" : "text-surface-white/75"}`} />
        <span className="tracking-tight">{label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* ── Desktop Navigation: lg and above ── */}
      <nav className="hidden lg:flex items-center gap-1.5 font-sans relative">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>

      {/* ── Mobile Hamburger Button: below lg ── */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl text-surface-white/80 hover:text-surface-white hover:bg-surface-white/10 transition-colors cursor-pointer"
        aria-label="Open navigation menu"
        aria-expanded={drawerOpen}
      >
        <Menu className="w-6 h-6" />
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
              className="fixed top-0 left-0 bottom-0 z-[70] w-80 bg-ink-900 border-r border-ink-800 flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-ink-800">
                <Link
                  href="/testimonials"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 bg-surface-white rounded-xl flex items-center justify-center p-1.5 shadow-sm group-hover:scale-105 transition-transform">
                    <Image
                      src="/ClientEcho_logo.png"
                      alt="ClientEcho Logo"
                      width={28}
                      height={28}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="font-display font-bold text-lg text-surface-white">ClientEcho</span>
                </Link>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-surface-white/60 hover:text-surface-white hover:bg-surface-white/10 transition-colors cursor-pointer"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Nav Links */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
                <p className="text-xs font-mono uppercase tracking-widest text-surface-white/40 px-4 pb-2 pt-1 font-bold">
                  Navigation
                </p>
                {navItems.map((item) => (
                  <NavLink key={item.href} {...item} mobile />
                ))}
              </nav>

              {/* Drawer Footer */}
              <div className="p-5 border-t border-ink-800">
                <div className="px-4 py-3 rounded-2xl bg-ink-800 border border-surface-white/10">
                  <p className="text-[11px] font-mono text-surface-white/50 uppercase tracking-wider mb-0.5 font-bold">
                    Workspace
                  </p>
                  <p className="text-sm text-surface-white font-semibold truncate">
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
