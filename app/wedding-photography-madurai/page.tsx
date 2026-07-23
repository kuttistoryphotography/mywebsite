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

    images: [
      {
        url: "https://www.kuttistoryphotography.com/01.webp",
        width: 1200,
        height: 630,
        alt: "Best Wedding Photography in Madurai by Kutti Story Photography",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "Best Wedding Photography in Madurai",

    description:
      "Professional Wedding Photography in Madurai by Kutti Story Photography.",

    images: [
      "https://www.kuttistoryphotography.com/01.webp",
    ],
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
              "@id": "https://www.kuttistoryphotography.com/#organization",
              name: "Kutti Story Photography",
              url: "https://www.kuttistoryphotography.com",
              image: "https://www.kuttistoryphotography.com/01.webp",
              telephone: "+91-9342013600",
              address: {
                "@type": "PostalAddress",
                streetAddress: "52/32 South Mada Street, Near Koodal Azhagar Perumal Temple",
                addressLocality: "Madurai",
                addressRegion: "Tamil Nadu",
                postalCode: "625001",
                addressCountry: "IN",
              },

              geo: {
                "@type": "GeoCoordinates",
                latitude: "9.9252",
                longitude: "78.1198",
              },
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
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://www.kuttistoryphotography.com",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Wedding Photography",
                item: "https://www.kuttistoryphotography.com/wedding-photography-madurai",
              },
            ],
          }),
        }}
      />

      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Which is the best wedding photography company in Madurai?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Kutti Story Photography is known for candid wedding photography, cinematic wedding films, traditional Tamil wedding photography, premium wedding albums, and destination wedding coverage across Madurai and Tamil Nadu.",
                },
              },
              {
                "@type": "Question",
                name: "Do you provide candid wedding photography?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. We specialize in natural candid wedding photography that captures genuine emotions and beautiful moments throughout your wedding day.",
                },
              },
              {
                "@type": "Question",
                name: "Do you travel outside Madurai?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. We provide wedding photography services across Tamil Nadu, Kerala, Pondicherry, Bangalore, and destination wedding locations throughout India.",
                },
              },
            ],
          }),
        }}
      />

      <nav
        aria-label="Breadcrumb"
        className="mb-8 text-sm text-gray-400"
      >
        <ol className="flex items-center gap-2 flex-wrap">
          <li>
            <a href="/" className="hover:text-white transition">
              Home
            </a>
          </li>

          <li>/</li>

          <li className="text-white">
            Wedding Photography in Madurai
          </li>
        </ol>
      </nav>

      <h1 className="text-5xl font-bold mb-8">
        Best Wedding Photography in Madurai
      </h1>

      <p className="text-lg leading-8 text-gray-300">
        Welcome to <strong>Kutti Story Photography</strong>, one of the trusted
        names for <strong>Wedding Photography in Madurai</strong>. We specialize
        in candid wedding photography, cinematic wedding films, traditional Tamil
        wedding photography, engagement photography, pre-wedding shoots, post-wedding
        photography, and destination wedding coverage. Our team captures genuine
        emotions, timeless moments, and beautiful stories for couples across
        Madurai, Dindigul, Theni, Sivagangai, Virudhunagar, Ramanathapuram, and
        throughout Tamil Nadu.
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

      <section className="mt-20 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Book the Best Wedding Photography in Madurai
        </h2>

        <p className="text-lg text-gray-300 leading-8 max-w-3xl mx-auto">
          Looking for professional wedding photography in Madurai? Kutti Story
          Photography offers candid wedding photography, cinematic wedding films,
          engagement photography, pre-wedding shoots, and complete wedding coverage
          across Tamil Nadu. Contact us today to discuss your wedding and receive a
          customized photography package.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a
            href="/contact-us"
            className="rounded-lg bg-white px-6 py-3 font-semibold text-black transition hover:opacity-90"
          >
            Contact Us
          </a>

          <a
            href="tel:+919342013600"
            className="rounded-lg border border-white px-6 py-3 font-semibold transition hover:bg-white hover:text-black"
          >
            Call +91 93420 13600
          </a>
        </div>
      </section>

    </main>
  );
}