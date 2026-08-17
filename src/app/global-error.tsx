"use client";

import Image from "next/image";
import Link from "next/link";
import { AlertOctagon, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAFAFA] text-[#111827] flex items-center justify-center p-6 font-sans">
        <div className="bg-white max-w-lg w-full p-8 rounded-3xl shadow-xl border border-gray-200 text-center space-y-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 bg-[#111827] text-white rounded-xl flex items-center justify-center p-1.5 shadow-sm">
              <Image
                src="/ClientEcho_logo.png"
                alt="ClientEcho Logo"
                width={28}
                height={28}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-xl tracking-tight text-[#111827]">
              ClientEcho
            </span>
          </div>

          <div className="w-16 h-16 bg-rose-50 border border-rose-200 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <AlertOctagon className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-[#111827]">
              Critical Application Error
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed max-w-md mx-auto">
              A fatal error prevented the application layout from rendering. Please reload the application to restore your session.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="w-full sm:w-auto px-6 py-3 bg-[#111827] hover:bg-black text-white text-sm font-semibold rounded-xl transition shadow-sm inline-flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>

            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-[#111827] text-sm font-semibold rounded-xl transition inline-flex items-center justify-center gap-2"
            >
              <span>Return to Home</span>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
