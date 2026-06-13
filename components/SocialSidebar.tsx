"use client";

import { useEffect, useState } from "react";

interface SocialLinks {
  whatsapp: string;
  instagramUrl: string;
  twitterUrl: string;
  telegramUrl: string;
  youtubeUrl: string;
}

// SVG icon definitions — unique branded shapes, no external lib needed
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const TwitterXIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);


const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M23.498 6.186a2.997 2.997 0 0 0-2.11-2.12C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.388.566a2.997 2.997 0 0 0-2.11 2.12C0 8.08 0 12 0 12s0 3.92.502 5.814a2.997 2.997 0 0 0 2.11 2.12C4.495 20.5 12 20.5 12 20.5s7.505 0 9.388-.566a2.997 2.997 0 0 0 2.11-2.12C24 15.92 24 12 24 12s0-3.92-.502-5.814zM9.75 15.568V8.432L15.818 12 9.75 15.568z" />
  </svg>
);

interface SocialItem {
  key: keyof SocialLinks;
  label: string;
  Icon: React.FC;
  color: string;
  glowColor: string;
  href: (val: string) => string;
}

const SOCIALS: SocialItem[] = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    Icon: WhatsAppIcon,
    color: "#25D366",
    glowColor: "rgba(37,211,102,0.5)",
    href: (v) => `https://wa.me/${v.replace(/[^0-9]/g, "")}`,
  },
  {
    key: "instagramUrl",
    label: "Instagram",
    Icon: InstagramIcon,
    color: "#E1306C",
    glowColor: "rgba(225,48,108,0.5)",
    href: (v) => v,
  },
  {
    key: "twitterUrl",
    label: "X / Twitter",
    Icon: TwitterXIcon,
    color: "#ffffff",
    glowColor: "rgba(255,255,255,0.35)",
    href: (v) => v,
  },
  
  {
    key: "telegramUrl",
    label: "Telegram",
    Icon: TelegramIcon,
    color: "#26A5E4",
    glowColor: "rgba(38,165,228,0.5)",
    href: (v) => v,
  },
  {
    key: "youtubeUrl",
    label: "YouTube",
    Icon: YouTubeIcon,
    color: "#FF0000",
    glowColor: "rgba(255, 0, 0, 0.35)",
    href: (v) => v,
  },  
];

export default function SocialSidebar() {
  const [links, setLinks] = useState<SocialLinks>({
    whatsapp: "",
    instagramUrl: "",
    twitterUrl: "",
    telegramUrl: "",
    youtubeUrl: ""
  });

  useEffect(() => {
    fetch("/api/contact")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setLinks({
            whatsapp: data.settings.whatsapp || "",
            instagramUrl: data.settings.instagramUrl || "",
            twitterUrl: data.settings.twitterUrl || "",
            telegramUrl: data.settings.telegramUrl || "",
            youtubeUrl: data.settings.youtubeUrl || "",
          });
        }
      })
      .catch(() => {});
  }, []);

  // Only render icons that have a value configured
  const active = SOCIALS.filter((s) => links[s.key]);
  if (active.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes social-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 var(--glow); }
          50%       { opacity: 0.7; box-shadow: 0 0 14px 6px var(--glow); }
        }
        .social-btn {
          animation: social-pulse 2.4s ease-in-out infinite;
        }
        .social-btn:nth-child(2) { animation-delay: 0.6s; }
        .social-btn:nth-child(3) { animation-delay: 1.2s; }
        .social-btn:nth-child(4) { animation-delay: 1.8s; }
        .social-btn:hover {
          animation: none !important;
          transform: scale(1.18) translateX(-4px);
          opacity: 1 !important;
        }
      `}</style>

      <div
      className="
      hidden md:flex
      fixed
      right-3
      top-1/2
      -translate-y-1/2
      z-[200]
      flex-col
      gap-3
      "
>
        {active.map((s) => {
          const url = links[s.key];
          return (
            <a
              key={s.key}
              href={s.href(url)}
              target="_blank"
              rel="noopener noreferrer"
              title={s.label}
              className="social-btn flex items-center justify-center w-11 h-11 rounded-full transition-transform duration-300 ease-out cursor-pointer"
              style={{
                backgroundColor: "#111",
                color: s.color,
                border: `1.5px solid ${s.color}55`,
                // @ts-ignore
                "--glow": s.glowColor,
              }}
            >
              <s.Icon />
            </a>
          );
        })}
      </div>
    </>
  );
}
