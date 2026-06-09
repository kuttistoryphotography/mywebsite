import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "../components/ConditionalLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Kutti Story - Professional Wedding & Pre-Wedding Photography",
    template: "%s | Kutti Story"
  },
  description: "Kutti Story specializes in capturing your special moments with stunning wedding and pre-wedding photography. Professional photography services across India.",
  keywords: ["wedding photography", "pre-wedding photography", "wedding photographer", "photography services", "professional photographer", "Kutti Story"],
  authors: [{ name: "Kutti Story" }],
  creator: "Kutti Story",
  generator: 'v0.app',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://kuttistory.com",
    siteName: "Kutti Story",
    title: "Kutti Story - Professional Wedding & Pre-Wedding Photography",
    description: "Capturing your special moments with stunning photography",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Kutti Story Photography"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Kutti Story - Professional Wedding & Pre-Wedding Photography",
    description: "Capturing your special moments with stunning photography",
    images: ["/images/og-image.jpg"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
      </body>
    </html>
  );
}
