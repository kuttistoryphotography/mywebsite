"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { DriveMedia } from "@/components/ui/DriveMedia";

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

const DEFAULT_HERO: HeroData = {
  backgroundImage: "/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/06.webp",
  heading: "Capturing Moments Into Eternity",
  subheading: "Kutti Story Photography",
  paragraph: "We don't just take pictures; we craft visual legacies. Specializing in high-end storytelling and cinematic night shoots.",
  badgeText: "Kutti Story Photography",
  primaryButtonText: "Book a Session",
  secondaryButtonText: "View Portfolio",
  statsYears: "7+",
  statsStories: "213+",
  statsPassion: "100%",
  heroCardImage: "/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/06.webp",
  awardText: "Award Winning Studio 2024",
};

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const [hero, setHero] = useState<HeroData>(DEFAULT_HERO);

  // Fetch dynamic content
  useEffect(() => {
    fetch("/api/homepage")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings?.hero) setHero({ ...DEFAULT_HERO, ...data.settings.hero });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".char", { opacity: 0, y: 40, rotateX: -90, stagger: 0.02, duration: 1, ease: "expo.out", delay: 0.3 });
      gsap.from(".animate-fade", { opacity: 0, y: 20, duration: 1, stagger: 0.2, ease: "power3.out", delay: 1 });
      gsap.from(imageWrapperRef.current, { scale: 0.8, opacity: 0, duration: 1.5, ease: "expo.out", delay: 0.5 });
      gsap.to(imageWrapperRef.current, { y: 20, duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const MagicText = ({ text }: { text: string }) => {
    const refs = useRef<HTMLSpanElement[]>([]);
    const enter = (el: HTMLSpanElement) => gsap.to(el, { y: -8, scale: 1.15, color: "#a855f7", duration: 0.35, ease: "power3.out" });
    const leave = (el: HTMLSpanElement) => gsap.to(el, { y: 0, scale: 1, color: "#ffffff", duration: 0.35, ease: "power3.out" });
    return (
      <>
        {text.split("").map((char, i) => (
          <span key={i} ref={(el) => { if (el) refs.current[i] = el; }}
            onMouseEnter={() => enter(refs.current[i])} onMouseLeave={() => leave(refs.current[i])}
            className="char inline-block cursor-default">
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </>
    );
  };

  const headingParts = hero.heading.split(/\s+/);
  const line1 = headingParts.slice(0, Math.ceil(headingParts.length / 2)).join(" ");
  const line2 = headingParts.slice(Math.ceil(headingParts.length / 2)).join(" ");

  return (
    <section ref={containerRef} className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white flex items-center">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />

      {hero.backgroundImage && (
        <div className="absolute inset-0 z-0 opacity-40">
          <DriveMedia
            url={hero.backgroundImage}
            mediaType="image"
            className="w-full h-full object-cover"
            alt="Background"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
        <div className="space-y-8">
          {/* <div className="animate-fade">
            <span className="px-4 py-2 rounded-full border border-white/20 bg-white/5 text-xs uppercase tracking-[0.3em] backdrop-blur-md">
              {hero.badgeText}
            </span>
          </div> */}
<h1 className="text-4xl md:text-5xl font-light leading-[1.1] tracking-tight perspective-1000">
          
            <div className="block overflow-hidden">
              <MagicText text={line1} />{" "}<br />
              <span className="italic font-serif text-gray-400">
                <MagicText text={line2} />
              </span>
            </div>
          </h1>

          <p className="animate-fade text-gray-400 max-w-lg text-lg leading-relaxed">{hero.paragraph}</p>

          <div className="animate-fade flex items-center gap-8">
            <a href="/booking">
              <button className="bg-white text-black px-10 py-4 rounded-full font-semibold hover:bg-gray-200 transition-all transform hover:scale-105 active:scale-95">
                {hero.primaryButtonText}
              </button>
            </a>
            <a href="/works">
              <button className="group flex items-center gap-2 text-white font-medium">
                {hero.secondaryButtonText}
                <span className="group-hover:translate-x-2 transition-transform">→</span>
              </button>
            </a>
          </div>

          <div className="animate-fade grid grid-cols-3 gap-8 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl max-w-xl">
            {[
              { value: hero.statsYears, label: "Years" },
              { value: hero.statsStories, label: "Stories" },
              { value: hero.statsPassion, label: "Passion" },
            ].map(({ value, label }) => (
              <div key={label}>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">{value}</h3>
                <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center lg:justify-end">
          <div className="absolute w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl animate-pulse" />
          {hero.heroCardImage && (
            <div ref={imageWrapperRef} className="relative h-[550px] w-[400px] rounded-[40px] overflow-hidden border-[12px] border-white/5 shadow-2xl">
              <DriveMedia
                url={hero.heroCardImage}
                mediaType="image"
                className="w-full h-full object-cover scale-110 hover:scale-100 transition-transform duration-700"
                alt="Professional Shot"
              />
            </div>
          )}
          {/* <div className="absolute bottom-10 -left-10 bg-white p-4 rounded-2xl shadow-2xl rotate-[-5deg] hidden md:block animate-bounce">
            <p className="text-black text-xs font-bold uppercase tracking-tighter">{hero.awardText}</p>
          </div> */}
        </div>
      </div>
    </section>
  );
}
