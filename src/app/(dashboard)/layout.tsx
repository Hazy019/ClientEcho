import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";
import { CheckSquare, Sparkles, SlidersHorizontal, BarChart3, Settings, CreditCard, Shield } from "lucide-react";

import { ToastProvider } from "@/components/ui/Toast";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userEmail = user?.email || "Creator Workspace";

  return (
    <ToastProvider>
      <div className="min-h-screen bg-surface-light flex flex-col font-sans text-ink-900">
        {/* Top Header */}
        <header className="h-20 bg-ink-900 text-surface-white px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm border-b border-ink-800">
          <div className="flex items-center gap-8">
            <Link href="/testimonials" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-surface-white rounded-lg flex items-center justify-center p-1">
                <Image
                  src="/ClientEcho_logo.png"
                  alt="ClientEcho Logo"
                  width={24}
                  height={24}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-display font-bold text-lg tracking-tight text-surface-white">
                ClientEcho
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-5 text-xs font-medium text-surface-white/70">
              <Link
                href="/testimonials"
                className="hover:text-surface-white transition flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-white/10 text-surface-white"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Approval Queue</span>
              </Link>
              <Link
                href="/widgets"
                className="hover:text-surface-white transition flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-surface-white/5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Widgets</span>
              </Link>
              <Link
                href="/testimonials#channels"
                className="hover:text-surface-white transition flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-surface-white/5"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Ingestion Channels</span>
              </Link>
              <Link
                href="/dashboard"
                className="hover:text-surface-white transition flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-surface-white/5"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </Link>
              <span className="cursor-not-allowed opacity-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </span>
              <span className="cursor-not-allowed opacity-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg">
                <CreditCard className="w-4 h-4" />
                <span>Billing</span>
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="inline-flex items-center px-3 py-1 rounded-full font-mono text-surface-white bg-ink-800 border border-surface-white/20 max-w-[200px] truncate">
              {userEmail}
            </span>
            <SignOutButton />
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">{children}</main>
      </div>
    </ToastProvider>
  );
}

