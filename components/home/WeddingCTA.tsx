import Link from "next/link";

export default function WeddingCTA() {
  return (
    <section className="bg-black py-24">
      <div className="max-w-6xl mx-auto px-6">

        <div className="border border-zinc-800 rounded-3xl bg-zinc-900 p-12 text-center">

          <span className="uppercase tracking-[0.3em] text-red-500 text-sm">
            Kutti Story Photography
          </span>

          <h2 className="text-5xl font-bold text-white mt-6">
            Best Wedding Photographer
            <br />
            in Madurai
          </h2>

          <p className="text-zinc-400 max-w-3xl mx-auto mt-8 leading-8">
            We specialize in candid wedding photography, cinematic wedding
            videography, traditional Tamil wedding photography, engagement
            shoots, pre wedding photography and luxury wedding albums across
            Madurai and Tamil Nadu.
          </p>

          <div className="flex flex-wrap justify-center gap-5 mt-12">

            <Link
              href="/best-wedding-photographer-in-madurai"
              className="px-8 py-4 bg-white text-black rounded-full font-semibold hover:bg-zinc-200 transition"
            >
              Explore Wedding Photography
            </Link>

            <Link
              href="/contact-us"
              className="px-8 py-4 border border-white rounded-full text-white hover:bg-white hover:text-black transition"
            >
              Book Now
            </Link>

          </div>

        </div>

      </div>
    </section>
  );
}