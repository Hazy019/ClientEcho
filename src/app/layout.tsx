import type { Metadata } from "next";
import { Syne, Manrope } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

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
    <html lang="en" className={`${syne.variable} ${manrope.variable}`}>
      <body className="antialiased font-sans bg-surface-white text-ink-900 selection:bg-ink-900 selection:text-surface-white">
        {children}
      </body>
    </html>
  );
}

