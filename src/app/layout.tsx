import type { Metadata, Viewport } from "next";
import { Syne, Manrope, Inter, Roboto, Outfit } from "next/font/google";
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

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
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
    default: "ClientEcho",
    template: "%s | ClientEcho",
  },
  description:
    "ClientEcho enables solo creators, developers, and agencies to collect 1-click magic link approvals, import offline praise with hardcoded trust signals, and embed sandboxed widgets in minutes.",
  keywords: [
    "kyrell santillan",
    "Kyrell Santillan",
    "Hazy",
    "hazy",
    "ClientEcho",
    "clientecho",
    "client echo",
    "testimonial",
    "testimonials",
    "reviews",
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
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "ClientEcho",
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
    title: "ClientEcho",
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
  verification: {
    google: "jurX14tSOTCPj1zMR21guSGjlv22Q17yRsd9fNjop5g",
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
    <html lang="en" className={`${syne.variable} ${manrope.variable} ${inter.variable} ${roboto.variable} ${outfit.variable}`}>
      <head>
        <meta name="google-site-verification" content="jurX14tSOTCPj1zMR21guSGjlv22Q17yRsd9fNjop5g" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-48x48.png" type="image/png" sizes="48x48" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="antialiased font-sans bg-surface-white text-ink-900 selection:bg-ink-900 selection:text-surface-white">
        {children}
      </body>
    </html>
  );
}
