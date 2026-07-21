import Link from "next/link";

import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Candid Wedding Photographer in Madurai | Kutti Story Photography",

  description:
    "Looking for the best candid wedding photographer in Madurai? Kutti Story Photography captures genuine emotions, natural moments, cinematic wedding photography, engagement photography, and timeless wedding memories.",

  keywords: [
    "Candid Wedding Photographer in Madurai",
    "Candid Wedding Photography Madurai",
    "Best Candid Photographer Madurai",
    "Wedding Photographer Madurai",
    "Wedding Photography Madurai",
    "Wedding Videography Madurai",
    "Kutti Story Photography",
  ],

  alternates: {
    canonical:
      "https://www.kuttistoryphotography.com/candid-wedding-photographer-in-madurai",
  },

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title:
      "Candid Wedding Photographer in Madurai | Kutti Story Photography",

    description:
      "Professional candid wedding photography in Madurai capturing real emotions and unforgettable moments.",

    url:
      "https://www.kuttistoryphotography.com/candid-wedding-photographer-in-madurai",

    siteName: "Kutti Story Photography",

    type: "website",
  },

  twitter: {
    card: "summary_large_image",

    title: "Candid Wedding Photographer in Madurai",

    description:
      "Professional candid wedding photography in Madurai by Kutti Story Photography.",
  },
};

export default function CandidWeddingPhotographerPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <Script
        id="candid-wedding-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Candid Wedding Photographer in Madurai",
            provider: {
              "@type": "LocalBusiness",
              name: "Kutti Story Photography",
              url: "https://www.kuttistoryphotography.com",
            },
            areaServed: "Madurai",
            serviceType: "Candid Wedding Photography",
            description:
              "Professional candid wedding photography in Madurai capturing genuine emotions, natural moments, and timeless memories.",
            url:
              "https://www.kuttistoryphotography.com/candid-wedding-photographer-in-madurai",
          }),
        }}
      />
      <h1 className="text-4xl font-bold mb-6">
        Candid Wedding Photographer in Madurai
      </h1>

      <p className="mb-6">
        Kutti Story Photography specializes in candid wedding photography in
        Madurai, capturing genuine emotions, natural expressions and timeless
        memories. Our candid photography style focuses on real moments rather
        than posed photographs.
      </p>

      <section className="mt-10">
        <h2 className="text-3xl font-bold mb-4">
          Why Choose Kutti Story Photography for Candid Wedding Photography?
        </h2>

        <p className="leading-8">
          At Kutti Story Photography, we believe the most beautiful wedding memories
          are the ones that happen naturally. Our candid wedding photography captures
          genuine smiles, emotional moments, laughter, happy tears, and every small
          detail that makes your wedding unique. We use creative compositions,
          professional lighting, and cinematic storytelling to create timeless images
          that reflect your love story.
        </p>
      </section>

      <p className="leading-8 mt-6">
        Candid wedding photography focuses on capturing genuine emotions rather
        than staged poses. From the bride's smile and the groom's reaction to
        joyful family celebrations and heartfelt moments, every photograph tells
        a meaningful story that you can cherish for a lifetime.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Our Candid Photography Services
      </h2>

      <ul className="list-disc pl-6 space-y-2">
        <li>Candid Wedding Photography</li>
        <li>Couple Portrait Sessions</li>
        <li>Engagement Photography</li>
        <li>Reception Photography</li>
        <li>Traditional Wedding Coverage</li>
      </ul>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Frequently Asked Questions
      </h2>

      <h3 className="text-xl font-semibold mt-6">
        What is candid wedding photography?
      </h3>

      <p>
        Candid wedding photography captures real emotions and genuine moments
        naturally, without asking couples or guests to pose.
      </p>

      <h3 className="text-xl font-semibold mt-6">
        Do you provide candid wedding videography?
      </h3>

      <p>
        Yes. We provide cinematic wedding films and candid wedding videography to
        beautifully document your special day.
      </p>

      <h3 className="text-xl font-semibold mt-6">
        Do you travel outside Madurai?
      </h3>

      <p>
        Yes. We cover weddings across Tamil Nadu, Kerala, Bangalore,
        Pondicherry, and destination weddings throughout India.
      </p>

      <h3 className="text-xl font-semibold mt-6">
        Can I customize my wedding photography package?
      </h3>

      <p>
        Absolutely. We offer flexible photography and videography packages based
        on your wedding events, budget, and coverage requirements.
      </p>

      <section className="mt-12">
        <h2 className="text-3xl font-bold mb-6">
          Explore More Wedding Photography Services
        </h2>

        <div className="flex flex-wrap gap-4">
          <Link
            href="/wedding-photography-madurai"
            className="px-5 py-3 rounded-lg bg-white/10 hover:bg-white hover:text-black transition"
          >
            Wedding Photography
          </Link>

          <Link
            href="/engagement-photography-in-madurai"
            className="px-5 py-3 rounded-lg bg-white/10 hover:bg-white hover:text-black transition"
          >
            Engagement Photography
          </Link>

          <Link
            href="/pre-wedding-photography-in-madurai"
            className="px-5 py-3 rounded-lg bg-white/10 hover:bg-white hover:text-black transition"
          >
            Pre Wedding Photography
          </Link>
        </div>
      </section>

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