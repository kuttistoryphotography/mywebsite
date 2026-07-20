import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best Wedding Photography in Madurai | Kutti Story Photography",
  description:
    "Looking for the best wedding photography in Madurai? Kutti Story Photography offers candid wedding photography, cinematic wedding films, engagement photography, and traditional Tamil wedding photography.",
  alternates: {
    canonical:
      "https://www.kuttistoryphotography.com/wedding-photography-madurai",
  },
};

export default function WeddingPhotographyMadurai() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-24 text-white">
      <h1 className="text-5xl font-bold mb-8">
        Best Wedding Photography in Madurai
      </h1>

      <p className="text-lg leading-8 text-gray-300">
        Welcome to Kutti Story Photography. We specialize in candid wedding
        photography, cinematic wedding films, traditional Tamil wedding
        photography, engagement photography, and pre-wedding shoots across
        Madurai and Tamil Nadu.
      </p>
    </main>
  );
}