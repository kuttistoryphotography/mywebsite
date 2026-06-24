import Link from "next/link";

export const metadata = {
  title: "Pre Wedding Photography in Madurai | Kutti Story Photography",
  description:
    "Professional pre wedding photography in Madurai. Capture your love story with creative pre wedding photoshoots by Kutti Story Photography.",
};

export default function PreWeddingPhotographyPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold mb-6">
        Pre Wedding Photography in Madurai
      </h1>

      <p className="mb-6">
        Looking for the best pre wedding photography in Madurai? Kutti Story
        Photography creates beautiful and creative pre wedding photoshoots that
        capture your love story before the wedding day.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Creative Pre Wedding Photoshoots
      </h2>

      <p>
        Our team specializes in cinematic pre wedding photography, outdoor
        couple shoots, destination pre wedding sessions and storytelling
        photography that reflects your unique relationship.
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

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Frequently Asked Questions
      </h2>

      <h3 className="text-xl font-semibold mt-6">
        When should we do a pre wedding shoot?
      </h3>

      <p>
        Most couples schedule their pre wedding shoot 1–3 months before the
        wedding.
      </p>

      <h3 className="text-xl font-semibold mt-6">
        Do you help with shoot concepts?
      </h3>

      <p>
        Yes. We help with themes, locations, poses and styling ideas.
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