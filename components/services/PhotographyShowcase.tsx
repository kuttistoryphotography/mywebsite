"use client";

import { useEffect, useState } from "react";
import { toImageUrl } from "@/lib/media";

const GRID_CLASSES = [
  "md:col-span-2 md:row-span-2",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-2 md:row-span-1",
  "md:col-span-1 md:row-span-2",
  "md:col-span-1 md:row-span-1",
  "md:col-span-2 md:row-span-1",
];

const DEFAULT_SERVICES = [
  { title: "Wedding Photography",  src: "/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/11.webp", className: GRID_CLASSES[0], link: "/works" },
  { title: "Pre Wedding",          src: "/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/12.webp", className: GRID_CLASSES[1], link: "/works" },
  { title: "Candid Moments",       src: "/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/13.webp", className: GRID_CLASSES[2], link: "/works" },
  { title: "Baby Shoot",           src: "/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/14.webp", className: GRID_CLASSES[3], link: "/works" },
  { title: "Drone Cinematic",      src: "/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/15.webp", className: GRID_CLASSES[4], link: "/works" },
  { title: "Commercial Ads",       src: "/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/16.webp", className: GRID_CLASSES[5], link: "/works" },
  { title: "Product Shoot",        src: "/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/17.webp", className: GRID_CLASSES[6], link: "/works" },
];

interface ServiceItem {
  title: string;
  src: string;
  className: string;
  link: string;
}

export default function PhotographyShowcase() {
  const [heading,     setHeading]     = useState("Our Services");
  const [subheading,  setSubheading]  = useState("");
  const [description, setDescription] = useState("Every frame tells a story. Discover our range of photography services.");
  const [services,    setServices]    = useState<ServiceItem[]>(DEFAULT_SERVICES);

  useEffect(() => {
    // Fetch showcase header copy
    fetch("/api/services-page")
      .then((r) => r.json())
      .then((data) => {
        const s = data.settings?.showcase;
        if (s?.heading)     setHeading(s.heading);
        if (s?.subheading)  setSubheading(s.subheading);
        if (s?.description) setDescription(s.description);
      })
      .catch(() => {});

    // Fetch service tiles
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => {
        if (data.services?.length >= 1) {
          const mapped: ServiceItem[] = data.services.slice(0, 7).map((svc: any, i: number) => ({
            title:     svc.title,
            // Convert Drive URL → renderable lh3 URL; fall back to local default
            src:       svc.coverImage
                         ? toImageUrl(svc.coverImage, 800)
                         : DEFAULT_SERVICES[i % DEFAULT_SERVICES.length].src,
            className: GRID_CLASSES[i % GRID_CLASSES.length],
            link:      "/works",
          }));
          setServices(mapped);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="bg-[#0a0a0a] py-20 px-6 md:px-16">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-12 text-center">
          {subheading && (
            <p className="text-orange-500 font-mono text-xs tracking-[0.4em] uppercase mb-3">
              {subheading}
            </p>
          )}
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">{heading}</h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">{description}</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[220px] gap-4">
          {services.map((item, i) => (
            <a
              key={i}
              href={item.link}
              className={`group relative overflow-hidden rounded-2xl cursor-pointer ${item.className}`}
            >
              <img
                src={item.src}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.2"; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 p-5">
                <h3 className="text-white font-bold text-lg group-hover:text-orange-400 transition-colors">
                  {item.title}
                </h3>
              </div>
            </a>
          ))}
        </div>

      </div>
    </section>
  );
}