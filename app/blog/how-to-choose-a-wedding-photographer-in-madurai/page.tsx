import Link from "next/link";

export const metadata = {
  title: "How to Choose a Wedding Photographer in Madurai | Kutti Story Photography",
  description:
    "Learn how to choose the best wedding photographer in Madurai with expert tips on style, experience, packages and portfolio review.",
};

export default function ChooseWeddingPhotographerPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold mb-6">
        How to Choose a Wedding Photographer in Madurai
      </h1>

      <p className="mb-6">
        Choosing the right wedding photographer is one of the most important
        decisions for your wedding. Your photographs will preserve memories
        for a lifetime, making it essential to select an experienced and
        creative photography team.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        1. Review Their Portfolio
      </h2>

      <p>
        Always check previous wedding albums, candid photographs and
        cinematic wedding films to understand the photographer's style.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        2. Check Experience
      </h2>

      <p>
        An experienced wedding photographer knows how to handle lighting,
        ceremonies, crowds and emotional moments.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        3. Understand the Packages
      </h2>

      <p>
        Compare photography, videography, drone coverage, albums and
        editing services before making a decision.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        4. Read Client Reviews
      </h2>

      <p>
        Google reviews and client testimonials can provide valuable insights
        into service quality and customer satisfaction.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Why Choose Kutti Story Photography?
      </h2>

      <p>
        Kutti Story Photography specializes in candid wedding photography,
        cinematic wedding films and traditional Tamil wedding coverage
        across Madurai and Tamil Nadu.
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