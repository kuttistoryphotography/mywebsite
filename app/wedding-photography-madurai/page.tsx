import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Best Wedding Photography in Madurai | Kutti Story Photography",
  
  description:
    "Looking for the best wedding photography in Madurai? Kutti Story Photography offers candid wedding photography, cinematic wedding films, engagement photography, pre wedding shoots, and traditional Tamil wedding photography.",

  keywords: [
    "Best Wedding Photography in Madurai",
    "Wedding Photographer Madurai",
    "Candid Wedding Photographer Madurai",
    "Wedding Photography Madurai",
    "Wedding Videography Madurai",
    "Pre Wedding Photography Madurai",
    "Engagement Photography Madurai",
    "Tamil Wedding Photographer",
    "Kutti Story Photography",
  ],

  alternates: {
    canonical:
      "https://www.kuttistoryphotography.com/wedding-photography-madurai",
  },

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title: "Best Wedding Photography in Madurai | Kutti Story Photography",

    description:
      "Professional wedding photography and cinematic wedding films in Madurai.",

    url: "https://www.kuttistoryphotography.com/wedding-photography-madurai",

    siteName: "Kutti Story Photography",

    type: "website",
  },

  twitter: {
    card: "summary_large_image",

    title: "Best Wedding Photography in Madurai",

    description:
      "Professional Wedding Photography in Madurai by Kutti Story Photography.",
  },
};

export default function WeddingPhotographyMadurai() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-24 text-white">
      <Script
        id="wedding-photography-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Wedding Photography in Madurai",
            provider: {
              "@type": "LocalBusiness",
              name: "Kutti Story Photography",
              url: "https://www.kuttistoryphotography.com",
            },
            areaServed: "Madurai",
            serviceType: "Wedding Photography",
            description:
              "Professional wedding photography, candid photography, cinematic wedding films, engagement photography and pre wedding shoots in Madurai.",
            url:
              "https://www.kuttistoryphotography.com/wedding-photography-madurai",
          }),
        }}
      />

      <h1 className="text-5xl font-bold mb-8">
        Best Wedding Photography in Madurai
      </h1>

      <p className="text-lg leading-8 text-gray-300">
        Welcome to Kutti Story Photography. We specialize in candid wedding
        photography, cinematic wedding films, traditional Tamil wedding
        photography, engagement photography, and pre-wedding shoots across
        Madurai and Tamil Nadu.
      </p>

      <section className="mt-12">
        <h2 className="text-3xl font-semibold mb-4">
          Why Choose Kutti Story Photography?
        </h2>

        <p className="text-lg leading-8 text-gray-300">
          At Kutti Story Photography, we believe every wedding tells a unique
          story. Our team specializes in candid photography, cinematic wedding
          films, traditional Tamil wedding coverage, creative portraits, and
          premium editing. We focus on capturing genuine emotions, beautiful
          moments, and timeless memories that couples can cherish forever.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-3xl font-semibold mb-4">
          Our Wedding Photography Services
        </h2>

        <ul className="list-disc pl-6 space-y-3 text-lg text-gray-300">
          <li>Candid Wedding Photography</li>
          <li>Traditional Wedding Photography</li>
          <li>Cinematic Wedding Videography</li>
          <li>Engagement Photography</li>
          <li>Pre Wedding Photography</li>
          <li>Post Wedding Photography</li>
          <li>Drone Wedding Coverage</li>
          <li>Premium Wedding Album Design</li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-3xl font-semibold mb-4">
          Wedding Photography Packages in Madurai
        </h2>

        <p className="text-lg leading-8 text-gray-300">
          We offer flexible wedding photography packages to suit every couple's
          budget and requirements. Whether you need candid photography,
          traditional photography, cinematic wedding videography, drone coverage,
          premium wedding albums, or complete wedding coverage, our packages can
          be customized for your special day.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-3xl font-semibold mb-6">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6 text-gray-300">

          <div>
            <h3 className="text-xl font-semibold text-white">
              Which is the best wedding photography company in Madurai?
            </h3>

            <p className="mt-2">
              Kutti Story Photography is known for candid wedding photography,
              cinematic wedding films, traditional Tamil wedding photography,
              premium wedding albums, and destination wedding coverage across
              Madurai and Tamil Nadu.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white">
              Do you provide candid wedding photography?
            </h3>

            <p className="mt-2">
              Yes. We specialize in natural candid wedding photography that
              captures genuine emotions and beautiful moments throughout your
              wedding day.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white">
              Do you travel outside Madurai?
            </h3>

            <p className="mt-2">
              Yes. We provide wedding photography services across Tamil Nadu,
              Kerala, Pondicherry, Bangalore, and destination wedding locations
              throughout India.
            </p>
          </div>

        </div>
      </section>
      
      <section className="mt-16">
        <h2 className="text-3xl font-semibold mb-6">
          Explore More Photography Services
        </h2>

        <div className="flex flex-wrap gap-4">

          <a
            href="/candid-wedding-photographer-in-madurai"
            className="px-5 py-3 rounded-lg bg-white/10 hover:bg-white hover:text-black transition"
          >
            Candid Wedding Photography
          </a>

          <a
            href="/engagement-photography-in-madurai"
            className="px-5 py-3 rounded-lg bg-white/10 hover:bg-white hover:text-black transition"
          >
            Engagement Photography
          </a>

          <a
            href="/pre-wedding-photography-in-madurai"
            className="px-5 py-3 rounded-lg bg-white/10 hover:bg-white hover:text-black transition"
          >
            Pre Wedding Photography
          </a>

        </div>
      </section>

    </main>
  );
}