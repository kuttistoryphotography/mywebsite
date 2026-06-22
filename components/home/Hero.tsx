"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { DriveMedia } from "../ui/DriveMedia";

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
  subheading: "Kutti Story Photography - Madurai",
  paragraph:
  "Professional wedding photographer in Madurai specializing in candid wedding photography, cinematic wedding photography, traditional Tamil wedding photography, pre-wedding shoots and post-wedding photography across Tamil Nadu. We don't just capture moments—we preserve emotions through storytelling and timeless imagery.",
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

  const enter = (el: HTMLSpanElement) =>
    gsap.to(el, {
      y: -8,
      scale: 1.15,
      color: "#a855f7",
      duration: 0.35,
      ease: "power3.out",
    });

  const leave = (el: HTMLSpanElement) =>
    gsap.to(el, {
      y: 0,
      scale: 1,
      color: "#ffffff",
      duration: 0.35,
      ease: "power3.out",
    });

  let counter = 0;

  return (
    <>
      {text.split(" ").map((word, wordIndex) => (
        <span
          key={wordIndex}
          className="inline-block mr-[0.25em]"
        >
          {word.split("").map((char) => {
            const index = counter++;

            return (
              <span
                key={index}
                ref={(el) => {
                  if (el) refs.current[index] = el;
                }}
                onMouseEnter={() => enter(refs.current[index])}
                onMouseLeave={() => leave(refs.current[index])}
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
};

  
  return (
    <section
  ref={containerRef}
  className="
    relative
    min-h-screen
    overflow-hidden
    bg-[#0a0a0a]
    text-white
    pt-[100px]
    md:pt-[120px]
    lg:pt-[140px]
  "
>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />

      {hero.backgroundImage && (
        <div className="absolute inset-0 z-0 opacity-70">
          <DriveMedia
            url={hero.backgroundImage}
            mediaType="image"
            className="w-full h-full object-cover"
            alt="Background"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-transparent" />
        </div>
      )}

      <div
  className="
  relative z-10
  w-full
  max-w-screen-2xl
  mx-auto
  px-5
  sm:px-8
  lg:px-16
  xl:px-12

  grid
  grid-cols-1
  lg:grid-cols-2
  2xl:grid-cols-[1.2fr_1fr]

  gap-10
  lg:gap-20

  lg:items-center
  items-start

  pt-0
"
>
        


          {/* <div className="animate-fade">
            <span className="px-4 py-2 rounded-full border border-white/20 bg-white/5 text-xs uppercase tracking-[0.3em] backdrop-blur-md">
              {hero.badgeText}
            </span>
          </div> */}
<div className="space-y-4 md:space-y-8 pt-4 lg:pt-0 lg:pr-10">
<div className="space-y-2 sm:space-y-3">
  
<h3
  className="
    group
    relative
    inline-block
    text-[10px]
    sm:text-xs
    md:text-sm
    text-gray-200
    font-medium
    tracking-[0.15em]
    uppercase
    cursor-pointer
    overflow-hidden
  "
>  <span
    className="
      relative z-10
      transition-all duration-500
      group-hover:text-white
      group-hover:scale-105
      group-hover:drop-shadow-[0_0_25px_rgba(255,255,255,1)]
    "
  >
    {hero.subheading}
  </span>

  <span
    className="
      absolute inset-0
      -translate-x-full
      group-hover:translate-x-full
      transition-transform duration-1000
      bg-gradient-to-r
      from-transparent
      via-white/90
      to-transparent
      skew-x-12
    "
  />
</h3>

<h1
  className="
    text-[26px]
    sm:text-[34px]
    md:text-[42px]
    lg:text-[48px]
    xl:text-[54px]
    2xl:text-[72px]
    font-light
    leading-[1.1]
    tracking-tight
    max-w-[850px]
    2xl:max-w-[1000px]
  "
>
  <MagicText text={hero.heading} />
</h1>

</div>

          <p
  className="
    animate-fade
    text-gray-300
    max-w-2xl
    text-base
    md:text-lg
    leading-relaxed
  "
>{hero.paragraph}</p>

          <div className="animate-fade flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="mt-6 text-sm text-gray-400 max-w-2xl">
              Trusted Wedding Photography Studio in Madurai • Candid Photography •
              Cinematic Wedding Films • Traditional Tamil Wedding Photography •
              Pre-Wedding & Post-Wedding Shoots Across Tamil Nadu
          </div>
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

          <div className="animate-fade grid grid-cols-3 gap-3 sm:gap-6 p-5 sm:p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl w-full max-w-xl">
            {[
              { value: hero.statsYears, label: "Years" },
              { value: hero.statsStories, label: "Stories" },
              { value: hero.statsPassion, label: "Passion" },
            ].map(({ value, label }) => (
              <div key={label}>
                <h3 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">{value}</h3>
                <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        

        {/* Mobile Hero Image */}
        <div className="md:hidden flex justify-center mt-8">
          <div className="w-[220px] h-[300px] rounded-[30px] overflow-hidden border-[8px] border-white/5 shadow-2xl">
            <DriveMedia
              url={hero.heroCardImage}
              mediaType="image"
              className="w-full h-full object-cover"
              alt="Professional Shot"
            />
          </div>
        </div>
        
        </div> {/* LEFT COLUMN END */}

        <div
         className="
         relative
         hidden
         lg:flex
         items-center
         justify-center
         h-[850px]
        "
        >
          
          <div className="absolute w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl animate-pulse" />
          {hero.heroCardImage && (
            <div
              ref={imageWrapperRef}
              className="
              relative
              z-20
              mx-auto
              translate-x-0
              h-[650px]
              w-[420px]

              sm:h-[450px]
              sm:w-[320px]

              lg:h-[600px]
              lg:w-[500px]

              xl:h-[700px]
              xl:w-[580px]

              2xl:h-[850px]
              2xl:w-[700px]

              rounded-[45px]
              overflow-hidden
              border-[12px]
              border-white/5
              shadow-2xl
             "
            >
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
