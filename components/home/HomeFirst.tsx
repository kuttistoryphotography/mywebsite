"use client";

import Hero from "./Hero";
import AboutSection from "./AboutSection";
import WeddingShowcase from "./WeddingShowcase";
import PhilosophySection from "./PhilosophySection";
import FeaturedWork from "./FeaturedWork";
import StatsCardsSection from "./StatsCardsSection";
import StoriesSection from"./StoriesSection";

export default function HomeFirst() {
  return (
    <>
      <Hero />

      {/* SEO Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-white">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Best Wedding Photographer in Madurai | Kutti Story Photography
        </h1>

        <p className="text-gray-300 leading-8 text-lg">
          Kutti Story Photography is a professional wedding photography company in
          Madurai specializing in candid wedding photography, cinematic wedding
          films, traditional Tamil wedding photography, engagement photography,
          pre-wedding shoots, post-wedding photography, maternity photography,
          baby photography, and destination weddings across Tamil Nadu.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href="/wedding-photography-madurai"
            className="px-5 py-3 rounded-full border border-white/20 hover:bg-white hover:text-black transition"
          >
            Wedding Photography
          </a>

          <a
            href="/candid-wedding-photography-madurai"
            className="px-5 py-3 rounded-full border border-white/20 hover:bg-white hover:text-black transition"
          >
            Candid Photography
          </a>

          <a
            href="/engagement-photography-madurai"
            className="px-5 py-3 rounded-full border border-white/20 hover:bg-white hover:text-black transition"
          >
            Engagement
          </a>

          <a
            href="/pre-wedding-photography-madurai"
            className="px-5 py-3 rounded-full border border-white/20 hover:bg-white hover:text-black transition"
          >
            Pre Wedding
          </a>
        </div>
      </section>

      <AboutSection />
      <WeddingShowcase />
      <PhilosophySection />
      <FeaturedWork />
      <StatsCardsSection />
      <StoriesSection />
    </>

  );
}
