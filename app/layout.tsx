import Script from "next/script";
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
    default: "Kutti Story Photography | Wedding Photographer in Madurai",
      template: "%s | Kutti Story Photography"
  },
  description:"Kutti Story Photography is a professional wedding photographer in Madurai specializing in cinematic wedding photography, candid photography, traditional Tamil wedding photography, pre-wedding shoots, post-wedding shoots, baby shower photography and portrait photography across Tamil Nadu.",
keywords: [
  "Wedding Photographer Madurai",
  "Wedding Photography Madurai",
  "Best Wedding Photographer Madurai",
  "Tamil Wedding Photographer",
  "Traditional Tamil Wedding Photography",
  "Candid Wedding Photography",
  "Cinematic Wedding Photography",
  "Pre Wedding Photography",
  "Post Wedding Photography",
  "Marriage Photography Madurai",
  "Baby Shower Photography",
  "Portrait Photography",
  "Wedding Photographer Tamil Nadu",
  "Professional Photographer Madurai"
],  authors: [{ name: "Kutti Story" }],
  creator: "Kutti Story",
  generator: 'v0.app',
 metadataBase: new URL("https://kuttistoryphotography.com"),
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
    url:  "https://kuttistoryphotography.com",
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
        <script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "Kutti Story Photography",
      image: "https://kuttistoryphotography.com/favicon.svg",
      url: "https://kuttistoryphotography.com",
      telephone: "+919976733600",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Madurai",
        addressRegion: "Tamil Nadu",
        addressCountry: "IN"
      },
      areaServed: "Tamil Nadu",
      priceRange: "₹₹",
      description:
        "Professional wedding photography, cinematic wedding photography, candid photography, pre wedding shoots and traditional Tamil wedding photography across Tamil Nadu."
    }),
  }}
/>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </head>
      <body
  className={`${geistSans.variable} ${geistMono.variable} antialiased`}
>
  <Script
    src="https://www.googletagmanager.com/gtag/js?id=G-1D4VY530T4"
    strategy="afterInteractive"
  />

  <Script id="google-analytics" strategy="afterInteractive">
    {`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-1D4VY530T4');
    `}
  </Script>

  <ConditionalLayout>
    {children}
  </ConditionalLayout>
</body>
    </html>
  );
}
