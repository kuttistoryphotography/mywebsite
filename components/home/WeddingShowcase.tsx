"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { DriveMedia } from "@/components/ui/DriveMedia";

interface ShowcaseSlide {
  image1: string;
  image2: string;
  year: string;
}

const DEFAULT_SLIDES: ShowcaseSlide[] = [
  { image1: "/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/13.webp", image2: "/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/11.webp", year: "2K23" },
  { image1: "/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/19.webp", image2: "/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/05.webp", year: "2K24" },
  { image1: "/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/02.webp", image2: "/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/14.webp", year: "2K25" },
];

export default function WeddingShowcase() {
  const marqueeRef  = useRef<HTMLDivElement | null>(null);
  const titleRef    = useRef<HTMLHeadingElement>(null);
  const sectionRef  = useRef<HTMLElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const [slides, setSlides]           = useState<ShowcaseSlide[]>(DEFAULT_SLIDES);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isInView, setIsInView]       = useState(false);
  const [isPaused, setIsPaused]       = useState(false);

  // Fetch dynamic slides
  useEffect(() => {
    fetch("/api/homepage")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings?.showcaseSlides?.length) {
          setSlides(data.settings.showcaseSlides);
        }
      })
      .catch(() => {});
  }, []);

  const goToNext = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsAnimating(false), 900);
  }, [isAnimating, slides.length]);

  const goToPrev = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsAnimating(false), 900);
  }, [isAnimating, slides.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting), { threshold: 0.3 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isInView && !isPaused) {
      autoPlayRef.current = setInterval(goToNext, 3500);
    }
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [isInView, isPaused, goToNext]);

  useEffect(() => {
    let marqueeAnimation: number | null = null;
    if (marqueeRef.current) {
      const animate = () => {
        if (marqueeRef.current) {
          const match    = marqueeRef.current.style.transform.match(/translateX\((-?\d+\.?\d*)px\)/);
          const currentX = match ? parseFloat(match[1]) : 0;
          const newX     = currentX - 1;
          marqueeRef.current.style.transform = `translateX(${newX}px)`;
          if (Math.abs(newX) >= marqueeRef.current.scrollWidth / 2) {
            marqueeRef.current.style.transform = "translateX(0px)";
          }
        }
        marqueeAnimation = requestAnimationFrame(animate);
      };
      marqueeAnimation = requestAnimationFrame(animate);
    }
    return () => { if (marqueeAnimation !== null) cancelAnimationFrame(marqueeAnimation); };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes fade-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.animate-fade-in{animation:fade-in 0.5s ease-out}` }} />
      <section
        ref={sectionRef}
        style={{ backgroundColor: "#080808", color: "white", position: "relative", overflow: "hidden", minHeight: "100vh", marginBottom: "20px", paddingBottom: "35vh", zIndex: 5 }}
        className="py-32 flex flex-col justify-center"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <h2 ref={titleRef} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) scale(0.95)", fontSize: "18vw", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.05em", whiteSpace: "nowrap", pointerEvents: "none", zIndex: 0, WebkitTextStroke: "1px rgba(255,255,255,0.15)", color: "transparent", opacity: 0.06 }}>
          BEST WEDDING PHOTOGRAPHY
        </h2>

        {/* NAV BUTTONS */}
        <div style={{ position: "absolute", insetInline: 0, top: "50%", transform: "translateY(-50%)", zIndex: 50, display: "flex", justifyContent: "space-between", paddingInline: "4rem", pointerEvents: "none" }}>
          {[{ fn: goToPrev, label: "←" }, { fn: goToNext, label: "→" }].map(({ fn, label }) => (
            <button key={label} onClick={fn} style={{ pointerEvents: "auto", width: "3.5rem", height: "3.5rem", borderRadius: "9999px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)", backdropFilter: "blur(40px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.5s", color: "white", fontSize: "1.5rem" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.color = "black"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "white"; }}>
              {label}
            </button>
          ))}
        </div>

        {/* CAROUSEL */}
        <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: "3rem", height: "600px" }}>
          {slides.map((slide, idx) => {
            const isActive = idx === activeIndex;
            const isPrev   = idx === (activeIndex - 1 + slides.length) % slides.length;
            const isNext   = idx === (activeIndex + 1) % slides.length;
            if (!isActive && !isPrev && !isNext) return null;
            return (
              <div key={idx} onClick={() => setActiveIndex(idx)} style={{ position: "relative", display: "flex", gap: "1.5rem", cursor: "pointer", transition: "all 1s", transform: isActive ? "scale(1)" : "scale(0.9)", opacity: isActive ? 1 : 0.3, filter: isActive ? "none" : "blur(1px) grayscale(1)", zIndex: isActive ? 30 : 10 }}>
                {[slide.image1, slide.image2].map((img, i) => (
                  <div key={i} style={{ position: "relative", overflow: "hidden", borderRadius: "1.5rem", width: isActive ? "300px" : "180px", height: isActive ? "480px" : "300px", transition: "all 1s" }}>
                    <DriveMedia
                      url={img}
                      mediaType="image"
                      className="w-full h-full object-cover"
                      alt={`Slide ${idx + 1}-${i + 1}`}
                    />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }} />
                  </div>
                ))}
                {isActive && (
                  <div className="animate-fade-in" style={{ position: "absolute", bottom: "-4rem", left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
                    <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.4em", color: "rgba(255,255,255,0.6)", marginBottom: "0.25rem" }}>Portfolio Year</p>
                    <h3 style={{ fontSize: "1.875rem", fontWeight: 700 }}>{slide.year}</h3>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* MARQUEE */}
        <div style={{ position: "absolute", bottom: 100, right: "-10%", width: "120%", backgroundColor: "white", color: "black", paddingBlock: "1.5rem", zIndex: 40, transform: "translateY(50%) rotate(-4deg)", overflow: "hidden" }}>
          <div ref={marqueeRef} style={{ display: "flex", gap: "4rem", whiteSpace: "nowrap", fontSize: "1.25rem", fontWeight: 900, textTransform: "uppercase", fontStyle: "italic", transform: "translateX(0px)" }}>
            {Array.from({ length: 30 }).map((_, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                Kutti Story Photography <span style={{ color: "#dc2626" }}>★</span> Cinematic Wedding <span style={{ color: "#6b7280" }}>/</span> Visual Magic
              </span>
            ))}
          </div>
        </div>

        {/* INDICATORS */}
        <div style={{ position: "absolute", bottom: "5rem", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "1rem", zIndex: 50 }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => setActiveIndex(i)} style={{ height: "0.375rem", borderRadius: "9999px", transition: "all 0.5s", width: activeIndex === i ? "4rem" : "1rem", backgroundColor: activeIndex === i ? "white" : "rgba(255,255,255,0.3)", cursor: "pointer", border: "none" }} />
          ))}
        </div>
      </section>
    </>
  );
}
