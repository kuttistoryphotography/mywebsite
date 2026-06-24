import Link from "next/link";

export const metadata = {
  title: "Top Wedding Trends in Tamil Nadu | Kutti Story Photography",
  description:
    "Discover the latest wedding trends in Tamil Nadu including candid photography, cinematic wedding films, destination weddings and creative decor ideas.",
};

export default function TopWeddingTrendsPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold mb-6">
        Top Wedding Trends in Tamil Nadu
      </h1>

      <p className="mb-6">
        Weddings in Tamil Nadu are evolving with modern trends while
        preserving traditional values. Here are some of the most popular
        wedding trends couples are choosing today.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        1. Candid Wedding Photography
      </h2>

      <p>
        Couples prefer natural emotions and storytelling photographs instead
        of traditional posed images.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        2. Cinematic Wedding Films
      </h2>

      <p>
        Cinematic wedding videos with professional editing, music and drone
        shots are becoming increasingly popular.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        3. Pre Wedding Photoshoots
      </h2>

      <p>
        Couples are choosing destination locations and creative concepts for
        pre wedding photography sessions.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        4. Personalized Wedding Decor
      </h2>

      <p>
        Customized stages, floral themes and unique color palettes are
        trending across Tamil Nadu weddings.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        5. Drone Wedding Coverage
      </h2>

      <p>
        Aerial shots add a cinematic touch and provide stunning perspectives
        of wedding venues and celebrations.
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