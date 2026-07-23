import Link from "next/link";
import Script from "next/script";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Wedding Videography in Madurai | Cinematic Wedding Films | Kutti Story Photography",

  description:
    "Kutti Story Photography offers professional wedding videography in Madurai with cinematic wedding films, teaser videos, highlight videos, drone coverage and traditional wedding videography across Tamil Nadu.",

  keywords: [
    "Wedding Videography in Madurai",
    "Cinematic Wedding Films Madurai",
    "Wedding Video Editor Madurai",
    "Wedding Highlight Video Madurai",
    "Wedding Teaser Video Madurai",
    "Drone Wedding Videography Madurai",
    "Traditional Wedding Videography Madurai",
    "Kutti Story Photography"
  ],

  alternates: {
    canonical:
      "https://www.kuttistoryphotography.com/wedding-videography-in-madurai",
  },

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title:
      "Wedding Videography in Madurai | Cinematic Wedding Films",

    description:
      "Professional cinematic wedding films, teaser videos, highlight videos and drone wedding coverage by Kutti Story Photography in Madurai.",

    url:
      "https://www.kuttistoryphotography.com/wedding-videography-in-madurai",

    siteName:
      "Kutti Story Photography",

    type:
      "website",

    images: [
      {
        url:
          "https://www.kuttistoryphotography.com/01.webp",
        width: 1200,
        height: 630,
        alt:
          "Wedding Videography in Madurai - Kutti Story Photography",
      },
    ],
  },

  twitter: {
    card:
      "summary_large_image",

    title:
      "Wedding Videography in Madurai | Kutti Story Photography",

    description:
      "Cinematic wedding films and professional wedding videography services in Madurai.",

    images: [
      "https://www.kuttistoryphotography.com/01.webp",
    ],
  },
};

export default function WeddingVideographyPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
        __html: JSON.stringify({
        "@context":"https://schema.org",
        "@type":"Service",
        "name":"Wedding Videography in Madurai",

        "provider":{
        "@type":"LocalBusiness",
        "name":"Kutti Story Photography",
        "url":"https://www.kuttistoryphotography.com",
        "telephone":"+91 9342013600",
        "address":{
        "@type":"PostalAddress",
        "streetAddress":"52/32 South Mada Street, Near Koodal Azhagar Perumal Temple",
        "addressLocality":"Madurai",
        "addressRegion":"Tamil Nadu",
        "postalCode":"625001",
        "addressCountry":"IN"
        }
        },

        "areaServed":"Madurai",
        "serviceType":"Wedding Videography",

        "description":
        "Professional cinematic wedding films, teaser videos, highlight videos and drone wedding coverage in Madurai."

        })
        }}
        />
      <h1 className="text-4xl font-bold mb-6">
        Wedding Videography in Madurai
      </h1>

      <p className="mb-6">
        Kutti Story Photography provides professional wedding videography in
        Madurai. We create cinematic wedding films that capture emotions,
        traditions and unforgettable moments from your wedding day.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Cinematic Wedding Films
      </h2>

      <p>
        Our wedding videography team specializes in cinematic storytelling,
        highlight films, teaser videos and full wedding coverage. Every film
        is professionally edited with music, color grading and creative
        storytelling.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Our Wedding Videography Services
      </h2>

      <ul className="list-disc pl-6 space-y-2">
        <li>Cinematic Wedding Films</li>
        <li>Wedding Teaser Videos</li>
        <li>Wedding Highlight Videos</li>
        <li>Traditional Wedding Videography</li>
        <li>Drone Wedding Coverage</li>
        <li>Reception Videography</li>
        <li>Engagement Videography</li>
      </ul>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Why Choose Kutti Story Photography?
      </h2>

      <p>
        We use professional cameras, drones and creative editing techniques
        to produce wedding films that couples can cherish forever.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Frequently Asked Questions
      </h2>

      <h3 className="text-xl font-semibold mt-6">
        Do you provide cinematic wedding videos?
      </h3>

      <p>
        Yes. We specialize in cinematic wedding films, teaser videos and
        highlight videos.
      </p>

      <h3 className="text-xl font-semibold mt-6">
        Do you provide drone coverage?
      </h3>

      <p>
        Yes. Drone coverage is available for weddings, receptions and
        destination weddings.
      </p>

      <div className="flex gap-6 mt-10">
        <Link href="/works" className="text-amber-500 underline">
          View Portfolio
        </Link>

        <Link href="/contact-us" className="text-amber-500 underline">
          Contact Us
        </Link>
      </div>
    </main>
  );
}