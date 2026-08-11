import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";
import { MessageSquare, Layout, Sparkles, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userEmail = user?.email || "Creator Workspace";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-indigo-600">
            <MessageSquare className="w-6 h-6 fill-indigo-600 text-white" />
            <span>ClientEcho</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/dashboard" className="hover:text-indigo-600 transition flex items-center gap-1.5">
              <Layout className="w-4 h-4" />
              <span>Overview</span>
            </Link>
            <Link href="/widgets" className="hover:text-indigo-600 transition flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Widgets</span>
            </Link>
            <Link href="/testimonials" className="hover:text-indigo-600 transition flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              <span>Testimonials</span>
            </Link>
            {user?.app_metadata?.role === "tech_admin" && (
              <Link href="/admin" className="hover:text-indigo-600 transition flex items-center gap-1.5 text-indigo-600 font-semibold">
                <Shield className="w-4 h-4" />
                <span>Admin Log</span>
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 max-w-[200px] truncate">
            {userEmail}
          </span>
          <SignOutButton />
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">{children}</main>
    </div>
  );
}
