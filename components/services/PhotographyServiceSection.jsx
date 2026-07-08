"use client";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ArrowRight } from "lucide-react";
import { toImageUrl, toPreviewUrl } from "@/lib/media";

const DEFAULT_IMAGE = "/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/23.webp";

export default function PhotographyServiceSection() {
  const sectionRef  = useRef(null);
  const heroTextRef = useRef(null);

  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState({
    heading:       "Moments Over",
    subheading:    "Our Services",
    paragraph:     "At Kutti Story, we act as your catalyst for profound memories.",
    heroImage:     DEFAULT_IMAGE,
    heroImageType: "image",
    heroVideo:     "",
    heroVideoType: "video",
  });

  useEffect(() => {
    fetch("/api/services-page")
      .then((r) => r.json())
      .then((data) => {
        const h = data.settings?.hero;
        if (h) {
          setSettings({
            heading:       h.heading       || "Moments Over",
            subheading:    h.subheading    || "Our Services",
            paragraph:     h.paragraph     || "At Kutti Story, we act as your catalyst for profound memories.",
            heroImage:     h.heroImage     || DEFAULT_IMAGE,
            heroImageType: h.heroImageType || "image",
            heroVideo:     h.heroVideo     || "",
            heroVideoType: h.heroVideoType || "video",
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(".glow-1", { x: 50,  y: 30, duration: 8,  repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(".glow-2", { x: -40, y: 50, duration: 10, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 1 });
      gsap.from(heroTextRef.current, { y: 60, opacity: 0, duration: 1.2, ease: "power4.out" });
    }, sectionRef);
    return () => ctx.revert();
  }, [settings]);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = heroTextRef.current.getBoundingClientRect();
    const xRel = (clientX - left) / width - 0.5;
    const yRel = (clientY - top) / height - 0.5;
    gsap.to(heroTextRef.current, {
      x: xRel * 20, y: yRel * 10,
      rotationY: xRel * 15, rotationX: -yRel * 15,
      skewX: xRel * 5,
      duration: 0.6, ease: "power2.out", transformPerspective: 1000,
    });
  };

  const handleMouseLeave = () => {
    gsap.to(heroTextRef.current, {
      x: 0, y: 0, rotationY: 0, rotationX: 0, skewX: 0,
      duration: 1, ease: "elastic.out(1, 0.5)",
    });
  };

  // If a heroVideo is set, it takes priority over heroImage
  const useVideo    = !!settings.heroVideo;
  const mediaUrl    = useVideo ? settings.heroVideo    : (settings.heroImage || DEFAULT_IMAGE);
  const mediaType   = useVideo ? settings.heroVideoType : settings.heroImageType;

  // Convert Drive share URL → renderable URL based on explicit stored type
  const renderUrl = mediaType === "video"
    ? toPreviewUrl(mediaUrl)          // Drive /preview embed for <iframe>
    : toImageUrl(mediaUrl, 1600);     // lh3 CDN direct image for <img>

  if (loading) {
    return (
      <section className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-lg">What We Capture...</div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative bg-[#0a0a0a] min-h-screen text-white overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="glow-1 absolute top-[5%] right-[10%] w-[400px] h-[400px] bg-orange-500/10 blur-[100px] rounded-full" />
        <div className="glow-2 absolute bottom-[15%] left-[5%] w-[500px] h-[500px] bg-zinc-800/20 blur-[130px] rounded-full" />
      </div>

      <div className="relative z-10 grid lg:grid-cols-2 gap-12 px-6 md:px-20 pt-32 pb-32">

        {/* Left — text */}
        <div
          ref={heroTextRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="flex flex-col justify-center cursor-default"
        >
          {settings.subheading && (
            <p className="text-orange-500 font-mono text-xs tracking-[0.4em] uppercase mb-4">
              {settings.subheading}
            </p>
          )}
          <h1 className="text-6xl md:text-8xl font-light leading-[0.9] tracking-tighter mb-8 pointer-events-none">
            {settings.heading.includes("—") ? (
              <>
                {settings.heading.split("—")[0].trim()} —{" "}
                <br />
                <span className="font-medium text-orange-500">
                  {settings.heading.split("—")[1]?.trim()}
                </span>
              </>
            ) : (
              settings.heading
            )}
          </h1>
          <p className="text-zinc-400 text-lg max-w-md mb-10 leading-relaxed pointer-events-none">
            {settings.paragraph}
          </p>
          <Link href="/works">
          <button className="flex items-center gap-3 bg-orange-500 px-8 py-4 rounded-full w-fit group transition-all hover:bg-orange-600">
            Explore Gallery
            <div className="bg-white text-orange-500 rounded-full p-1 group-hover:translate-x-1 transition-transform">
              <ArrowRight size={18} />
            </div>
          </button>
          </Link>
        </div>

        {/* Right — media */}
        <div className="relative h-[450px] lg:h-[600px] rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
          {mediaType === "video" ? (
            <iframe
              src={renderUrl}
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title="Hero Video"
            />
          ) : (
            <img
              src={renderUrl}
              alt="Services Hero"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = DEFAULT_IMAGE;
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        </div>

      </div>
    </section>
  );
}