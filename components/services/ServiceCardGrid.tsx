"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Send, ArrowRight } from "lucide-react";
import { toImageUrl, toPreviewUrl } from "@/lib/media";

interface CardGridSettings {
  whatsappCardTitle: string;
  whatsappCardPlaceholder: string;
  storytellingCardTitle: string;
  storytellingCardDescription: string;
  storytellingCardImage: string;
  storytellingCardImageType: string;
  storytellingCardLearnMoreLink: string;
  expertCardTitle: string;
  expertCount: string;
  expertCardTagline: string;
}

const DEFAULTS: CardGridSettings = {
  whatsappCardTitle:             "Guidance you can trust",
  whatsappCardPlaceholder:       "Ask us anything...",
  storytellingCardTitle:         "Candid Storytelling",
  storytellingCardDescription:   "Starting your journey of memories today.",
  storytellingCardImage:         "",
  storytellingCardImageType:     "image",
  storytellingCardLearnMoreLink: "/works",
  expertCardTitle:               "A New Dimension of Wellness",
  expertCount:                   "52+",
  expertCardTagline:             "join with us",
};

export default function ServiceCardGrid() {
  const containerRef     = useRef<HTMLDivElement>(null);
  const [whatsappMsg,    setWhatsappMsg]    = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("919342013600");
  const [settings,       setSettings]       = useState<CardGridSettings>(DEFAULTS);
  const [ready,          setReady]          = useState(false);

  useEffect(() => {
    // Load card grid settings + showcase from services-page
    fetch("/api/services-page")
      .then((r) => r.json())
      .then((data) => {
        const g = data.settings?.cardGrid;
        if (g) {
          setSettings({
            whatsappCardTitle:             g.whatsappCardTitle             || DEFAULTS.whatsappCardTitle,
            whatsappCardPlaceholder:       g.whatsappCardPlaceholder       || DEFAULTS.whatsappCardPlaceholder,
            storytellingCardTitle:         g.storytellingCardTitle         || DEFAULTS.storytellingCardTitle,
            storytellingCardDescription:   g.storytellingCardDescription   || DEFAULTS.storytellingCardDescription,
            storytellingCardImage:         g.storytellingCardImage         ?? DEFAULTS.storytellingCardImage,
            storytellingCardImageType:     g.storytellingCardImageType     || "image",
            storytellingCardLearnMoreLink: g.storytellingCardLearnMoreLink || DEFAULTS.storytellingCardLearnMoreLink,
            expertCardTitle:               g.expertCardTitle               || DEFAULTS.expertCardTitle,
            expertCount:                   g.expertCount                   || DEFAULTS.expertCount,
            expertCardTagline:             g.expertCardTagline             || DEFAULTS.expertCardTagline,
          });
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));

    // WhatsApp number from contact settings
    fetch("/api/contact")
      .then((r) => r.json())
      .then((data) => {
        const raw: string = data.settings?.whatsapp || data.settings?.phone || "";
        const digits = raw.replace(/\D/g, "");
        if (digits.length >= 10) setWhatsappNumber(digits);
      })
      .catch(() => {});
  }, []);

  // Run GSAP only after data is loaded so elements exist
  useEffect(() => {
    if (!ready) return;
    const ctx = gsap.context(() => {
      gsap.from(".sg-card", {
        y: 40, opacity: 0, duration: 0.8, stagger: 0.2, ease: "power3.out",
      });
    }, containerRef);
    return () => ctx.revert();
  }, [ready]);

  const handleWhatsAppRedirect = () => {
    if (!whatsappMsg.trim()) return;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMsg)}`, "_blank");
  };

  // Resolve Drive URL to renderable URL based on stored mediaType
  const storyIsVideo   = settings.storytellingCardImageType === "video";
  const storyRenderUrl = settings.storytellingCardImage
    ? storyIsVideo
      ? toPreviewUrl(settings.storytellingCardImage)
      : toImageUrl(settings.storytellingCardImage, 400)
    : "";

  return (
    <div ref={containerRef} className="w-full bg-[#0a0a0a] py-10">
      <div className="relative z-10 grid lg:grid-cols-3 gap-6 px-6 md:px-20">

        {/* CARD 1 — WhatsApp */}
        <div className="sg-card backdrop-blur-xl bg-white/5 border border-white/10 rounded-[2.5rem] p-10 flex flex-col justify-between h-[320px]">
          <h3 className="text-2xl font-medium text-white leading-tight">
            {settings.whatsappCardTitle}
          </h3>
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder={settings.whatsappCardPlaceholder}
              value={whatsappMsg}
              onChange={(e) => setWhatsappMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleWhatsAppRedirect()}
              className="w-full bg-white/10 border border-white/10 rounded-full py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-white placeholder:text-zinc-500"
            />
            <button
              onClick={handleWhatsAppRedirect}
              className="absolute right-2 bg-orange-500 p-2.5 rounded-full hover:scale-110 active:scale-95 transition-all shadow-lg"
            >
              <Send size={18} className="text-white" />
            </button>
          </div>
        </div>

        {/* CARD 2 — Storytelling */}
        <div className="sg-card group relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex gap-6 items-center overflow-hidden h-[320px]">
          <div className="relative w-32 h-44 rounded-2xl overflow-hidden shrink-0 shadow-xl bg-zinc-800">
            {storyRenderUrl && (
              storyIsVideo ? (
                <iframe
                  src={storyRenderUrl}
                  className="w-full h-full border-0"
                  allow="autoplay; encrypted-media"
                  title={settings.storytellingCardTitle}
                />
              ) : (
                <img
                  src={storyRenderUrl}
                  alt={settings.storytellingCardTitle}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
                />
              )
            )}
          </div>
          <div>
            <h4 className="text-xl font-medium text-white mb-2">{settings.storytellingCardTitle}</h4>
            <p className="text-zinc-400 text-sm mb-6 leading-snug">{settings.storytellingCardDescription}</p>
            <a
              href={settings.storytellingCardLearnMoreLink || "/works"}
              className="text-xs uppercase tracking-[0.2em] font-semibold text-orange-500 flex items-center gap-2 group/btn"
            >
              Learn More
              <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>

        {/* CARD 3 — Experts */}
        <div className="sg-card backdrop-blur-xl bg-white/5 border border-white/10 rounded-[2.5rem] p-10 flex flex-col justify-between h-[320px]">
          <h3 className="text-2xl font-medium text-white leading-tight">
            {settings.expertCardTitle}
          </h3>
          <div className="flex items-center gap-4 mt-6">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-12 h-12 rounded-full border-2 border-[#0a0a0a] bg-zinc-800" />
              ))}
            </div>
            <div className="text-sm">
              <p className="text-orange-500 font-bold text-lg">{settings.expertCount} Experts</p>
              <p className="text-zinc-400">{settings.expertCardTagline}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}