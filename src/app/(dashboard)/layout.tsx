import Link from "next/link";
import Image from "next/image";
import { getCachedAuthUser } from "@/lib/supabase/server";
import { db } from "@/db";
import { creators } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AlertTriangle } from "lucide-react";
import SignOutButton from "./SignOutButton";
import DashboardNav from "@/components/ui/DashboardNav";
import HelpSupportButton from "@/components/ui/HelpSupportButton";
import { ToastProvider } from "@/components/ui/Toast";
import { ModalProvider } from "@/components/ui/ConfirmModal";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCachedAuthUser();
  const userEmail = user?.email || "Creator Workspace";

  let isSuspended = false;
  if (user) {
    try {
      const [creator] = await db
        .select({ status: creators.subscriptionStatus })
        .from(creators)
        .where(eq(creators.id, user.id));
      if (creator?.status === "suspended") {
        isSuspended = true;
      }
    } catch {}
  }

  return (
    <ModalProvider>
      <ToastProvider>
        <div className="min-h-screen bg-surface-light font-sans text-ink-900 overflow-hidden">
        {/* Top Header: fixed, outside the scroll container entirely */}
        <header className="app-navbar bg-ink-900 text-surface-white px-4 sm:px-6 lg:px-8 flex items-center justify-between border-b border-ink-800">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-4 sm:gap-8 min-w-0">
            <Link href="/testimonials" className="flex items-center gap-3 flex-shrink-0 group">
              <div className="w-8 h-8 bg-surface-white rounded-xl flex items-center justify-center p-1.5 shadow-sm group-hover:scale-105 transition-transform">
                <Image
                  src="/ClientEcho_logo.png"
                  alt="ClientEcho Logo"
                  width={28}
                  height={28}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-surface-white hidden sm:block">
                ClientEcho
              </span>
            </Link>

            <DashboardNav />
          </div>

          {/* Right: Email + Sign Out */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
            <span
              title={userEmail}
              className="hidden md:inline-flex items-center px-3.5 py-1.5 rounded-full font-mono text-xs sm:text-[13px] font-semibold text-surface-white/90 bg-ink-800 border border-surface-white/20 max-w-[220px] truncate shadow-xs"
            >
              {userEmail}
            </span>
            <SignOutButton />
          </div>
        </header>

        {/* Dedicated Scrollable Region starting beneath the fixed navbar */}
        <main className="app-scroll-region bg-surface-light">
          <div className="w-full max-w-6xl 2xl:max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {isSuspended && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-900 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-mono">
                <div className="flex items-center gap-2.5 min-w-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <span className="font-bold uppercase tracking-wider block">Account Suspended</span>
                    <span className="text-xs text-rose-800/80">
                      Your account has been temporarily suspended by an administrator. Embedded widgets are inactive.
                    </span>
                  </div>
                </div>
                <a
                  href="mailto:support@clientecho.com?subject=Account%20Suspension%20Appeal"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold transition shrink-0 shadow-xs text-xs sm:text-sm"
                >
                  Contact Support
                </a>
              </div>
            )}
            {children}
          </div>
        </main>

        {/* Floating Persistent Help & Support Affordance */}
        <HelpSupportButton />
      </div>
      </ToastProvider>
    </ModalProvider>
  );
}

