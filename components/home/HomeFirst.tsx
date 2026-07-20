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
        <h2 className="text-4xl font-bold mb-6">
          Best Wedding Photography in Madurai
        </h2>

        <p className="text-gray-300 leading-8 text-lg">
          Kutti Story Photography is a professional wedding photography company in
          Madurai specializing in candid wedding photography, cinematic wedding
          films, traditional Tamil wedding photography, engagement photography,
          pre-wedding shoots, post-wedding photography, maternity photography,
          baby photography, and destination weddings across Tamil Nadu.
        </p>

        <p className="mt-6 text-gray-300 leading-8 text-lg">
          Our goal is to capture genuine emotions, beautiful moments, and timeless
          memories through creative storytelling. From intimate ceremonies to
          grand celebrations, we provide professional photography and videography
          services that preserve every special moment of your wedding day.
        </p>
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
