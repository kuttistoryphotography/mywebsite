import Link from "next/link";
import Script from "next/script";
import type { Metadata } from "next";


export const metadata: Metadata = {
  title:
    "Wedding Photography and Videography in Madurai | Kutti Story Photography",

  description:
    "Kutti Story Photography offers complete wedding photography and videography services in Madurai including candid wedding photography, cinematic wedding films, drone coverage, traditional wedding photography and premium wedding albums.",

  keywords: [
    "Wedding Photography and Videography in Madurai",
    "Wedding Photographer Madurai",
    "Candid Wedding Photography Madurai",
    "Cinematic Wedding Films Madurai",
    "Wedding Videography Madurai",
    "Drone Wedding Coverage Madurai",
    "Traditional Wedding Photography Madurai",
    "Kutti Story Photography"
  ],

  alternates: {
    canonical:
      "https://www.kuttistoryphotography.com/wedding-photography-and-videography-in-madurai",
  },

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title:
      "Wedding Photography and Videography in Madurai | Kutti Story Photography",

    description:
      "Complete wedding photography and cinematic videography services in Madurai by Kutti Story Photography.",

    url:
      "https://www.kuttistoryphotography.com/wedding-photography-and-videography-in-madurai",

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
          "Wedding Photography and Videography in Madurai - Kutti Story Photography",
      },
    ],
  },

  twitter: {
    card:
      "summary_large_image",

    title:
      "Wedding Photography and Videography in Madurai",

    description:
      "Professional wedding photography and cinematic wedding films in Madurai by Kutti Story Photography.",

    images: [
      "https://www.kuttistoryphotography.com/01.webp",
    ],
  },
};

export default function WeddingPhotographyVideographyPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <Script
        id="wedding-photo-video-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
        __html: JSON.stringify({
        "@context":"https://schema.org",
        "@type":"Service",

        "name":
        "Wedding Photography and Videography in Madurai",

        "provider":{
        "@type":"LocalBusiness",

        "name":
        "Kutti Story Photography",

        "url":
        "https://www.kuttistoryphotography.com",

        "telephone":
        "+91 9342013600",

        "address":{
        "@type":"PostalAddress",

        "streetAddress":
        "52/32 South Mada Street, Near Koodal Azhagar Perumal Temple",

        "addressLocality":
        "Madurai",

        "addressRegion":
        "Tamil Nadu",

        "postalCode":
        "625001",

        "addressCountry":
        "IN"
        }
        },

        "areaServed":
        "Madurai",

        "serviceType":
        "Wedding Photography and Videography",

        "description":
        "Complete wedding photography, candid photography, cinematic wedding films, drone coverage and traditional wedding coverage in Madurai."
        })
        }}
        />
      <h1 className="text-4xl font-bold mb-6">
        Wedding Photography and Videography in Madurai
      </h1>

      <p className="mb-6">
        Kutti Story Photography offers complete wedding photography and
        videography services in Madurai. From candid wedding photography
        to cinematic wedding films, we capture every moment of your special day.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Complete Wedding Coverage
      </h2>

      <p>
        Our team provides photography, videography, drone coverage,
        wedding teaser videos, cinematic highlight films and premium
        wedding albums to preserve your memories forever.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Services Included
      </h2>

      <ul className="list-disc pl-6 space-y-2">
        <li>Candid Wedding Photography</li>
        <li>Traditional Wedding Photography</li>
        <li>Cinematic Wedding Videography</li>
        <li>Drone Wedding Coverage</li>
        <li>Wedding Teaser Videos</li>
        <li>Wedding Highlight Films</li>
        <li>Pre Wedding Photography</li>
        <li>Engagement Photography</li>
      </ul>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Why Choose Kutti Story Photography?
      </h2>

      <p>
        We combine storytelling, creativity and professional equipment
        to deliver stunning wedding photographs and cinematic wedding films
        that couples cherish for a lifetime.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Frequently Asked Questions
      </h2>

      <h3 className="text-xl font-semibold mt-6">
        Do you offer both photography and videography packages?
      </h3>

      <p>
        Yes. We provide complete wedding photography and videography
        packages customized to your requirements.
      </p>

      <h3 className="text-xl font-semibold mt-6">
        Is drone coverage available?
      </h3>

      <p>
        Yes. Drone coverage is available for weddings, receptions
        and destination weddings.
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