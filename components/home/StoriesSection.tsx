"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DriveMedia } from "@/components/ui/DriveMedia";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface StoryImage { src: string; alt: string; }

const DEFAULT_IMAGES: StoryImage[] = [
  { src: "/01.webp", alt: "Story 1" }, { src: "/02.webp", alt: "Story 2" },
  { src: "/03.webp", alt: "Story 3" }, { src: "/04.webp", alt: "Story 4" },
  { src: "/05.webp", alt: "Story 5" }, { src: "/06.webp", alt: "Story 6" },
  { src: "/07.webp", alt: "Story 7" }, { src: "/08.webp", alt: "Story 8" },
];

export default function StoriesSection() {
  const containerRef  = useRef<HTMLDivElement>(null);
  const stripsRef     = useRef<HTMLDivElement[]>([]);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [images, setImages] = useState<StoryImage[]>(DEFAULT_IMAGES);

  useEffect(() => {
    fetch("/api/homepage")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings?.storyImages?.length) setImages(data.settings.storyImages);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(stripsRef.current, { y: 120, opacity: 0 }, {
        y: 0, opacity: 1, stagger: 0.12, duration: 1.3, ease: "power4.out",
        scrollTrigger: { trigger: containerRef.current, start: "top 75%" },
      });
    }, containerRef);
    return () => ctx.revert();
  }, [images]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let particles: any[] = [];
    let animationFrameId: number;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };

    class Particle {
      x: number; y: number; size: number; speedX: number; speedY: number; opacity: number;
      constructor(x: number, y: number) {
        this.x = x; this.y = y;
        this.size   = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 2;
        this.speedY = (Math.random() - 0.5) * 2;
        this.opacity = 1;
      }
      update() { this.x += this.speedX; this.y += this.speedY; this.opacity -= 0.015; }
      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(255, 215, 0, ${this.opacity})`;
        ctx.shadowBlur = 10; ctx.shadowColor = "#ffd700";
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (hoveredIndex !== null) {
        for (let i = 0; i < 3; i++) particles.push(new Particle(e.clientX, e.clientY));
      }
    };
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles = particles.filter((p) => p.opacity > 0);
      particles.forEach((p) => { p.update(); p.draw(); });
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    resize(); animate();
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [hoveredIndex]);

  const handleHover = (index: number) => {
    setHoveredIndex(index);
    stripsRef.current.forEach((el, i) => {
      if (!el) return;
      gsap.to(el, { flexGrow: i === index ? 4 : 0.8, duration: 0.6, ease: "power3.out" });
    });
  };
  const handleLeave = () => {
    setHoveredIndex(null);
    stripsRef.current.forEach((el, i) => {
      if (!el) return;
      gsap.to(el, { flexGrow: i === 0 ? 4 : 1, duration: 0.6, ease: "power3.out" });
    });
  };

  return (
    <section ref={containerRef} className="relative bg-black text-white py-28 px-6 md:px-16 min-h-screen overflow-hidden">
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />
      <div className="text-center mb-20 relative z-10">
        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight">
          HERE OUR <span className="text-red-600">STORIES</span>
        </h2>
      </div>
      <div className="relative flex items-center justify-center gap-3 md:gap-5 h-[520px] md:h-[620px] max-w-7xl mx-auto z-10">
        {images.map((item, i) => (
          <div
            key={i}
            ref={(el) => { if (el) stripsRef.current[i] = el; }}
            onMouseEnter={() => handleHover(i)}
            onMouseLeave={handleLeave}
            className={`relative h-full overflow-hidden rounded-[48px] md:rounded-[64px] cursor-pointer flex-grow transition-all duration-500 ${
              i === 0 ? "flex-[4] min-w-[260px]" : "flex-[1] min-w-[60px] md:min-w-[80px]"
            }`}
          >
            <DriveMedia
              url={item.src}
              mediaType="image"
              className="absolute inset-0 w-full h-full object-cover scale-110"
              alt={item.alt}
            />
            <div
              className={`absolute inset-0 bg-yellow-500/10 transition-opacity duration-500 ${
                hoveredIndex === i ? "opacity-40" : "opacity-0"
              }`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-5 mt-16 relative z-10">
        <a href="/booking">
          <button className="bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-full font-bold uppercase text-xs tracking-widest transition">
            Tell My Story
          </button>
        </a>
        <a href="/works">
          <button className="border border-white/20 hover:bg-white/10 text-white px-10 py-4 rounded-full font-bold uppercase text-xs tracking-widest transition">
            See All Stories
          </button>
        </a>
      </div>
    </section>
  );
}
