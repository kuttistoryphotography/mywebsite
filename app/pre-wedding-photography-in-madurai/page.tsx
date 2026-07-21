import Link from "next/link";
import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Best Pre Wedding Photography in Madurai | Kutti Story Photography",

  description:
    "Looking for the best pre wedding photography in Madurai? Kutti Story Photography offers cinematic pre wedding photoshoots, couple portraits, destination pre wedding photography, and creative storytelling sessions.",

  keywords: [
    "Pre Wedding Photography in Madurai",
    "Best Pre Wedding Photographer Madurai",
    "Pre Wedding Photoshoot Madurai",
    "Couple Photoshoot Madurai",
    "Destination Pre Wedding Shoot",
    "Cinematic Pre Wedding Photography",
    "Kutti Story Photography",
  ],

  alternates: {
    canonical:
      "https://www.kuttistoryphotography.com/pre-wedding-photography-in-madurai",
  },

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title:
      "Best Pre Wedding Photography in Madurai | Kutti Story Photography",

    description:
      "Professional pre wedding photography and cinematic couple photoshoots in Madurai.",

    url:
      "https://www.kuttistoryphotography.com/pre-wedding-photography-in-madurai",

    siteName: "Kutti Story Photography",

    type: "website",
  },

  twitter: {
    card: "summary_large_image",

    title: "Best Pre Wedding Photography in Madurai",

    description:
      "Professional pre wedding photography in Madurai by Kutti Story Photography.",
  },
};

export default function PreWeddingPhotographyPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <Script
        id="pre-wedding-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Pre Wedding Photography in Madurai",
            provider: {
              "@type": "LocalBusiness",
              name: "Kutti Story Photography",
              url: "https://www.kuttistoryphotography.com",
            },
            areaServed: "Madurai",
            serviceType: "Pre Wedding Photography",
            description:
              "Professional pre wedding photography, cinematic couple photoshoots, and destination pre wedding sessions in Madurai.",
            url:
              "https://www.kuttistoryphotography.com/pre-wedding-photography-in-madurai",
          }),
        }}
      />
      <h1 className="text-4xl font-bold mb-6">
        Pre Wedding Photography in Madurai
      </h1>

      <p className="mb-6 leading-8">
        Looking for the best pre wedding photography in Madurai? Kutti Story
        Photography specializes in cinematic pre wedding photoshoots, romantic
        couple portraits, creative storytelling, and destination pre wedding
        photography. We capture your unique love story with natural expressions,
        beautiful locations, and professional editing, creating timeless memories
        before your wedding day.
      </p>

      <section className="mt-10">
        <h2 className="text-3xl font-bold mb-4">
          Why Choose Kutti Story Photography for Pre Wedding Photography?
        </h2>

        <p className="leading-8">
          Every couple has a unique story, and our goal is to capture it in a
          creative and meaningful way. We help you choose beautiful locations,
          suggest poses naturally, guide you through the entire shoot, and create
          cinematic images that reflect your personality. From romantic outdoor
          sessions to destination pre wedding shoots, our experienced team ensures
          every photograph feels authentic and timeless.
        </p>
      </section>

      <p className="leading-8 mt-6">
        Our pre wedding photography combines candid moments, creative compositions,
        natural lighting, and professional editing to produce elegant photographs
        that you can proudly share with friends, family, and on your wedding
        invitations or social media.
      </p>

      {/* EXISTING CONTENT CONTINUES */}

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Creative Pre Wedding Photoshoots
      </h2>

      <p className="leading-8">
        Our team specializes in cinematic pre wedding photography, outdoor couple
        photoshoots, destination pre wedding sessions, romantic storytelling, and
        creative portrait photography. We carefully plan every shoot to match your
        personality, style, and preferred location, ensuring every photograph tells
        your unique love story.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Popular Pre Wedding Locations
      </h2>

      <ul className="list-disc pl-6 space-y-2">
        <li>Meenakshi Amman Temple Area</li>
        <li>Vaigai River Locations</li>
        <li>Resorts and Gardens</li>
        <li>Hill Stations Near Madurai</li>
        <li>Beach Destination Shoots</li>
      </ul>

      <section className="mt-10">
        <h2 className="text-3xl font-bold mb-4">
          Our Pre Wedding Photography Packages
        </h2>

        <p className="leading-8">
          We offer customized pre wedding photography packages that include couple
          portraits, cinematic videography, destination shoots, drone coverage,
          professional editing, premium albums, and social media ready photographs.
          Every package can be tailored to your preferred location, concept, and
          budget.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-3xl font-bold mb-6">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6">

          <div>
            <h3 className="text-xl font-semibold">
              When should we schedule our pre wedding photoshoot?
            </h3>

            <p className="mt-2 leading-8">
              Most couples schedule their pre wedding photoshoot 1 to 3 months before
              the wedding. This gives enough time for editing and using the photos for
              invitations, wedding websites, or social media.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">
              Do you help with locations and shoot concepts?
            </h3>

            <p className="mt-2 leading-8">
              Yes. We help you choose beautiful locations, themes, outfits, poses,
              and creative concepts that match your personality and style.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">
              Do you travel outside Madurai?
            </h3>

            <p className="mt-2 leading-8">
              Yes. We provide pre wedding photography across Tamil Nadu, Kerala,
              Bangalore, Pondicherry, and destination locations throughout India.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">
              Can we customize our pre wedding photography package?
            </h3>

            <p className="mt-2 leading-8">
              Absolutely. Our packages can be customized with photography,
              videography, drone coverage, premium editing, albums, and destination
              shoot options based on your requirements.
            </p>
          </div>

        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-3xl font-bold mb-6">
          Explore More Photography Services
        </h2>

        <div className="flex flex-wrap gap-4">
          <Link
            href="/wedding-photography-madurai"
            className="px-5 py-3 rounded-lg bg-white/10 hover:bg-white hover:text-black transition"
          >
            Wedding Photography
          </Link>

          <Link
            href="/candid-wedding-photographer-in-madurai"
            className="px-5 py-3 rounded-lg bg-white/10 hover:bg-white hover:text-black transition"
          >
            Candid Wedding Photography
          </Link>

          <Link
            href="/engagement-photography-in-madurai"
            className="px-5 py-3 rounded-lg bg-white/10 hover:bg-white hover:text-black transition"
          >
            Engagement Photography
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