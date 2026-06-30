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
              default:
                "Best Wedding Photography in Madurai | Kutti Story Photography",
              template: "%s | Kutti Story Photography",
            },
    description:
                "Looking for the best wedding photography in Madurai? Kutti Story Photography offers candid wedding photography, cinematic wedding films, wedding videography, engagement photography, pre wedding shoots, and traditional Tamil wedding photography across Tamil Nadu.",

keywords: [
  "Best Wedding Photography in Madurai",
  "Best Wedding Photographer in Madurai",
  "Wedding Photography in Madurai",
  "Wedding Photographer Madurai",
  "Candid Wedding Photography in Madurai",
  "Cinematic Wedding Photography",
  "Traditional Wedding Photography",
  "Wedding Videography Madurai",
  "Pre Wedding Photography Madurai",
  "Post Wedding Photography Madurai",
  "Engagement Photography Madurai",
  "Destination Wedding Photographer Tamil Nadu",
  "Tamil Wedding Photographer",
  "Professional Wedding Photographer",
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
    title: "Best Wedding Photography in Madurai | Kutti Story Photography",
    description:
      "Looking for the best wedding photographer in Madurai? Kutti Story Photography specializes in candid wedding photography, cinematic wedding films, pre wedding shoots, engagement photography and traditional Tamil wedding photography across Tamil Nadu.",
    images: [
      {
        url: "/01.webp",
        width: 1200,
        height: 630,
        alt: "Kutti Story Photography",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Wedding Photography in Madurai | Kutti Story Photography",
    description:
      "Looking for the best wedding photographer in Madurai? Kutti Story Photography specializes in candid wedding photography, cinematic wedding films, pre wedding shoots, engagement photography and traditional Tamil wedding photography across Tamil Nadu.",
    images: ["/01.webp"]
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
        <Script
  id="structured-data"
    type="application/ld+json"
    strategy="beforeInteractive"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
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
      image: "https://www.kuttistoryphotography.com/01.webp",
      logo: "https://www.kuttistoryphotography.com/favicon.svg",
      url: "https://www.kuttistoryphotography.com",
      telephone: "+919976733600",
      address: {
        "@type": "PostalAddress",
        streetAddress: "52/32, South Mada Street, Periyar",
        addressLocality: "Madurai",
        addressRegion: "Tamil Nadu",
        postalCode: "625001",
        addressCountry: "IN"
      },
      areaServed: {
        "@type": "State",
        name: "Tamil Nadu"
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 9.9252,
        longitude: 78.1198
      },

      priceRange: "₹₹",
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
          ],
          opens: "09:00",
          closes: "20:00"
        }
      ],
      
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
