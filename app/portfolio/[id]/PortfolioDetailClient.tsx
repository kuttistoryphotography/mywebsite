"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ArrowLeft, Calendar, MapPin, User, Images } from "lucide-react";
import { DriveThumbnail, DriveLightbox } from "@/components/ui/DriveMedia";
import { MediaItem, MediaType, makeMediaItem, toImageUrl } from "@/lib/media";

interface PortfolioItem {
  id:              string;
  title:           string;
  slug:            string;
  category:        string;
  description:     string | null;
  cover_image:     string | null;
  coverMediaType:  MediaType;
  // Typed media array (new)
  media:           Array<{ url: string; mediaType: MediaType; caption?: string }>;
  // Legacy (used as fallback)
  images:          string[];
  image_count:     number;
  tags:            string[];
  featured:        boolean;
  event_date:      string | null;
  location:        string | null;
  client_name:     string | null;
  created_at:      string;
}

export default function PortfolioDetailClient({ id }: { id: string }) {
  const [item,         setItem]         = useState<PortfolioItem | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [lightboxIdx,  setLightboxIdx]  = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const res  = await fetch(`/api/portfolio/${id}`);
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Not found"); return; }
        setItem(data.item);
      } catch { setError("Failed to load portfolio item"); }
      finally  { setLoading(false); }
    })();
  }, [id]);

  useEffect(() => {
    if (item && contentRef.current) {
      gsap.fromTo(contentRef.current.children,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power2.out" }
      );
    }
  }, [item]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  // Build typed MediaItems for lightbox
  const allMedia: MediaItem[] = item ? [
    ...(item.cover_image
      ? [makeMediaItem(item.cover_image, item.coverMediaType || "image")]
      : []),
    ...(item.media?.length
      ? item.media
          .filter((m) => m.url && m.url !== item.cover_image)
          .map((m) => makeMediaItem(m.url, m.mediaType, { caption: m.caption }))
      : item.images
          .filter((url) => url && url !== item.cover_image)
          .map((url) => makeMediaItem(url, "image"))
    ),
  ] : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 text-xl">{error || "Not found"}</p>
        <Link href="/works" className="text-orange-500 hover:text-orange-400 underline">← Back to works</Link>
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-black text-white">
        {/* Hero */}
        <div className="relative h-[70vh] overflow-hidden">
          {item.cover_image ? (
            item.coverMediaType === "video" ? (
              <iframe
                src={
                item.cover_image.includes("res.cloudinary.com")
                  ? item.cover_image
                  : `https://drive.google.com/file/d/${item.cover_image.match(/\/d\/([^/?#]+)/)?.[1]}/preview?autoplay=1`
              }
                className="absolute inset-0 w-full h-full border-0"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            ) : (
              <img
                src={toImageUrl(item.cover_image, 2000)}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )
          ) : (
            <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
              <span className="text-zinc-700 text-9xl font-bold">{item.title.charAt(0)}</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

          <Link href="/works"
            className="absolute top-[120px] left-6 z-[9999] flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black/80 transition">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </Link>

          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
            <div className="max-w-5xl">
              <span className="inline-block px-4 py-1.5 bg-orange-500 text-black text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                {item.category}
              </span>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4">{item.title}</h1>
              {item.client_name && <p className="text-xl md:text-2xl text-zinc-300">{item.client_name}</p>}
            </div>
          </div>
        </div>

        {/* Content */}
        <div ref={contentRef} className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-24">
          {/* Meta */}
          <div className="flex flex-wrap gap-6 md:gap-10 mb-12 pb-12 border-b border-zinc-800">
            {item.event_date && (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-orange-500" />
                <div><p className="text-xs text-zinc-500 uppercase tracking-wider">Date</p><p className="font-medium">{formatDate(item.event_date)}</p></div>
              </div>
            )}
            {item.location && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-orange-500" />
                <div><p className="text-xs text-zinc-500 uppercase tracking-wider">Location</p><p className="font-medium">{item.location}</p></div>
              </div>
            )}
            {item.client_name && (
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-orange-500" />
                <div><p className="text-xs text-zinc-500 uppercase tracking-wider">Client</p><p className="font-medium">{item.client_name}</p></div>
              </div>
            )}
            {allMedia.length > 0 && (
              <div className="flex items-center gap-3">
                <Images className="w-5 h-5 text-orange-500" />
                <div><p className="text-xs text-zinc-500 uppercase tracking-wider">Media</p><p className="font-medium">{allMedia.length} files</p></div>
              </div>
            )}
          </div>

          {item.description && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold mb-4">About this shoot</h2>
              <p className="text-zinc-400 text-lg leading-relaxed max-w-3xl">{item.description}</p>
            </div>
          )}

          {/* Gallery — DriveThumbnail for every item (image/video/pdf) */}
          {allMedia.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-8">Gallery</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allMedia.map((m, i) => (
                  <div
                    key={i}
                    onClick={() => setLightboxIdx(i)}
                    className="relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer group bg-zinc-900"
                  >
                    <DriveThumbnail
                      url={m.url}
                      mediaType={m.mediaType}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      showBadge={m.mediaType !== "image"}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 text-white font-medium transition-opacity">View</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {item.tags?.length > 0 && (
            <div className="mt-16 pt-12 border-t border-zinc-800">
              <h3 className="text-sm text-zinc-500 uppercase tracking-wider mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag, i) => (
                  <span key={i} className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-sm">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-20 p-10 md:p-16 rounded-3xl bg-zinc-900 border border-zinc-800 text-center">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">Love what you see?</h3>
            <p className="text-zinc-400 mb-8 max-w-lg mx-auto">Let us capture your special moments with the same passion and creativity.</p>
            <Link href="/contact-us" className="inline-block px-8 py-4 bg-orange-500 text-black rounded-full font-bold hover:bg-orange-400 transition">
              Book Your Session
            </Link>
          </div>
        </div>
      </main>

      {/* Lightbox — handles all types with autoplay for video */}
      {lightboxIdx !== null && (
        <DriveLightbox
          items={allMedia}
          startIndex={lightboxIdx}
          title={item.title}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </>
  );
}
