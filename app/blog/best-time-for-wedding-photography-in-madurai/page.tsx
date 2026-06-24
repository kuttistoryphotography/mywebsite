import Link from "next/link";

export const metadata = {
  title: "Best Time for Wedding Photography in Madurai | Kutti Story Photography",
  description:
    "Discover the best time for wedding photography in Madurai, including golden hour photography, seasonal tips and ideal wedding shoot timings.",
};

export default function BestTimeWeddingPhotographyPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold mb-6">
        Best Time for Wedding Photography in Madurai
      </h1>

      <p className="mb-6">
        Timing plays a major role in creating stunning wedding photographs.
        Choosing the right time of day can improve lighting, colors and the
        overall beauty of your wedding images.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Golden Hour Photography
      </h2>

      <p>
        The golden hour, shortly after sunrise and before sunset, provides
        soft natural light that creates beautiful wedding portraits and
        romantic couple photographs.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Best Seasons for Wedding Photography
      </h2>

      <ul className="list-disc pl-6 space-y-2">
        <li>November to February – Pleasant Weather</li>
        <li>March to June – Bright Natural Light</li>
        <li>July to October – Greenery and Monsoon Beauty</li>
      </ul>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Indoor and Outdoor Photography
      </h2>

      <p>
        Outdoor photography benefits from natural lighting, while indoor
        photography requires professional lighting setups for the best
        results.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Why Choose Kutti Story Photography?
      </h2>

      <p>
        Our team understands lighting, locations and timing to create
        beautiful wedding photographs and cinematic wedding films.
      </p>

      <div className="mt-10">
        <Link
          href="/best-wedding-photographer-in-madurai"
          className="text-amber-500 underline"
        >
          Explore Our Wedding Photography Services
        </Link>
      </div>
    </main>
  );
}