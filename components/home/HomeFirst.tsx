"use client";

import Hero from "./Hero";
import AboutSection from "./AboutSection";
import WeddingShowcase from "./WeddingShowcase";
import PhilosophySection from "./PhilosophySection";
import FeaturedWork from "./FeaturedWork";
import StatsCardsSection from "./StatsCardsSection";
import StoriesSection from"./StoriesSection";
import BlogSection from "../blog/BlogSection";


export default function HomeFirst() {
  return (
    <>
    

      <Hero />
      <AboutSection />
      <WeddingShowcase />
      <PhilosophySection />
      <FeaturedWork />
      <StatsCardsSection />
      <StoriesSection  />
      <StoriesSection />
      <BlogSection limit={4} />


      
    </>
  );
}
