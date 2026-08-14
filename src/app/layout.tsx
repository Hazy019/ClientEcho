import type { Metadata, Viewport } from "next";
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

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://clientecho.com";

export const viewport: Viewport = {
  themeColor: "#2D2D2D",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "ClientEcho — Zero-Friction Client Testimonials for Solo Creators & Agencies",
    template: "%s | ClientEcho",
  },
  description:
    "ClientEcho enables solo creators, developers, and agencies to collect 1-click magic link approvals, import offline praise with hardcoded trust signals, and embed sandboxed widgets in minutes.",
  keywords: [
    "client testimonials",
    "magic link approval",
    "social proof widget",
    "agency testimonial engine",
    "embeddable reviews",
    "creator tools",
    "verified testimonials",
  ],
  authors: [{ name: "ClientEcho Team", url: appUrl }],
  creator: "ClientEcho",
  publisher: "ClientEcho Inc.",
  icons: {
    icon: [
      { url: "/ClientEcho_logo.png", type: "image/png" },
      { url: "/ClientEcho_logo.png", sizes: "32x32", type: "image/png" },
      { url: "/ClientEcho_logo.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/ClientEcho_logo.png",
    apple: "/ClientEcho_logo.png",
  },
  openGraph: {
    title: "ClientEcho — Zero-Friction Client Testimonials",
    description:
      "Gather & embed verified social proof without client friction. 1-click magic links, offline praise imports, and sandboxed widgets.",
    url: appUrl,
    siteName: "ClientEcho",
    images: [
      {
        url: "/ClientEcho_logo.png",
        width: 512,
        height: 512,
        alt: "ClientEcho Logomark",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClientEcho — Zero-Friction Client Testimonials",
    description:
      "Gather & embed verified social proof without client friction. 1-click magic links, offline praise imports, and sandboxed widgets.",
    images: ["/ClientEcho_logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: appUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${syne.variable} ${manrope.variable}`}>
      <head>
        <link rel="icon" href="/ClientEcho_logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/ClientEcho_logo.png" />
      </head>
      <body className="antialiased font-sans bg-surface-white text-ink-900 selection:bg-ink-900 selection:text-surface-white">
        {children}
      </body>
    </html>
  );
}
