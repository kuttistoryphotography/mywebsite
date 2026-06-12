"use client";

import { useEffect, useRef, useState } from "react";
import { DriveMedia } from "@/components/ui/DriveMedia";

const DEFAULT_IMAGES = {
  about_main: "/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/03.webp",
  about_secondary: "/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/11.webp",
};

export default function AboutSection() {
  const sectionRef   = useRef<HTMLElement | null>(null);
  const imagesRef    = useRef<HTMLDivElement[]>([]);
  const textRef      = useRef<HTMLDivElement | null>(null);
  const headingRef   = useRef<HTMLHeadingElement | null>(null);
  const buttonRef    = useRef<HTMLButtonElement | null>(null);
  const overlayRef   = useRef<HTMLDivElement | null>(null);
  const sparklesRef  = useRef<HTMLSpanElement[]>([]);

  const [images, setImages] = useState(DEFAULT_IMAGES);
  const [aboutContent, setAboutContent] = useState({
  title: "About Kutti Story",
  heading: "We Make Only Authentic Visual Experiences",
  description:
    "Every frame we create is driven by emotion, story, and authenticity.",
    experienceBadge: "10+ Years Experience",
});

  // Fetch dynamic images from homepage settings
  useEffect(() => {
    fetch("/api/homepage")
      .then((r) => r.json())
      .then((data) => {
        const slots: { key: string; url: string }[] = data.settings?.homeImages || [];
        const main      = slots.find((s) => s.key === "about_main")?.url;
        const secondary = slots.find((s) => s.key === "about_secondary")?.url;
        
        
        if (main || secondary) {
          setImages({
            about_main:      main      || DEFAULT_IMAGES.about_main,
            about_secondary: secondary || DEFAULT_IMAGES.about_secondary,
          });
        }
        if (data.settings?.aboutContent) {
  setAboutContent(data.settings.aboutContent);
}
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let ctx: any;

    const init = async () => {
      const gsapModule         = await import("gsap");
      const ScrollTriggerModule = await import("gsap/ScrollTrigger");

      const gsap         = gsapModule.default;
      const ScrollTrigger = ScrollTriggerModule.default;
      gsap.registerPlugin(ScrollTrigger);

      if (!sectionRef.current) return;

      ctx = gsap.context(() => {
        gsap.set(imagesRef.current, { x: -100, opacity: 0, scale: 0.8, rotateY: -15 });
        gsap.set(textRef.current, { x: 100, opacity: 0 });
        gsap.set(overlayRef.current, { scaleX: 1 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
          },
        });

        tl.to(overlayRef.current, { scaleX: 0, duration: 1.2, ease: "power4.inOut", transformOrigin: "right" });
        tl.to(imagesRef.current, { x: 0, opacity: 1, scale: 1, rotateY: 0, duration: 1.4, stagger: 0.2, ease: "power3.out" }, "-=0.8");

        imagesRef.current.forEach((img, i) => {
          gsap.to(img, { y: i === 0 ? -15 : -20, duration: 2.5 + i * 0.3, repeat: -1, yoyo: true, ease: "sine.inOut", delay: i * 0.2 });
        });

        tl.to(textRef.current, { x: 0, opacity: 1, duration: 1.2, ease: "power3.out" }, "-=1");

        if (headingRef.current) {
          const text  = headingRef.current.textContent || "";
          const words = text.split(" ");

          headingRef.current.innerHTML = words
            .map((word) => `<span class="word-hover" style="display:inline-block;opacity:0;position:relative">${word}</span>`)
            .join(" ");

          const wordSpans = headingRef.current.querySelectorAll<HTMLSpanElement>("span");
          gsap.set(wordSpans, { y: 30 });
          gsap.to(wordSpans, {
            opacity: 1, y: 0, duration: 0.8, stagger: 0.05, ease: "back.out(1.2)",
            scrollTrigger: { trigger: headingRef.current, start: "top 85%" },
          });

          wordSpans.forEach((word) => {
            word.addEventListener("mouseenter", () => {
              for (let i = 0; i < 8; i++) {
                const sparkle = document.createElement("span");
                sparkle.className = "sparkle";
                sparkle.style.cssText = `position:absolute;width:4px;height:4px;background:white;border-radius:50%;pointer-events:none;box-shadow:0 0 6px 2px rgba(255,255,255,.8);`;
                const rect       = word.getBoundingClientRect();
                const parentRect = word.offsetParent?.getBoundingClientRect() || { left: 0, top: 0 };
                sparkle.style.left = rect.left - parentRect.left + Math.random() * rect.width + "px";
                sparkle.style.top  = rect.top  - parentRect.top  + Math.random() * rect.height + "px";
                word.appendChild(sparkle);
                sparklesRef.current.push(sparkle);
                const angle    = (Math.PI * 2 * i) / 8;
                const distance = 30 + Math.random() * 20;
                gsap.to(sparkle, {
                  x: Math.cos(angle) * distance, y: Math.sin(angle) * distance,
                  opacity: 0, scale: 0, duration: 0.6 + Math.random() * 0.4, ease: "power2.out",
                  onComplete: () => { sparkle.remove(); sparklesRef.current = sparklesRef.current.filter((s) => s !== sparkle); },
                });
              }
              gsap.to(word, { scale: 1.1, duration: 0.3, ease: "back.out(2)" });
            });
            word.addEventListener("mouseleave", () => {
              gsap.to(word, { scale: 1, duration: 0.3, ease: "power2.out" });
            });
          });
        }

        if (buttonRef.current) {
          const btn = buttonRef.current;
          btn.addEventListener("mousemove", (e: MouseEvent) => {
            const rect = btn.getBoundingClientRect();
            const x    = e.clientX - rect.left - rect.width / 2;
            const y    = e.clientY - rect.top  - rect.height / 2;
            gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.3, ease: "power2.out" });
          });
          btn.addEventListener("mouseleave", () => {
            gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
          });
        }

        gsap.to(imagesRef.current[0], {
          y: 50,
          scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "bottom top", scrub: 1 },
        });
        gsap.to(imagesRef.current[1], {
          y: -30,
          scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "bottom top", scrub: 1 },
        });
      }, sectionRef);
    };

    init();
    return () => ctx?.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-[#0a0a0a] text-white py-32 overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gray-400 rounded-full blur-3xl" />
      </div>

      <div ref={overlayRef} className="absolute inset-0 bg-[#0a0a0a] z-10" style={{ transformOrigin: "right" }} />

      <div className="relative z-20 max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div className="relative flex gap-10">
          <div
            ref={(el) => { if (el) imagesRef.current[0] = el; }}
            className="relative h-[420px] w-[300px] overflow-hidden rounded-2xl shadow-2xl group"
            style={{ perspective: "1000px" }}
          >
            <DriveMedia url={images.about_main} mediaType="image" className="w-full h-full object-cover" alt="" />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-all duration-500" />
            <span className="absolute bottom-6 left-6 text-sm uppercase tracking-widest bg-black/50 px-4 py-2 rounded-lg">
              {aboutContent.experienceBadge}
            </span>
            <div className="absolute inset-0 border border-white/10 group-hover:border-white/30 transition-all duration-500 rounded-2xl" />
          </div>

          <div
            ref={(el) => { if (el) imagesRef.current[1] = el; }}
            className="relative h-[480px] w-[320px] overflow-hidden rounded-2xl shadow-2xl mt-16 group"
            style={{ perspective: "1000px" }}
          >
            <DriveMedia url={images.about_secondary} mediaType="image" className="w-full h-full object-cover" alt="" />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-all duration-500" />
            <div className="absolute inset-0 border border-white/10 group-hover:border-white/30 transition-all duration-500 rounded-2xl" />
          </div>
        </div>

        <div ref={textRef}>
          <span className="text-sm uppercase tracking-widest text-gray-400">
          {aboutContent.title}
          </span>
          <h2 ref={headingRef} className="text-4xl md:text-5xl font-semibold mt-4 mb-6 leading-tight cursor-pointer select-none">
             {aboutContent.heading}
          </h2>
          <p className="text-gray-400 max-w-xl mb-10 text-lg">
            {aboutContent.description}
          </p>
          <button
            ref={buttonRef}
            className="relative px-8 py-4 border border-white/30 hover:border-white/60 hover:bg-white hover:text-black transition-all duration-500 rounded-full font-medium"
          >
            Read More
          </button>
        </div>
      </div>
    </section>
  );
}
