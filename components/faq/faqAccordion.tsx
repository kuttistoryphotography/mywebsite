"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  category: string;
  items: FaqItem[];
}

const DEFAULT: FaqCategory[] = [
  {
    category: "Wedding Photography",
    items: [
      {
        question: "What is included in your wedding photography package?",
        answer:
          "Our wedding photography packages include candid photography, traditional photography, couple portraits, group photos, and full-event coverage.",
      },
      {
        question: "How early should we book for our wedding date?",
        answer:
          "We recommend booking at least 2–3 months in advance because popular dates fill up quickly.",
      },
    ],
  },
];

export default function FaqAccordion() {
  const [categories, setCategories] = useState<FaqCategory[]>(DEFAULT);

  const [heading, setHeading] = useState(
    "Frequently Asked Questions"
  );

  const [subheading, setSubheading] = useState("FAQs");

  const [description, setDescription] = useState(
    "Everything you need to know about our photography services."
  );

  // FIX: Start with first category instead of empty
  const [activeCategory, setActiveCategory] = useState(
    DEFAULT[0]?.category || ""
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

  /* ─────────────────────────────
     FETCH FAQ DATA
  ───────────────────────────── */

  useEffect(() => {
    fetch("/api/faq")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          const s = data.settings;

          if (s.heading) {
            setHeading(s.heading);
          }

          if (s.subheading) {
            setSubheading(s.subheading);
          }

          if (s.description) {
            setDescription(s.description);
          }

          if (
            Array.isArray(s.categories) &&
            s.categories.length > 0
          ) {
            setCategories(s.categories);
            setActiveCategory(s.categories[0].category);
          }
        }
      })
      .catch(() => {
        // Keep default FAQ if API fails
        setCategories(DEFAULT);
        setActiveCategory(DEFAULT[0]?.category || "");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  /* ─────────────────────────────
     RESET OPEN QUESTION
  ───────────────────────────── */

  useEffect(() => {
    setActiveIndex(0);
  }, [activeCategory]);

  /* ─────────────────────────────
     GSAP ACCORDION ANIMATION
  ───────────────────────────── */

  useEffect(() => {
    contentRefs.current.forEach((el, index) => {
      if (!el) return;

      if (index === activeIndex) {
        gsap.to(el, {
          height: el.scrollHeight,
          opacity: 1,
          duration: 0.4,
          ease: "power2.out",
        });
      } else {
        gsap.to(el, {
          height: 0,
          opacity: 0,
          duration: 0.3,
          ease: "power2.inOut",
        });
      }
    });
  }, [activeIndex, activeCategory]);

  const currentItems =
    categories.find(
      (c) => c.category === activeCategory
    )?.items ?? [];

  /* ─────────────────────────────
     LOADING
  ───────────────────────────── */

  if (loading) {
    return (
      <section className="min-h-screen bg-black text-white px-6 py-20">
        <div className="w-full max-w-[1400px] mx-auto">
          <div className="animate-pulse">
            <div className="h-4 w-12 bg-zinc-800 rounded mb-4" />
            <div className="h-12 w-96 bg-zinc-800 rounded mb-4" />
            <div className="h-4 w-96 bg-zinc-800 rounded" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-black text-white px-6 py-20">
      <div className="w-full max-w-[1400px] mx-auto">

        {/* ─────────────────────────
            HEADER
        ───────────────────────── */}

        <div className="mb-12">
          <p className="text-blue-500 text-sm font-medium">
            {subheading}
          </p>

          <h1 className="text-5xl md:text-6xl font-bold mt-2 leading-tight">
            {heading.split(" ").slice(0, -2).join(" ")}
            <br />
            {heading.split(" ").slice(-2).join(" ")}
          </h1>

          <p className="text-zinc-400 mt-4">
            {description}
          </p>
        </div>

        {/* ─────────────────────────
            CENTER FAQ BOX
        ───────────────────────── */}

        <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">

          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">

            {/* ─────────────────────
                CATEGORY SIDEBAR
            ───────────────────── */}

            <div className="p-6 border-b md:border-b-0 md:border-r border-zinc-800">
              <div className="space-y-3">

                {categories.map((cat) => (
                  <button
                    key={cat.category}
                    onClick={() => {
                      setActiveCategory(cat.category);
                      setActiveIndex(0);
                    }}
                    className={`w-full text-left px-5 py-3 rounded-full transition-all duration-300 ${
                      activeCategory === cat.category
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-500 hover:text-white hover:bg-zinc-900"
                    }`}
                  >
                    {cat.category}
                  </button>
                ))}

              </div>
            </div>

            {/* ─────────────────────
                FAQ ACCORDION
            ───────────────────── */}

            <div className="p-8 md:p-10">

              {currentItems.length > 0 ? (
                <div className="divide-y divide-zinc-800">

                  {currentItems.map((item, index) => (
                    <div
                      key={index}
                      className="py-6 first:pt-0 last:pb-0"
                    >

                      <button
                        onClick={() =>
                          setActiveIndex(
                            index === activeIndex ? -1 : index
                          )
                        }
                        className="w-full flex justify-between items-center text-left gap-6"
                      >

                        <h3 className="text-lg md:text-xl font-semibold text-white">
                          Q{index + 1}. {item.question}
                        </h3>

                        <span className="text-2xl text-zinc-400 shrink-0">
                          {activeIndex === index ? "×" : "+"}
                        </span>

                      </button>

                      <div
                        ref={(el) => {
                          contentRefs.current[index] = el;
                        }}
                        className="overflow-hidden h-0 opacity-0"
                      >
                        <p className="pt-4 text-zinc-400 max-w-3xl leading-relaxed">
                          {item.answer}
                        </p>
                      </div>

                    </div>
                  ))}

                </div>
              ) : (
                <p className="py-12 text-zinc-600 text-center">
                  No questions in this category yet.
                </p>
              )}

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}