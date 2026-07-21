import Link from "next/link";
import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Best Engagement Photography in Madurai | Kutti Story Photography",

  description:
    "Looking for the best engagement photography in Madurai? Kutti Story Photography offers candid engagement photography, cinematic engagement videos, couple portraits, and creative engagement photography.",

  keywords: [
    "Engagement Photography in Madurai",
    "Best Engagement Photographer Madurai",
    "Engagement Photographer Madurai",
    "Candid Engagement Photography Madurai",
    "Couple Photography Madurai",
    "Engagement Videography Madurai",
    "Kutti Story Photography",
  ],

  alternates: {
    canonical:
      "https://www.kuttistoryphotography.com/engagement-photography-in-madurai",
  },

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title:
      "Best Engagement Photography in Madurai | Kutti Story Photography",

    description:
      "Professional engagement photography and cinematic engagement videos in Madurai.",

    url:
      "https://www.kuttistoryphotography.com/engagement-photography-in-madurai",

    siteName: "Kutti Story Photography",

    type: "website",
  },

  twitter: {
    card: "summary_large_image",

    title: "Best Engagement Photography in Madurai",

    description:
      "Professional engagement photography in Madurai by Kutti Story Photography.",
  },
};


export default function EngagementPhotographyPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <Script
        id="engagement-photography-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Engagement Photography in Madurai",
            provider: {
              "@type": "LocalBusiness",
              name: "Kutti Story Photography",
              url: "https://www.kuttistoryphotography.com",
            },
            areaServed: "Madurai",
            serviceType: "Engagement Photography",
            description:
              "Professional engagement photography, candid couple portraits, and cinematic engagement videography in Madurai.",
            url:
              "https://www.kuttistoryphotography.com/engagement-photography-in-madurai",
          }),
        }}
      />      
      <h1 className="text-4xl font-bold mb-6">
        Engagement Photography in Madurai
      </h1>

      <p className="mb-6">
        Kutti Story Photography provides professional engagement photography in
        Madurai, capturing every smile, emotion and celebration before your
        wedding day. We create timeless memories through candid and creative
        photography.
      </p>
      <section className="mt-10">
        <h2 className="text-3xl font-bold mb-4">
          Why Choose Kutti Story Photography for Engagement Photography?
        </h2>

        <p className="leading-8">
          Your engagement is one of the most memorable milestones before your
          wedding. At Kutti Story Photography, we capture genuine emotions,
          beautiful couple portraits, family celebrations, and every meaningful
          moment with a creative and cinematic approach. Our experienced team
          combines candid photography, artistic compositions, and professional
          editing to create timeless engagement memories you'll cherish forever.
        </p>
      </section>

      <p className="leading-8 mt-6">
        An engagement ceremony marks the beginning of your wedding journey, and
        every smile, exchange of rings, blessing, and celebration deserves to be
        remembered. Our photographers focus on capturing authentic expressions,
        emotional family moments, elegant couple portraits, and vibrant
        celebrations, creating a timeless collection of memories that reflects
        your unique love story.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Our Engagement Photography Services
      </h2>

      <ul className="list-disc pl-6 space-y-2">
        <li>Candid Engagement Photography</li>
        <li>Traditional Engagement Coverage</li>
        <li>Couple Portrait Sessions</li>
        <li>Cinematic Engagement Videos</li>
        <li>Family Group Photography</li>
      </ul>

      <section className="mt-10">
        <h2 className="text-3xl font-bold mb-4">
          Our Engagement Photography Packages
        </h2>

        <p className="leading-8">
          We offer flexible engagement photography packages that can include
          candid photography, traditional photography, cinematic engagement
          videography, couple portraits, family photography, drone coverage,
          premium albums, and professionally edited photos. Every package can be
          customized to match your event, venue, and budget.
        </p>
      </section>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Popular Engagement Venues in Madurai
      </h2>

      <p className="leading-8">
        Our team covers engagement ceremonies at wedding halls, luxury hotels,
        resorts, temples, outdoor venues, and private event spaces throughout
        Madurai and across Tamil Nadu. Whether your celebration is intimate or
        grand, we ensure every important moment is captured beautifully.
      </p>

      <section className="mt-12">
        <h2 className="text-3xl font-bold mb-6">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6">

          <div>
            <h3 className="text-xl font-semibold">
              Do you provide engagement videography?
            </h3>

            <p className="mt-2 leading-8">
              Yes. We provide both professional engagement photography and cinematic
              engagement videography to beautifully capture every special moment of
              your ceremony.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">
              Can we book engagement and wedding photography together?
            </h3>

            <p className="mt-2 leading-8">
              Absolutely. We offer combined engagement and wedding photography
              packages with flexible options based on your events and budget.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">
              Do you travel outside Madurai?
            </h3>

            <p className="mt-2 leading-8">
              Yes. We provide engagement photography services across Tamil Nadu,
              Kerala, Bangalore, Pondicherry, and destination locations throughout
              India.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">
              How many edited photos will we receive?
            </h3>

            <p className="mt-2 leading-8">
              The number of edited photos depends on your selected package. Every
              image is professionally color-corrected and edited to deliver the best
              possible quality.
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