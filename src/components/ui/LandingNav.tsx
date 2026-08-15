"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

interface NavItem {
  id: string;
  label: string;
}

const navItems: NavItem[] = [
  { id: "features", label: "Features" },
  { id: "trust", label: "Security & RLS" },
  { id: "pricing", label: "Pricing" },
  { id: "help", label: "Help & FAQ" },
];

export default function LandingNav() {
  const [activeSection, setActiveSection] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const scrollContainer = document.querySelector(".app-scroll-region");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        root: scrollContainer || null,
        rootMargin: "-40% 0px -50% 0px",
        threshold: 0,
      }
    );

    navItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav className="app-navbar bg-ink-900 text-surface-white border-b border-ink-800">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
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

        {/* Desktop Nav Links with Scroll-Spy Active Indicator */}
        <div className="hidden md:flex items-center gap-8 text-xs font-medium text-surface-white/70">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleNavClick(e, item.id)}
                className={`transition-all duration-150 py-1 border-b-2 ${
                  isActive
                    ? "text-surface-white font-semibold border-surface-white"
                    : "border-transparent text-surface-white/70 hover:text-surface-white"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="text-xs font-medium text-surface-white/80 hover:text-surface-white transition"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 bg-surface-white text-ink-900 font-display font-semibold text-xs rounded-full hover:bg-surface-light transition shadow-sm"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-surface-white/80 hover:text-surface-white focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-ink-900 border-b border-ink-800 px-6 py-6 space-y-4 animate-fade-in-up">
          <div className="flex flex-col space-y-3 text-sm font-medium text-surface-white/80">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => handleNavClick(e, item.id)}
                  className={`py-1 transition ${
                    isActive ? "text-surface-white font-bold pl-2 border-l-2 border-surface-white" : "hover:text-surface-white"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </div>

          <div className="pt-4 border-t border-ink-800 flex flex-col gap-3">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 text-xs font-semibold text-surface-white border border-surface-white/20 rounded-xl"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 bg-surface-white text-ink-900 font-display font-semibold text-xs rounded-xl shadow-sm"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
