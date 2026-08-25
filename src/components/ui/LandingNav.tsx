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
      <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-surface-white rounded-xl flex items-center justify-center p-1.5 shadow-sm group-hover:scale-105 transition-transform">
            <Image
              src="/ClientEcho_logo.png"
              alt="ClientEcho Logomark"
              width={28}
              height={28}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-surface-white">
            ClientEcho
          </span>
        </Link>

        {/* Desktop Nav Links with Scroll-Spy Active Indicator */}
        <div className="hidden md:flex items-center gap-7 lg:gap-9 text-sm sm:text-[15px] font-semibold text-surface-white/85">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleNavClick(e, item.id)}
                className={`transition-all duration-150 py-1.5 border-b-2 ${
                  isActive
                    ? "text-surface-white font-bold border-surface-white"
                    : "border-transparent text-surface-white/80 hover:text-surface-white"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3.5">
          <Link
            href="/login"
            className="text-sm font-semibold text-surface-white/90 hover:text-surface-white px-3 py-2 rounded-xl hover:bg-surface-white/10 transition"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 bg-surface-white text-ink-900 font-display font-bold text-sm rounded-full hover:bg-surface-light active:scale-95 transition shadow-sm"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2.5 rounded-xl text-surface-white/80 hover:text-surface-white hover:bg-surface-white/10 focus:outline-none cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-ink-900 border-b border-ink-800 px-6 py-6 space-y-5 animate-fade-in-up">
          <div className="flex flex-col space-y-3.5 text-base font-semibold text-surface-white/90">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => handleNavClick(e, item.id)}
                  className={`py-1.5 transition ${
                    isActive ? "text-surface-white font-bold pl-3 border-l-2 border-surface-white" : "hover:text-surface-white"
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
              className="w-full text-center py-3 text-sm font-bold text-surface-white border border-surface-white/20 rounded-xl hover:bg-surface-white/10"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-3 bg-surface-white text-ink-900 font-display font-bold text-sm rounded-xl shadow-sm hover:bg-surface-light"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
