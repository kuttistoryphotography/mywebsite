"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function StatsCardsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const cards = cardsRef.current.filter(Boolean);

    const ctx = gsap.context(() => {
      // Heading Entrance
      gsap.from(headingRef.current, {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: headingRef.current,
          start: "top 90%",
        },
      });

      // Cards Entrance
      gsap.from(cards, {
        y: 100,
        opacity: 0,
        scale: 0.9,
        duration: 1.2,
        stagger: 0.2,
        ease: "power4.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 60%",
          toggleActions: "play none none reverse",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // GSAP Hover Animation Logic
  const onMouseEnter = (index: number) => {
    gsap.to(cardsRef.current[index], {
      y: -20,
      scale: 1.02,
      duration: 0.4,
      ease: "power2.out",
      boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
    });
  };

  const onMouseLeave = (index: number) => {
    gsap.to(cardsRef.current[index], {
      y: 0,
      scale: 1,
      duration: 0.4,
      ease: "power2.inOut",
      boxShadow: "0 0px 0px rgba(0,0,0,0)"
    });
  };

  return (
    <section ref={sectionRef} className="relative py-16 md:py-40 bg-[#050505] overflow-hidden">
      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-8 md:px-16 lg:px-24">
        
        {/* HEADING */}
        <div ref={headingRef} className="max-w-3xl mb-10 md:mb-24">
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1] text-white">
            Stories that <br /> build <span className="text-red-600">trust</span>
          </h2>
          <p className="mt-6 text-lg text-white/50">
            From wedding films to commercial visuals, our work is measured
            by emotion and impact.
          </p>
        </div>

        {/* CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Blog - Electric Purple */}
          <div
            ref={(el) => { cardsRef.current[0] = el; }}
            onMouseEnter={() => onMouseEnter(0)}
            onMouseLeave={() => onMouseLeave(0)}
            className="group rounded-[2.5rem] bg-white/[0.03] border border-white/10 p-6 transition-colors duration-500 hover:bg-white/[0.06]"
          >
            <span className="inline-block mb-6 px-5 py-1.5 rounded-full border border-white/10 text-[10px] uppercase tracking-widest text-white/40">
              Insights
            </span>
            <div className="bg-gradient-to-br from-[#6366f1] to-[#a855f7] rounded-[2rem] p-8 h-[280px] flex flex-col justify-between relative overflow-hidden">
              <p className="text-white text-xl font-semibold leading-tight z-10">Crafting visual narratives that resonate.</p>
              <div className="flex items-center justify-between z-10">
                <h4 className="text-xl uppercase font-black text-white">Latest <br /> Stories</h4>
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-500">
                  <span className="group-hover:rotate-45 transition-transform">→</span>
                </div>
              </div>
              {/* Decorative Glow */}
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            </div>
          </div>

          {/* Card 2: Success - Vivid Crimson */}
          <div
            ref={(el) => { cardsRef.current[1] = el; }}
            onMouseEnter={() => onMouseEnter(1)}
            onMouseLeave={() => onMouseLeave(1)}
            className="group rounded-[2.5rem] bg-white/[0.03] border border-white/10 p-6 transition-colors duration-500 hover:bg-white/[0.06]"
          >
            <span className="inline-block mb-6 px-5 py-1.5 rounded-full border border-white/10 text-[10px] uppercase tracking-widest text-white/40">
              Impact
            </span>
            <div className="bg-[#e11d48] rounded-[2rem] p-8 h-[280px] flex flex-col justify-end relative overflow-hidden">
              <span className="uppercase text-[10px] font-bold text-white/70 mb-1 tracking-widest">Completed Works</span>
              <h3 className="text-8xl font-black tracking-tighter text-white group-hover:scale-110 transition-transform duration-700 origin-left">304</h3>
              {/* Decorative Pattern */}
              <div className="absolute top-0 right-0 p-8 opacity-20 text-4xl font-black text-white">DONE</div>
            </div>
          </div>

          {/* Card 3: Confidence - Deep Emerald */}
          <div
            ref={(el) => { cardsRef.current[2] = el; }}
            onMouseEnter={() => onMouseEnter(2)}
            onMouseLeave={() => onMouseLeave(2)}
            className="group rounded-[2.5rem] bg-white/[0.03] border border-white/10 p-6 transition-colors duration-500 hover:bg-white/[0.06]"
          >
            <span className="inline-block mb-6 px-5 py-1.5 rounded-full border border-white/10 text-[10px] uppercase tracking-widest text-white/40">
              Reviews
            </span>
            <div className="bg-[#10b981] rounded-[2rem] p-8 h-[280px] flex flex-col justify-between relative overflow-hidden">
              <h3 className="text-8xl font-black tracking-tighter text-white">
                4.9<span className="text-3xl align-top text-white/50">★</span>
              </h3>
              <p className="uppercase text-[10px] font-bold leading-relaxed text-white/80 tracking-widest">
                Average client <br /> rating on Google
              </p>
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-black/10 rounded-full blur-2xl" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
