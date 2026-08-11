import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClientEcho - Zero-Friction Client Testimonials",
  description: "Multi-tenant B2B SaaS platform for collecting, moderating, and embedding client testimonials.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
