"use client";

import { useState, useEffect, useCallback } from "react";
import { Heart, Trash2, Camera, Images, Loader2, Play, Image as ImageIcon, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toDirectImageUrl, makeMediaItem } from "@/lib/media";
import { DriveLightbox } from "@/components/ui/DriveMedia";

interface Favorite {
  id: string;
  itemType: "portfolio" | "album" | "media";
  itemId: string;
  title: string;
  coverImage?: string | null;
  mediaUrl?: string | null;
  mediaType?: "image" | "video" | null;
  category?: string | null;
  slug?: string | null;
  parentTitle?: string | null;
  parentType?: "album" | "portfolio" | null;
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  wedding: "Wedding", "pre-wedding": "Pre Wedding", outdoor: "Outdoor",
  "baby-shoot": "Baby Shoot", product: "Product", corporate: "Corporate",
  ads: "Ads", "food-shoot": "Food Shoot", other: "Other",
};

/**
 * Determine if a favourite should be treated as video.
 * Prefer the stored mediaType field; fall back to URL sniffing for legacy
 * Cloudinary items that pre-date the mediaType column.
 * Drive URLs never have .mp4 extensions so URL-sniffing is useless for them.
 */
function isVideo(fav: Favorite): boolean {
  if (fav.mediaType === "video") return true;
  if (fav.mediaType === "image") return false;
  const url = fav.mediaUrl || fav.coverImage || "";
  return /\.(mp4|webm|ogg|mov)($|\?)/i.test(url) || url.includes("/video/upload/");
}

/* ── Single favourite card ── */
function FavCard({ fav, onRemove, removing, onPreview }: {
  fav: Favorite;
  onRemove: () => void;
  removing: boolean;
  onPreview: () => void;
}) {
  const thumbUrl   = fav.itemType === "media" ? (fav.mediaUrl || fav.coverImage) : fav.coverImage;
  const isVidThumb = isVideo(fav);

  const badgeConfig = {
    portfolio: { icon: Camera,   label: "Photo",  cls: "bg-amber-500/20 text-amber-300 border-amber-500/30"   },
    album:     { icon: Images,   label: "Album",  cls: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
    media:     {
      icon:  fav.mediaType === "video" ? Film : ImageIcon,
      label: fav.mediaType === "video" ? "Video" : "Image",
      cls:   "bg-blue-500/20 text-blue-300 border-blue-500/30",
    },
  }[fav.itemType] ?? { icon: Camera, label: "Item", cls: "bg-zinc-700 text-zinc-400 border-zinc-600" };

  const BadgeIcon = badgeConfig.icon;

  return (
    <div className="group relative bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-all duration-200 hover:-translate-y-0.5">
      <div className="relative h-44 bg-zinc-800 overflow-hidden cursor-pointer" onClick={onPreview}>
        {thumbUrl ? (
          isVidThumb ? (
            /* Video card: show Drive poster frame + play overlay */
            <div className="relative w-full h-full">
              <img
                src={
                  thumbUrl.includes("res.cloudinary.com")
                    ? thumbUrl.replace("/upload/", "/upload/c_fill,w_400,h_300,q_auto,f_auto/")
                    : thumbUrl.includes("drive.google.com") || thumbUrl.includes("lh3.google")
                    ? `https://lh3.googleusercontent.com/d/${thumbUrl.match(/\/d\/([a-zA-Z0-9_-]{10,})/)?.[1] || ""}=w400`
                    : thumbUrl
                }
                alt={fav.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-5 h-5 text-white ml-0.5" />
                </div>
              </div>
            </div>
          ) : (
            <img
              src={toDirectImageUrl(thumbUrl)}
              alt={fav.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="w-8 h-8 text-zinc-600" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

        {/* Type badge */}
        <div className={cn("absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-sm", badgeConfig.cls)}>
          <BadgeIcon className="w-2.5 h-2.5" />
          {badgeConfig.label}
        </div>

        {/* Remove */}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          disabled={removing}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
          title="Remove from favourites"
        >
          {removing
            ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            : <Trash2 className="w-3.5 h-3.5 text-white" />}
        </button>

        <div className="absolute bottom-2 right-2">
          <Heart className="w-4 h-4 text-red-500 fill-red-500 drop-shadow" />
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-white text-sm leading-snug line-clamp-1">{fav.title}</h3>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          {fav.itemType === "media" && fav.parentTitle ? (
            <p className="text-zinc-500 text-xs truncate">From: {fav.parentTitle}</p>
          ) : fav.category ? (
            <p className="text-zinc-500 text-xs truncate">{CATEGORY_LABELS[fav.category] ?? fav.category}</p>
          ) : <span />}
        </div>
      </div>
    </div>
  );
}

/* ── MAIN ── */
export default function FavoritesSection() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<"all" | "portfolio" | "album" | "media">("all");
  const [removing,  setRemoving]  = useState<string | null>(null);
  const [preview,   setPreview]   = useState<Favorite | null>(null);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/favorites");
      const data = await res.json();
      setFavorites(data.favorites || []);
    } catch { setFavorites([]); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  const remove = async (fav: Favorite) => {
    setRemoving(fav.id);
    try {
      await fetch(`/api/favorites?id=${fav.id}`, { method: "DELETE" });
      setFavorites((prev) => prev.filter((f) => f.id !== fav.id));
    } finally { setRemoving(null); }
  };

  const counts = {
    all:       favorites.length,
    portfolio: favorites.filter((f) => f.itemType === "portfolio").length,
    album:     favorites.filter((f) => f.itemType === "album").length,
    media:     favorites.filter((f) => f.itemType === "media").length,
  };

  const filtered = filter === "all" ? favorites : favorites.filter((f) => f.itemType === filter);

  /**
   * Build a single-item MediaItem array for DriveLightbox.
   * Uses the stored mediaType — so videos open as iframe autoplay,
   * images open as <img>, exactly like the works page.
   */
  const previewItems = preview
    ? [
        makeMediaItem(
          preview.itemType === "media"
            ? (preview.mediaUrl || preview.coverImage || "")
            : (preview.coverImage || ""),
          (preview.mediaType as "image" | "video") || "image",
          { caption: preview.title }
        ),
      ]
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" /> My Favourites
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {favorites.length} saved item{favorites.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {([
            { key: "all",       label: `All (${counts.all})`         },
            { key: "portfolio", label: `Photos (${counts.portfolio})` },
            { key: "album",     label: `Albums (${counts.album})`     },
            { key: "media",     label: `Media (${counts.media})`      },
          ] as const).map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                filter === key
                  ? "bg-amber-500 text-black border-amber-500"
                  : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white"
              )}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-300">
            {filter === "all" ? "No favourites yet" : `No ${filter} favourites`}
          </h3>
          <p className="text-sm text-zinc-500 mt-2 max-w-xs mx-auto">
            Tap the ♥ on any cover image, or on any photo/video inside a gallery, to save it here.
          </p>
          <Link href="/works"
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-sm font-semibold transition-colors">
            Browse Works
          </Link>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filtered.map((fav) => (
            <FavCard
              key={fav.id}
              fav={fav}
              removing={removing === fav.id}
              onRemove={() => remove(fav)}
              onPreview={() => setPreview(fav)}
            />
          ))}
        </div>
      )}

      {/* 
        Preview — reuses DriveLightbox exactly as the works page does.
        Images  → <img> via lh3 CDN
        Videos  → <iframe src={toAutoplayUrl}> with autoplay + fullscreen
      */}
      {preview && previewItems.length > 0 && (
        <DriveLightbox
          items={previewItems}
          title={preview.title}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}