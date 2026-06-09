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
    <section className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white px-6 md:px-20 py-24">
      {/* Header */}
      <div className="mb-16">
        <p className="text-blue-500 text-sm font-medium mb-2">{subheading}</p>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {heading.split(" ").slice(0, -2).join(" ")} <br />
          {heading.split(" ").slice(-2).join(" ")}
        </h1>
        <p className="text-zinc-400 max-w-xl">{description}</p>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-16">
        {/* Category Sidebar */}
        <div className="space-y-4">
          {categories.map((cat) => (
            <button
              key={cat.category}
              onClick={() => setActiveCategory(cat.category)}
              className={`w-full text-left px-6 py-3 rounded-full transition ${
                activeCategory === cat.category
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              {cat.category}
            </button>
          ))}
        </div>

        {/* Accordion */}
        <div className="divide-y divide-zinc-800">
          {currentItems.map((item, index) => (
            <div key={index} className="py-6">
              <button
                onClick={() => setActiveIndex(index === activeIndex ? -1 : index)}
                className="w-full flex justify-between items-center text-left"
              >
                <h3 className="text-lg md:text-xl font-semibold">{item.question}</h3>
                <span className="text-2xl text-zinc-400 shrink-0 ml-4">
                  {activeIndex === index ? "×" : "+"}
                </span>
              </button>
              <div
                ref={(el) => { contentRefs.current[index] = el; }}
                className="overflow-hidden h-0 opacity-0"
              >
                <p className="pt-4 text-zinc-400 max-w-3xl">{item.answer}</p>
              </div>
            </div>
          ))}

          {currentItems.length === 0 && (
            <p className="py-12 text-zinc-600 text-center">No questions in this category yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}