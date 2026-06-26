"use client";

import BlogSection from "../../components/blog/BlogSection";

export default function BlogPage() {
  return (
    <>
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Wedding Photography Blog in Madurai
        </h1>

        <p className="text-lg text-gray-600 leading-8 mb-6">
          Welcome to the official Kutti Story Photography blog. Here we share
          expert wedding photography tips, candid photography ideas, pre-wedding
          inspiration, engagement planning advice, venue recommendations, and
          photography guides for couples across Madurai and Tamil Nadu.
        </p>

        <p className="text-lg text-gray-600 leading-8 mb-6">
          Whether you are planning a traditional Tamil wedding, destination
          wedding, maternity shoot, baby shower, or engagement session, our
          articles help you understand photography styles, pricing, timelines,
          locations, and how to prepare for your special day.
        </p>

        <p className="text-lg text-gray-600 leading-8">
          Browse our latest articles below and discover practical photography
          tips, creative pose ideas, wedding checklists, and inspiration from
          real weddings captured by Kutti Story Photography.
        </p>
      </section>

      <BlogSection />
    </>
  );
}