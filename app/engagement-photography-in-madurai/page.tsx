import Link from "next/link";

export const metadata = {
  title: "Engagement Photography in Madurai | Kutti Story Photography",
  description:
    "Professional engagement photography in Madurai. Capture your special engagement moments with creative and candid photography by Kutti Story Photography.",
};

export default function EngagementPhotographyPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold mb-6">
        Engagement Photography in Madurai
      </h1>

      <p className="mb-6">
        Kutti Story Photography provides professional engagement photography in
        Madurai, capturing every smile, emotion and celebration before your
        wedding day. We create timeless memories through candid and creative
        photography.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Why Choose Our Engagement Photography?
      </h2>

      <p>
        Engagement ceremonies are the beginning of your wedding journey. Our
        team captures every special moment with artistic photography and
        cinematic storytelling.
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

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Popular Engagement Venues in Madurai
      </h2>

      <p>
        We cover engagement ceremonies in wedding halls, hotels, resorts and
        event venues across Madurai and Tamil Nadu.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Frequently Asked Questions
      </h2>

      <h3 className="text-xl font-semibold mt-6">
        Do you provide engagement videography?
      </h3>

      <p>
        Yes. We provide both photography and cinematic videography for
        engagement functions.
      </p>

      <h3 className="text-xl font-semibold mt-6">
        Can we book engagement and wedding photography together?
      </h3>

      <p>
        Yes. We offer combined engagement and wedding photography packages.
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