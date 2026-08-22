import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";
import DashboardNav from "@/components/ui/DashboardNav";
import HelpSupportButton from "@/components/ui/HelpSupportButton";
import { ToastProvider } from "@/components/ui/Toast";
import { ModalProvider } from "@/components/ui/ConfirmModal";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userEmail = user?.email || "Creator Workspace";

  return (
    <ModalProvider>
      <ToastProvider>
        <div className="min-h-screen bg-surface-light font-sans text-ink-900 overflow-hidden">
        {/* Top Header: fixed, outside the scroll container entirely */}
        <header className="app-navbar bg-ink-900 text-surface-white px-4 md:px-6 flex items-center justify-between">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-3 md:gap-6 min-w-0">
            <Link href="/testimonials" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-7 h-7 bg-surface-white rounded-lg flex items-center justify-center p-1">
                <Image
                  src="/ClientEcho_logo.png"
                  alt="ClientEcho Logo"
                  width={24}
                  height={24}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-display font-bold text-base tracking-tight text-surface-white hidden sm:block">
                ClientEcho
              </span>
            </Link>

            <DashboardNav />
          </div>

          {/* Right: Email + Sign Out */}
          <div className="flex items-center gap-2 md:gap-3 text-xs flex-shrink-0">
            <span
              title={userEmail}
              className="hidden md:inline-flex items-center px-2.5 py-1 rounded-full font-mono text-surface-white/70 bg-ink-800 border border-surface-white/15 max-w-[180px] truncate text-[11px]"
            >
              {userEmail}
            </span>
            <SignOutButton />
          </div>
        </header>

        {/* Dedicated Scrollable Region starting beneath the fixed navbar */}
        <main className="app-scroll-region bg-surface-light">
          <div className="max-w-7xl w-full mx-auto p-4 md:p-8">{children}</div>
        </main>

        {/* Floating Persistent Help & Support Affordance */}
        <HelpSupportButton />
      </div>
      </ToastProvider>
    </ModalProvider>
  );
}

