import Link from "next/link";

export const metadata = {
  title: "Best Wedding Venues in Madurai | Kutti Story Photography",
  description:
    "Discover the best wedding venues in Madurai for traditional Tamil weddings, receptions and destination celebrations.",
};

export default function BestWeddingVenuesPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold mb-6">
        Best Wedding Venues in Madurai
      </h1>

      <p className="mb-6">
        Madurai is home to some of the finest wedding venues in Tamil Nadu.
        From luxury hotels to traditional marriage halls, couples have many
        options for hosting unforgettable weddings.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Popular Wedding Venues
      </h2>

      <ul className="list-disc pl-6 space-y-2">
        <li>Sterling V Grand Madurai</li>
        <li>Poppys Hotel Madurai</li>
        <li>Heritage Madurai</li>
        <li>Temple City Convention Hall</li>
        <li>Various Traditional Marriage Halls</li>
      </ul>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Choosing the Right Venue
      </h2>

      <p>
        Consider guest capacity, parking, accessibility, stage setup,
        lighting and photography opportunities when selecting your venue.
      </p>

      <div className="mt-10">
        <Link href="/best-wedding-photographer-in-madurai" className="text-amber-500 underline">
          Looking for a Wedding Photographer?
        </Link>
      </div>
    </main>
  );
}