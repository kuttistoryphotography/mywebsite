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
  const touchStartX = useRef<number>(0);
  const touchEndX   = useRef<number>(0);
  const mouseX = useRef(0);

  const [slides, setSlides]           = useState<ShowcaseSlide[]>(DEFAULT_SLIDES);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isInView, setIsInView]       = useState(false);
  const [isPaused, setIsPaused]       = useState(false);
  const [isMobile, setIsMobile]       = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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
    setActiveIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const goToPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

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

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
  };

    // Mobile carousel navigation
    const goNext = () => setActiveIndex((prev) => (prev + 1) % slides.length);
    const goPrev = () => setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes fade-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.animate-fade-in{animation:fade-in 0.5s ease-out}` }} />
      <section
        ref={sectionRef}
        style={{ backgroundColor: "#080808", color: "white", position: "relative", overflow: "hidden", zIndex: 5 }}
        className="py-16 md:py-32 flex flex-col justify-center min-h-[70vh] md:min-h-screen mb-5 pb-32 md:pb-[35vh]"
        onMouseEnter={() => !isMobile && setIsPaused(true)}
        onMouseLeave={() => !isMobile && setIsPaused(false)}
      >
        {/* Background text - hidden on mobile */}
        <h2
          ref={titleRef}
          className="hidden md:block"
          style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) scale(0.95)", fontSize: "18vw", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.05em", whiteSpace: "nowrap", pointerEvents: "none", zIndex: 0, WebkitTextStroke: "1px rgba(255,255,255,0.15)", color: "transparent", opacity: 0.06 }}>
          BEST WEDDING PHOTOGRAPHY
        </h2>

        {/* Section title - mobile only */}
        <div className="md:hidden text-center mb-6 px-4 relative z-10">
          <p className="text-xs tracking-[0.3em] uppercase text-white/40 mb-2">Portfolio</p>
          <h2 className="text-2xl font-black uppercase tracking-tight">Wedding <span className="text-red-500">Showcase</span></h2>
        </div>

        {/* DESKTOP NAV BUTTONS */}
        <div className="hidden md:flex" style={{ position: "absolute", insetInline: 0, top: "50%", transform: "translateY(-50%)", zIndex: 9999, justifyContent: "space-between", paddingInline: "4rem", pointerEvents: "none" }}>
          {[{ fn: goToPrev, label: "←" }, { fn: goToNext, label: "→" }].map(({ fn, label }) => (
            <button key={label} onClick={() => {  console.log(label);  fn(); }} style={{ pointerEvents: "auto", width: "3.5rem", height: "3.5rem", borderRadius: "9999px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "red", backdropFilter: "blur(40px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.5s", color: "white", fontSize: "1.5rem" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.color = "black"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "white"; }}>
              {label}
            </button>
          ))}
        </div>

        {/* DESKTOP CAROUSEL */}
        <div
          className="hidden md:flex"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          
          style={{
            position: "relative",
            zIndex: 10,
            alignItems: "center",
            justifyContent: "center",
            gap: "3rem",
            height: "600px",
          }}
        >
          {slides.map((slide, idx) => {
            const isActive = idx === activeIndex;
            const isPrev   = idx === (activeIndex - 1 + slides.length) % slides.length;
            const isNext   = idx === (activeIndex + 1) % slides.length;
            if (!isActive && !isPrev && !isNext) return null;
            return (
              <div
                key={idx}
                onClick={() => setActiveIndex(idx)}
                onMouseEnter={() => {
                  if (idx !== activeIndex) {
                    setIsPaused(true);
                    setActiveIndex(idx);
                  }
                }}
                style={{ position: "relative", display: "flex", gap: "1.5rem", cursor: "pointer", transition: "transform .9s cubic-bezier(.22,1,.36,1), opacity .8s, filter .8s", transform: isActive ? "translateY(-25px) scale(1.12)" : isPrev ? "translateX(-120px) scale(.82)" : "translateX(120px) scale(.82)", opacity: isActive ? 1 : 0.45, filter: isActive ? "blur(0px)" : "blur(3px) grayscale(1)", zIndex: isActive ? 30 : 10, boxShadow: isActive ? "0 0 60px rgba(255,255,255,0.12)" : "none" }}>
                {[slide.image1, slide.image2].map((img, i) => (
                  <div
                    key={i}
                    className="group hover:-translate-y-3 transition-all duration-700"
                    style={{ position: "relative", overflow: "hidden", borderRadius: "1.5rem", width: isActive ? "340px" : "180px", height: isActive ? "540px" : "300px", transition: "all 1s" }}
                  >
                    <DriveMedia
                      url={img}
                      mediaType="image"
                      className="w-full h-full object-cover scale-125 group-hover:scale-100 transition-transform duration-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
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

        {/* MOBILE CAROUSEL */}
        <div
          className="md:hidden relative z-10 px-4"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {slides.map((slide, idx) => {
            const isActive = idx === activeIndex;
            if (!isActive) return null;
            return (
              <div key={idx} className="animate-fade-in">
                {/* Dual image layout */}
                <div className="flex gap-3 justify-center mb-6">
                  {[slide.image1, slide.image2].map((img, i) => (
                    <div
                      key={i}
                      className="relative overflow-hidden rounded-2xl flex-1"
                      style={{ aspectRatio: i === 0 ? "2/3" : "3/4", maxWidth: i === 0 ? "55%" : "45%" }}
                    >
                      <DriveMedia
                        url={img}
                        mediaType="image"
                        className="w-full h-full object-cover"
                        alt={`Slide ${idx + 1}-${i + 1}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <p className="text-[10px] tracking-[0.4em] uppercase text-white/50 mb-1">Portfolio Year</p>
                  <h3 className="text-2xl font-bold">{slide.year}</h3>
                </div>
              </div>
            );
          })}

          {/* Mobile nav */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <button
              onClick={goPrev}
              className="w-10 h-10 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-white text-xl active:scale-95 transition-transform"
            >
              ←
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`rounded-full transition-all ${i === activeIndex ? "w-8 h-2 bg-white" : "w-2 h-2 bg-white/30"}`}
                />
              ))}
            </div>

            <button
              onClick={goNext}
              className="w-10 h-10 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-white text-xl active:scale-95 transition-transform"
            >
              →
            </button>
          </div>
        </div>

        {/* MARQUEE */}
        <div style={{ position: "absolute", bottom: 100, right: "-10%", width: "120%", backgroundColor: "white", color: "black", paddingBlock: "1rem", zIndex: 40, transform: "translateY(50%) rotate(-4deg)", overflow: "hidden" }}>
          <div ref={marqueeRef} style={{ display: "flex", gap: "4rem", whiteSpace: "nowrap", fontSize: "clamp(0.75rem, 2vw, 1.25rem)", fontWeight: 900, textTransform: "uppercase", fontStyle: "italic", transform: "translateX(0px)" }}>
            {Array.from({ length: 30 }).map((_, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                Kutti Story Photography <span style={{ color: "#dc2626" }}>★</span> Cinematic Wedding <span style={{ color: "#6b7280" }}>/</span> Visual Magic
              </span>
            ))}
          </div>
        </div>

        {/* DESKTOP INDICATORS */}
        <div className="hidden md:flex" style={{ position: "absolute", bottom: "5rem", left: "50%", transform: "translateX(-50%)", gap: "1rem", zIndex: 50 }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => setActiveIndex(i)} style={{ height: "0.375rem", borderRadius: "9999px", transition: "all 0.5s", width: activeIndex === i ? "4rem" : "1rem", backgroundColor: activeIndex === i ? "white" : "rgba(255,255,255,0.3)", cursor: "pointer", border: "none" }} />
          ))}
        </div>
      </section>
    </>
  );
}
