"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DriveMedia } from "@/components/ui/DriveMedia";
import Link from "next/link";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const DEFAULT_IMAGES = {
  featured_big:   "/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/19.webp",
  featured_small: "/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/05.webp",
};

export default function FeaturedWork() {
  const sectionRef      = useRef<HTMLDivElement>(null);
  const whiteRevealRef  = useRef<HTMLDivElement>(null);
  const bigCardRef      = useRef<HTMLDivElement>(null);
  const smallCardRef    = useRef<HTMLDivElement>(null);
  const textRef         = useRef<HTMLDivElement>(null);
  const [images, setImages] = useState(DEFAULT_IMAGES);

  useEffect(() => {
    fetch("/api/homepage")
      .then((r) => r.json())
      .then((data) => {
        const slots: { key: string; url: string }[] = data.settings?.homeImages || [];
        const big   = slots.find((s) => s.key === "featured_big")?.url;
        const small = slots.find((s) => s.key === "featured_small")?.url;
        if (big || small) {
          setImages({
            featured_big:   big   || DEFAULT_IMAGES.featured_big,
            featured_small: small || DEFAULT_IMAGES.featured_small,
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(whiteRevealRef.current?.firstElementChild || null,
        { scale: 0, borderRadius: "50%" },
        { scale: 1, borderRadius: "0%", ease: "none", scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "top top", scrub: true } });

      gsap.from(bigCardRef.current, { scale: 0.8, opacity: 0, duration: 1.2, ease: "power4.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 80%" } });

      gsap.from(smallCardRef.current, { x: 100, opacity: 0, duration: 1, ease: "power4.out", delay: 0.3,
        scrollTrigger: { trigger: sectionRef.current, start: "top 80%" } });

      gsap.from(textRef.current?.children || null, { y: 40, opacity: 0, stagger: 0.15, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 70%" } });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-[#0a0a0a] text-white py-16 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.18),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(220,38,38,0.12),transparent_40%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="relative">
            <div
              ref={bigCardRef}
              className="relative h-[350px] sm:h-[450px] md:h-[600px] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(139,92,246,0.15)]"
            >
              <DriveMedia
                url={images.featured_big}
                mediaType="image"
                className="w-full h-full object-cover ken-burns"
                alt="Featured Work"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
            <div ref={smallCardRef} className="absolute -bottom-6 -right-4 sm:-bottom-8 sm:-right-8 w-32 h-44 sm:w-48 sm:h-64 rounded-[1.5rem] overflow-hidden border-4 border-[#0a0a0a] shadow-2xl">
              <DriveMedia
                url={images.featured_small}
                mediaType="image"
                className="w-full h-full object-cover floating-image"
                alt="Featured Detail"
              />
            </div>
          </div>

          <div ref={textRef} className="space-y-8 lg:pl-8">
            <span className="text-xs uppercase tracking-[0.4em] text-gray-500">Featured Work</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light leading-[1.1]">
              Crafting visual <em className="italic text-gray-400">legacies</em> beyond the frame
            </h2>
            <p className="text-gray-400 leading-relaxed text-lg">
              Every photograph tells a story. We specialize in capturing those fleeting moments that define your most precious memories.
            </p>
            <p className="text-gray-500 text-sm max-w-xl">
              Explore our complete collection of wedding, engagement, maternity, baby shoot,
              and candid photography on our dedicated portfolio website.
            </p>
            <div className="flex gap-6 flex-wrap">
              <div className="flex gap-6 flex-wrap">
                <Link
                  href="https://kuttistoryphotography.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View our complete wedding photography portfolio"
                  className="inline-block bg-white text-black px-10 py-4 rounded-full font-semibold transition-all duration-500 hover:scale-110 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                >
                  View Full Portfolio
                </Link>

                <Link
                  href="/booking"
                  className="group flex items-center gap-2 text-white font-medium px-6 py-4"
                >
                  Book Now
                  <span className="group-hover:translate-x-2 transition-transform">
                    →
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
