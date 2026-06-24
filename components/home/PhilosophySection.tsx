"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function PhilosophySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleLinesRef = useRef<(HTMLSpanElement | null)[]>([]);
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. TITLES: Reveal with a slight tilt
      gsap.from(titleLinesRef.current, {
        y: 80,
        opacity: 0,
        rotateX: -20,
        stagger: 0.1,
        duration: 1.2,
        ease: "power4.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 85%",
        },
      });

      // 2. PARAGRAPH: Subtle "Glow and Rise" effect
      gsap.from(paragraphRef.current, {
        opacity: 0,
        x: 30,
        duration: 1.5,
        ease: "power3.out",
        scrollTrigger: {
          trigger: paragraphRef.current,
          start: "top 90%",
        },
      });

      // 3. TAGS: Floating animation
      gsap.from(tagsRef.current?.children || [], {
        opacity: 0,
        y: 20,
        stagger: 0.1,
        duration: 1,
        ease: "expo.out",
        scrollTrigger: {
          trigger: tagsRef.current,
          start: "top 95%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // MAGNETIC HOVER EFFECT
  const handleMagnetic = (e: React.MouseEvent<HTMLElement>, strength = 0.3) => {
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - (left + width / 2)) * strength;
    const y = (clientY - (top + height / 2)) * strength;

    gsap.to(currentTarget, { x, y, duration: 0.5, ease: "power2.out" });
  };

  const resetMagnetic = (e: React.MouseEvent<HTMLElement>) => {
    gsap.to(e.currentTarget, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.3)" });
  };

  return (
    <section
      ref={sectionRef}
      className="relative z-20 min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6 md:px-12 lg:px-20"
      style={{
        backgroundColor: "#080808",
        color: "white",
        // Reduced margin-top to prevent hiding the content above
        marginTop: "-40px", 
        paddingTop: "60px",
        paddingBottom: "60px",
      }}
    >
      {/* Using lg:grid-cols-12 with proper spans ensures 
         the paragraph on the right is never cut off.
      */}
      <div className="max-w-[1440px] w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20 items-center">
        
        {/* LEFT: THE BIG TITLES (8 Columns) */}
        <div className="lg:col-span-7">
          <h2 className="text-[13vw] sm:text-[11vw] lg:text-[8.5vw] leading-[0.85] font-black uppercase tracking-tighter">
            {["Organizers", "Of Emotional", "Super Events"].map((t, i) => (
              <span key={i} className="block overflow-hidden py-1">
                <span
                  ref={(el) => { titleLinesRef.current[i] = el; }}
                  onMouseMove={(e) => handleMagnetic(e, 0.4)}
                  onMouseLeave={resetMagnetic}
                  className="block will-change-transform cursor-default hover:text-red-500 transition-colors duration-500"
                >
                  {t}
                </span>
              </span>
            ))}
          </h2>
        </div>

        {/* RIGHT: THE PARAGRAPH (5 Columns - Fully Visible) */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <div 
            className="relative group p-6 border-l border-white/10 hover:border-red-500 transition-all duration-700"
            onMouseMove={(e) => handleMagnetic(e, 0.1)}
            onMouseLeave={resetMagnetic}
          >
            <p 
              ref={paragraphRef}
              className="text-gray-400 text-lg md:text-xl leading-relaxed group-hover:text-white transition-colors duration-500"
            >
              <span className="text-white font-mono text-xs tracking-[0.3em] block mb-4 opacity-50 uppercase">
                // Our Philosophy
              </span>
              We are visual storytellers capturing real emotions through light,
              timing, and human connection. Every wedding is a story waiting to be told.
            </p>
            {/* Subtle Magic Glint effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
          </div>

          <div ref={tagsRef} className="flex flex-wrap gap-2">
            {[
              "Wedding Photography",
              "Cinematic Frames",
              "Storytelling",
              "Timeless Moments",
            ].map((tag) => (
              <span
                key={tag}
                onMouseMove={(e) => handleMagnetic(e, 0.2)}
                onMouseLeave={resetMagnetic}
                className="px-4 py-1.5 text-[9px] uppercase tracking-widest border border-white/20 rounded-full 
                           hover:bg-red-600 hover:border-red-600 transition-all duration-500 cursor-pointer"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* BACKGROUND MAGIC */}
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-red-600/10 blur-[100px] rounded-full pointer-events-none animate-pulse" />
    </section>
  );
}
