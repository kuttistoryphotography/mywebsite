"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { Loader2 } from "lucide-react";

interface FaqItem     { question: string; answer: string }
interface FaqCategory { category: string; items: FaqItem[] }

const DEFAULT: FaqCategory[] = [
  {
    category: "Wedding Photography",
    items: [
      { question: "What is included in your wedding photography package?", answer: "Our wedding photography packages include candid photography, traditional photography, couple portraits, group photos, and full-event coverage." },
      { question: "How early should we book for our wedding date?",        answer: "We recommend booking at least 2–3 months in advance because popular dates fill up quickly." },
    ],
  },
];

export default function FaqAccordion() {
  const [categories,      setCategories]      = useState<FaqCategory[]>(DEFAULT);
  const [heading,         setHeading]         = useState("Frequently Asked Questions");
  const [subheading,      setSubheading]      = useState("FAQs");
  const [description,     setDescription]     = useState("Everything you need to know about our photography services.");
  const [activeCategory,  setActiveCategory]  = useState("");
  const [activeIndex,     setActiveIndex]     = useState(0);
  const [loading,         setLoading]         = useState(true);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    fetch("/api/faq")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          const s = data.settings;
          if (s.heading)     setHeading(s.heading);
          if (s.subheading)  setSubheading(s.subheading);
          if (s.description) setDescription(s.description);
          if (Array.isArray(s.categories) && s.categories.length) {
            setCategories(s.categories);
            setActiveCategory(s.categories[0].category);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Reset open item when category changes
  useEffect(() => { setActiveIndex(0); }, [activeCategory]);

  useEffect(() => {
    contentRefs.current.forEach((el, index) => {
      if (!el) return;
      if (index === activeIndex) {
        gsap.to(el, { height: el.scrollHeight, opacity: 1, duration: 0.4, ease: "power2.out" });
      } else {
        gsap.to(el, { height: 0, opacity: 0, duration: 0.3, ease: "power2.inOut" });
      }
    });
  }, [activeIndex, activeCategory]);

  const currentItems = categories.find((c) => c.category === activeCategory)?.items ?? [];

  if (loading) {
    return (
      <section className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-black text-white px-6 py-20">
      <div className="w-full max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="mb-12">
          <p className="text-blue-500 text-sm font-medium">
            {subheading}
          </p>

          <h1 className="text-5xl md:text-6xl font-bold mt-2">
            {heading.split(" ").slice(0, -2).join(" ")}
            <br />
            {heading.split(" ").slice(-2).join(" ")}
          </h1>

          <p className="text-zinc-400 mt-4">
            {description}
          </p>
        </div>

        {/* CENTER FAQ BOX */}
        <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">

          <div className="grid md:grid-cols-[280px_1fr] gap-0">

            {/* Category Sidebar */}
            <div className="p-6 border-r border-zinc-800">
              {/* your existing category buttons */}
            </div>

            {/* Accordion */}
            <div className="p-8 md:p-10">
              {/* your existing accordion */}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}