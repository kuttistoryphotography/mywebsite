import Link from "next/link";

interface SEOHeroProps {
  title: string;
  description: string;
  image: string;
}

export default function SEOHero({
  title,
  description,
  image,
}: SEOHeroProps) {
  return (
    <section
      className="relative min-h-[90vh] flex items-center bg-black overflow-hidden"
    >
      {/* Background */}

      <img
        src={image}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover opacity-40"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">

        <p className="uppercase tracking-[0.3em] text-red-500 mb-6">
          Kutti Story Photography
        </p>

        <h1 className="text-white text-6xl font-light leading-tight max-w-3xl">
          {title}
        </h1>

        <p className="text-zinc-300 text-lg mt-8 max-w-2xl leading-8">
          {description}
        </p>

        <div className="flex gap-5 mt-10">

          <Link
            href="/booking"
            className="bg-white text-black px-8 py-4 rounded-full font-semibold"
          >
            Book Now
          </Link>

          <Link
            href="/works"
            className="border border-white text-white px-8 py-4 rounded-full"
          >
            View Portfolio
          </Link>

        </div>

      </div>
    </section>
  );
}