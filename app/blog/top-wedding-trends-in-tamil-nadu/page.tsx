import Link from "next/link";

export const metadata = {
  title: "Top Wedding Trends in Tamil Nadu | Kutti Story Photography",
  description:
    "Discover the latest wedding trends in Tamil Nadu including candid photography, cinematic wedding films and destination weddings.",
};

export default function Page() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold mb-6">
        Top Wedding Trends in Tamil Nadu
      </h1>

      <p>
        Modern Tamil weddings combine tradition with creativity.
        Couples now prefer candid photography, cinematic films,
        drone coverage and destination wedding experiences.
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