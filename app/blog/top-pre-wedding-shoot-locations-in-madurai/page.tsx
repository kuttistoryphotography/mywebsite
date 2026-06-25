import Link from "next/link";

export const metadata = {
  title: "Top Pre Wedding Shoot Locations in Madurai | Kutti Story Photography",
  description:
    "Explore the best pre wedding shoot locations in Madurai for stunning and memorable couple photography sessions.",
};

export default function PreWeddingLocationsPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold mb-6">
        Top Pre Wedding Shoot Locations in Madurai
      </h1>

      <p className="mb-6">
        Madurai offers beautiful locations for pre wedding photography.
        From heritage architecture to scenic outdoor locations, couples
        can create memorable photographs before their wedding day.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Best Locations for Pre Wedding Shoots
      </h2>

      <ul className="list-disc pl-6 space-y-2">
        <li>Meenakshi Amman Temple Surroundings</li>
        <li>Heritage Madurai Resort</li>
        <li>Vaigai River View Areas</li>
        <li>Eco Parks and Gardens</li>
        <li>Hill Stations Near Madurai</li>
        <li>Destination Beach Locations</li>
      </ul>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Tips for a Perfect Pre Wedding Shoot
      </h2>

      <ul className="list-disc pl-6 space-y-2">
        <li>Choose outfits that match the location.</li>
        <li>Schedule during sunrise or sunset.</li>
        <li>Plan multiple looks for variety.</li>
        <li>Work with an experienced photography team.</li>
      </ul>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Why Choose Kutti Story Photography?
      </h2>

      <p>
        Our team specializes in creative pre wedding photography,
        cinematic storytelling and location planning to make every
        couple's photoshoot unique.
      </p>

      <div className="mt-10">
        <Link
          href="/pre-wedding-photography-in-madurai"
          className="text-amber-500 underline"
        >
          Explore Our Pre Wedding Photography Services
        </Link>
      </div>
    </main>
  );
}