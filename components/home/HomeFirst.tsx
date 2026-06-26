"use client";


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

interface HomeFirstProps {
  settings: {
    hero: HeroData;
  };
}

export default function HomeFirst({ settings }: HomeFirstProps) {


  return (
    <>
      <Hero hero={settings.hero} />

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