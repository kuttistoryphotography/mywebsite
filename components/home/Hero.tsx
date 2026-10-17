
"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { DriveMedia } from "../ui/DriveMedia";
import { MediaType } from "@/lib/media";

interface HeroData {
  backgroundImage: string;
  backgroundMediaType: MediaType;
  backgroundOpacity: number;
  backgroundBlur: number;
  backgroundBrightness: number;
  overlayOpacity: number;
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
  heroCardMediaType: MediaType;
  awardText: string;
}

const DEFAULT_HERO: HeroData = {
  backgroundImage:
    "/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/06.webp",
  backgroundMediaType: "image",
  backgroundOpacity: 100,
  backgroundBlur: 0,
  backgroundBrightness: 100,
  overlayOpacity: 20,
  heading: "Capturing Moments Into Eternity",
  subheading: "Kutti Story Photography - Madurai",
  paragraph:
    "Professional wedding photographer in Madurai specializing in candid wedding photography, cinematic wedding photography, traditional Tamil wedding photography, pre-wedding shoots and post-wedding photography across Tamil Nadu. We don't just capture moments—we preserve emotions through storytelling and timeless imagery.",
  badgeText: "Kutti Story Photography",
  primaryButtonText: "Book a Session",
  secondaryButtonText: "View Portfolio",
  statsYears: "7+",
  statsStories: "213+",
  statsPassion: "100%",
  heroCardImage:
    "/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/06.webp",
  heroCardMediaType: "image",
  awardText: "Award Winning Studio 2024",
};

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);

  // Render default content immediately instead of waiting for the API.
  const [hero, setHero] = useState<HeroData>(DEFAULT_HERO);

  // Load dynamic homepage settings in the background.
  useEffect(() => {
    let cancelled = false;

    async function loadHomepageSettings() {
      try {
        const response = await fetch("/api/homepage");

        if (!response.ok) {
          throw new Error("Failed to load homepage settings");
        }

        const data = await response.json();

        if (cancelled || !data.settings?.hero) return;

        const settings = data.settings.hero;

        setHero({
          ...DEFAULT_HERO,
          ...settings,
          backgroundMediaType:
            settings.backgroundMediaType || "image",
          heroCardMediaType:
            settings.heroCardMediaType || "image",
        });
      } catch (error) {
        // Keep the default hero visible if the request fails.
        console.error("Homepage settings could not be loaded:", error);
      }
    }

    void loadHomepageSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  // Animate the heading and decorative desktop image.
  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const ctx = gsap.context(() => {
      gsap.from(".char", {
        opacity: 0,
        y: 40,
        rotateX: -90,
        stagger: 0.02,
        duration: 1,
        ease: "expo.out",
        delay: 0.3,
      });

      // Keep animations on secondary content, but do not animate
      // the main paragraph that PageSpeed identifies as the LCP element.
      gsap.from(".animate-fade", {
        opacity: 0,
        y: 20,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.2,
      });

      if (imageWrapperRef.current) {
        gsap.from(imageWrapperRef.current, {
          scale: 0.8,
          opacity: 0,
          duration: 1.2,
          ease: "expo.out",
          delay: 0.3,
        });

        gsap.to(imageWrapperRef.current, {
          y: 8,
          duration: 4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
    }, container);

    return () => ctx.revert();
  }, []);

  // Interactive heading text.
  function MagicText({ text }: { text: string }) {
    const refs = useRef<HTMLSpanElement[]>([]);
    let counter = 0;

    const enter = (el: HTMLSpanElement) => {
      gsap.to(el, {
        y: -8,
        scale: 1.15,
        color: "#a855f7",
        duration: 0.35,
        ease: "power3.out",
      });
    };

    const leave = (el: HTMLSpanElement) => {
      gsap.to(el, {
        y: 0,
        scale: 1,
        color: "#ffffff",
        duration: 0.35,
        ease: "power3.out",
      });
    };

    return (
      <>
        {text.split(" ").map((word, wordIndex) => (
          <span
            key={`${wordIndex}-${word}`}
            className="mr-[0.25em] inline-block"
          >
            {word.split("").map((char) => {
              const index = counter++;

              return (
                <span
                  key={`${wordIndex}-${index}`}
                  ref={(el) => {
                    if (el) refs.current[index] = el;
                  }}
                  onMouseEnter={(event) => enter(event.currentTarget)}
                  onMouseLeave={(event) => leave(event.currentTarget)}
                  className="char inline-block cursor-default"
                >
                  {char}
                </span>
              );
            })}
          </span>
        ))}
      </>
    );
  }

  return (
    <section
      ref={containerRef}
      className="
        relative flex min-h-[100svh] items-center
        overflow-hidden bg-[#0a0a0a] text-white
        pt-24 pb-12 lg:pt-28 lg:pb-16
      "
    >
      {/* Decorative background glows */}
      <div className="absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-blue-500/5 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-purple-500/5 blur-[120px]" />

      {/* Full-screen hero background */}
      {hero.backgroundImage && (
        <div
          className="absolute inset-0 z-0"
          style={{
            opacity: (hero.backgroundOpacity ?? 100) / 100,
            filter: `blur(${hero.backgroundBlur ?? 0}px) brightness(${hero.backgroundBrightness ?? 100}%)`,
          }}
        >
          <DriveMedia
            url={hero.backgroundImage}
            mediaType={hero.backgroundMediaType || "image"}
            className="h-full w-full object-cover"
            alt="Best Wedding Photography in Madurai by Kutti Story Photography"
            loading="eager"
            fetchPriority="high"
          />

          <div
            className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent"
            style={{
              opacity: (hero.overlayOpacity ?? 20) / 100,
            }}
          />
        </div>
      )}

      {/* Main hero layout */}
      <div
        className="
          relative z-10 mx-auto grid w-full max-w-screen-2xl
          grid-cols-1 items-center gap-8 px-6
          sm:px-8 lg:grid-cols-[48%_52%] lg:gap-12
          lg:px-10 xl:px-12
        "
      >
        {/* Text and information */}
        <div className="w-full max-w-[720px] space-y-6 pt-2 lg:space-y-8 lg:pt-0">
          <div className="space-y-2 sm:space-y-3">
            <h3
              className="
                group relative inline-block cursor-pointer
                overflow-hidden text-[clamp(0.75rem,0.8vw,0.9rem)]
                font-medium uppercase tracking-[0.15em] text-gray-200
              "
            >
              <span
                className="
                  relative z-10 transition-all duration-500
                  group-hover:scale-[1.03] group-hover:text-white
                  group-hover:drop-shadow-[0_0_25px_rgba(255,255,255,1)]
                "
              >
                {hero.subheading}
              </span>

              <span
                className="
                  absolute inset-0 -translate-x-full skew-x-12
                  bg-gradient-to-r from-transparent via-white/90 to-transparent
                  transition-transform duration-1000
                  group-hover:translate-x-full
                "
              />
            </h3>

            <h1
              className="
                max-w-[700px] text-[clamp(2.8rem,5vw,5.8rem)]
                font-light leading-[1.05] tracking-tight
              "
            >
              <MagicText text={hero.heading} />
            </h1>
          </div>

          {/* Main paragraph: visible immediately, without a fade delay */}
          <p
            className="
              max-w-[650px] text-[clamp(1rem,1.2vw,1.2rem)]
              leading-8 text-gray-300
            "
          >
            {hero.paragraph}
          </p>

          <div className="animate-fade space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="/booking"
                className="
                  rounded-full bg-white px-[clamp(1.5rem,2vw,2.5rem)]
                  py-[clamp(.9rem,1vw,1rem)] font-semibold text-black
                  transition-colors duration-300 hover:bg-gray-200
                "
              >
                {hero.primaryButtonText}
              </a>

              <a
                href="/works"
                className="
                  group flex items-center gap-2
                  font-medium text-white
                "
              >
                {hero.secondaryButtonText}
                <span className="transition-transform duration-300 group-hover:translate-x-2">
                  →
                </span>
              </a>
            </div>

            <p className="max-w-[680px] text-sm leading-7 text-gray-400">
              Trusted Wedding Photography Studio in Madurai • Candid
              Photography • Cinematic Wedding Films • Traditional Tamil
              Wedding Photography • Pre-Wedding &amp; Post-Wedding Shoots
              Across Tamil Nadu
            </p>
          </div>

          {/* Statistics */}
          <div
            className="
              animate-fade grid w-full max-w-[650px] grid-cols-3
              gap-6 rounded-3xl border border-white/10 bg-white/5
              p-[clamp(1.25rem,2vw,2rem)] backdrop-blur-xl
            "
          >
            {[
              { value: hero.statsYears, label: "Years" },
              { value: hero.statsStories, label: "Stories" },
              { value: hero.statsPassion, label: "Passion" },
            ].map(({ value, label }) => (
              <div key={label}>
                <h3 className="bg-gradient-to-r from-white to-gray-500 bg-clip-text text-[clamp(2rem,2vw,2.75rem)] font-bold text-transparent">
                  {value}
                </h3>
                <p className="mt-1 text-[clamp(.75rem,.8vw,.9rem)] uppercase tracking-widest text-gray-500">
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Mobile hero image */}
          {hero.heroCardImage && (
            <div className="mt-8 flex justify-end md:hidden">
              <div className="h-[300px] w-[220px] overflow-hidden rounded-[30px] border-[8px] border-white/5 shadow-2xl">
                <DriveMedia
                  url={hero.heroCardImage}
                  mediaType={hero.heroCardMediaType || "image"}
                  className="h-full w-full object-cover object-left"
                  alt="Bride and groom wedding photography by Kutti Story Photography in Madurai"
                  loading="lazy"
                />
              </div>
            </div>
          )}
        </div>

        {/* Desktop hero image */}
        <div
          className="
            relative hidden h-full w-full items-center
            justify-end lg:flex
          "
        >
          <div
            className="
              absolute h-[420px] w-[420px] rounded-full
              bg-white/5 opacity-70 blur-[120px]
              lg:h-[500px] lg:w-[500px]
            "
          />

          {hero.heroCardImage && (
            <div
              ref={imageWrapperRef}
              className="
                relative z-20 mx-auto aspect-[3/4] w-[90%]
                min-w-[320px] max-w-[620px] overflow-hidden
                rounded-[40px] border-[10px] border-white/5 shadow-2xl
              "
            >
              <DriveMedia
                url={hero.heroCardImage}
                mediaType={hero.heroCardMediaType || "image"}
                className="
                  h-full w-full object-cover
                  transition-transform duration-700 hover:scale-105
                "
                alt="Bride and groom wedding photography by Kutti Story Photography in Madurai"
                loading="lazy"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
