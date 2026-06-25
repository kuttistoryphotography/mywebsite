import Script from "next/script";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

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
      default: "Kutti Story Photography | Wedding Photography & Videography in Madurai",
      template: "%s | Kutti Story Photography",
    },
    description:
    "Professional wedding photography and videography in Madurai. Kutti Story Photography offers candid wedding photography, cinematic wedding films, pre wedding shoots, engagement photography and traditional Tamil wedding photography across Tamil Nadu.",

keywords: [
  "Best Wedding Photographer in Madurai",
  "Wedding Photographer in Madurai",
  "Wedding Photography in Madurai",
  "Candid Wedding Photographer in Madurai",
  "Candid Wedding Photography Madurai",
  "Wedding Videography in Madurai",
  "Tamil Wedding Photographer",
  "Traditional Tamil Wedding Photography",
  "Pre Wedding Photography Madurai",
  "Post Wedding Photography Madurai",
  "Engagement Photography Madurai",
  "Baby Shower Photography Madurai",
  "Maternity Photography Madurai",
  "Portrait Photography Madurai",
  "Professional Photographer Madurai",
  "Kutti Story Photography"
], 

 authors: [{ name: "Kutti Story" }],
  creator: "Kutti Story",
  generator: 'v0.app',
  metadataBase: new URL("https://www.kuttistoryphotography.com"),

  alternates: {
  canonical: "https://www.kuttistoryphotography.com",
},

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
    url: "https://www.kuttistoryphotography.com",
    siteName: "Kutti Story",
    title: "Kutti Story Photography | Wedding Photography & Videography in Madurai",
    description:
      "Looking for the best wedding photographer in Madurai? Kutti Story Photography specializes in candid wedding photography, cinematic wedding films, pre wedding shoots, engagement photography and traditional Tamil wedding photography across Tamil Nadu.",
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
    title: "Best Wedding Photographer in Madurai | Kutti Story Photography",
    description:
      "Looking for the best wedding photographer in Madurai? Kutti Story Photography specializes in candid wedding photography, cinematic wedding films, pre wedding shoots, engagement photography and traditional Tamil wedding photography across Tamil Nadu.",
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
      "@type": ["LocalBusiness", "ProfessionalService"],
      sameAs: ["https://www.instagram.com/kuttistory_photography"],
            name: "Kutti Story Photography",
      serviceType: [
        "Wedding Photography",
        "Candid Wedding Photography",
        "Wedding Videography",
        "Pre Wedding Photography",
        "Engagement Photography",
        "Baby Shower Photography"
      ],
      image: "https://www.kuttistoryphotography.com/favicon.svg",
      url: "https://www.kuttistoryphotography.com",
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
      "Best wedding photographer in Madurai offering candid wedding photography, cinematic wedding films, pre wedding shoots, engagement photography and traditional Tamil wedding photography across Tamil Nadu."
    }),
  }}
/>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </head>
      <body
      className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black overflow-x-hidden w-full min-h-screen`}
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
