import Link from "next/link";

export const metadata = {
  title: "Birthday Photography in Madurai | Kutti Story Photography",
  description:
    "Professional birthday photography in Madurai. Capture unforgettable birthday celebrations with candid photography and videography by Kutti Story Photography.",
};

export default function BirthdayPhotographyPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold mb-6">
        Birthday Photography in Madurai
      </h1>

      <p className="mb-6">
        Kutti Story Photography provides professional birthday photography in
        Madurai for kids, adults and family celebrations. We capture every
        smile, cake cutting moment and joyful memory through creative
        photography and videography.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Birthday Celebration Photography
      </h2>

      <p>
        Every birthday is special. Our team captures candid moments, family
        interactions and memorable highlights that make your celebration
        unforgettable.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Our Birthday Photography Services
      </h2>

      <ul className="list-disc pl-6 space-y-2">
        <li>Kids Birthday Photography</li>
        <li>First Birthday Photoshoots</li>
        <li>Birthday Videography</li>
        <li>Family Portrait Sessions</li>
        <li>Theme Birthday Photography</li>
        <li>Birthday Event Coverage</li>
      </ul>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Frequently Asked Questions
      </h2>

      <h3 className="text-xl font-semibold mt-6">
        Do you cover first birthday celebrations?
      </h3>

      <p>
        Yes. We provide photography and videography coverage for first
        birthdays and milestone celebrations.
      </p>

      <h3 className="text-xl font-semibold mt-6">
        Do you provide birthday videos?
      </h3>

      <p>
        Yes. We create cinematic birthday highlight videos and complete
        event coverage.
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