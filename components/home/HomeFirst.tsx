"use client";

import { useEffect, useState } from "react";

import Hero from "./Hero";
import AboutSection from "./AboutSection";
import WeddingShowcase from "./WeddingShowcase";
import PhilosophySection from "./PhilosophySection";
import FeaturedWork from "./FeaturedWork";
import StatsCardsSection from "./StatsCardsSection";
import StoriesSection from "./StoriesSection";
import WeddingCTA from "./WeddingCTA";

interface HeroData {
  backgroundImage: string;
  heading: string;
  subheading: string;
  paragraph: string;
  badgeText: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  statsYears: string;
  statsStories: string;
  statsPassion: string;
  heroCardImage: string;
  awardText: string;
}

export default function HomeFirst() {
  const [hero, setHero] = useState<HeroData | null>(null);

  useEffect(() => {
    fetch("/api/homepage", {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((data) => {
        setHero(data.settings.hero);
      });
  }, []);

  if (!hero) {
    return (
      <section className="min-h-screen bg-[#0a0a0a]"></section>
    );
  }

  return (
    <>
      <Hero hero={hero} />

      <AboutSection />
      <WeddingShowcase />
      <PhilosophySection />
      <FeaturedWork />
      <StatsCardsSection />
      <StoriesSection />
      <WeddingCTA />
    </>
  );
}