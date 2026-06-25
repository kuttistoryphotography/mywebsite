import Link from "next/link";

export default function SEOInternalLinks() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-10">

        <h2 className="text-3xl font-bold text-white mb-6">
          Wedding Photography Services in Madurai
        </h2>

        <p className="text-zinc-300 mb-8">
          Explore our professional photography and videography services
          across Madurai and Tamil Nadu.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

          <Link
            href="/best-wedding-photographer-in-madurai"
            className="text-amber-400 hover:text-amber-300"
          >
            Best Wedding Photographer in Madurai
          </Link>

          <Link
            href="/candid-wedding-photographer-in-madurai"
            className="text-amber-400 hover:text-amber-300"
          >
            Candid Wedding Photographer in Madurai
          </Link>

          <Link
            href="/pre-wedding-photography-in-madurai"
            className="text-amber-400 hover:text-amber-300"
          >
            Pre Wedding Photography in Madurai
          </Link>

          <Link
            href="/engagement-photography-in-madurai"
            className="text-amber-400 hover:text-amber-300"
          >
            Engagement Photography in Madurai
          </Link>

          <Link
            href="/wedding-videography-in-madurai"
            className="text-amber-400 hover:text-amber-300"
          >
            Wedding Videography in Madurai
          </Link>

          <Link
            href="/wedding-photography-and-videography-in-madurai"
            className="text-amber-400 hover:text-amber-300"
          >
            Wedding Photography & Videography
          </Link>

        </div>

      </div>
    </section>
  );
}