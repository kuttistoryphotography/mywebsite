import Link from "next/link";

export const metadata = {
  title: "Candid Wedding Photographer in Madurai | Kutti Story Photography",
  description:
    "Looking for candid wedding photography in Madurai? Kutti Story Photography captures natural emotions, genuine moments and beautiful wedding stories.",
};

export default function CandidWeddingPhotographerPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold mb-6">
        Candid Wedding Photographer in Madurai
      </h1>

      <p className="mb-6">
        Kutti Story Photography specializes in candid wedding photography in
        Madurai, capturing genuine emotions, natural expressions and timeless
        memories. Our candid photography style focuses on real moments rather
        than posed photographs.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Why Choose Candid Wedding Photography?
      </h2>

      <p>
        Candid photography captures authentic emotions and beautiful moments
        naturally. From bride and groom reactions to family celebrations,
        every moment tells a unique story.
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
        Candid wedding photography captures real emotions and natural moments
        without forced poses.
      </p>

      <h3 className="text-xl font-semibold mt-6">
        Do you provide candid wedding videography?
      </h3>

      <p>
        Yes. We offer cinematic wedding films and candid wedding videography.
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