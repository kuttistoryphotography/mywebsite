"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2, Heart, Camera, Images, ArrowRight, Play,
} from "lucide-react";
import { DriveThumbnail, DriveLightbox, AutoplayVideo } from "@/components/ui/DriveMedia";
import { MediaItem, MediaType, makeMediaItem, toImageUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

/* ─── useFavorites ── */
function useFavorites() {
  const [favIds, setFavIds] = useState(new Set());

  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((d) => setFavIds(new Set((d.favorites || []).map((f) => f.itemId))))
      .catch(() => {});
  }, []);

  const toggle = useCallback(async (item, itemType) => {
    const id    = String(item.id || item._id || "");
    const isFav = favIds.has(id);
    setFavIds((prev) => { const n = new Set(prev); isFav ? n.delete(id) : n.add(id); return n; });
    try {
      if (isFav) {
        await fetch(`/api/favorites?itemId=${encodeURIComponent(id)}&itemType=${itemType}`, { method: "DELETE" });
      } else {
        await fetch("/api/favorites", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemType, itemId: id, title: item.title,
            coverImage: item.cover_image || item.coverImage || null,
            category: item.category || null, slug: item.slug || null,
          }),
        });
      }
    } catch {
      setFavIds((prev) => { const n = new Set(prev); isFav ? n.add(id) : n.delete(id); return n; });
    }
  }, [favIds]);

  const toggleMedia = useCallback(async ({
    mediaUrl, mediaType, parentTitle, parentType, category,
  }) => {
    const id    = mediaUrl;
    const isFav = favIds.has(id);
    setFavIds((prev) => { const n = new Set(prev); isFav ? n.delete(id) : n.add(id); return n; });
    try {
      if (isFav) {
        await fetch(`/api/favorites?itemId=${encodeURIComponent(id)}&itemType=media`, { method: "DELETE" });
      } else {
        await fetch("/api/favorites", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemType:    "media",
            itemId:      id,
            title:       parentTitle,
            // For images: store as coverImage so the thumbnail shows immediately.
            // For videos: coverImage is null — FavCard uses mediaType field to render <video>.
            coverImage:  mediaType === "image" ? mediaUrl : null,
            mediaUrl:    mediaUrl,
            mediaType:   mediaType,   // ← "image" | "video" — critical for FavCard rendering
            category:    category     || null,
            parentTitle: parentTitle  || null,
            parentType:  parentType   || null,  // ← "album" | "portfolio", NOT "media"
          }),
        });
      }
    } catch {
      setFavIds((prev) => { const n = new Set(prev); isFav ? n.add(id) : n.delete(id); return n; });
    }
  }, [favIds]);

  return { favIds, toggle, toggleMedia };
}

/* ─── Constants ── */
const CATEGORY_ORDER = [
  "photography",
  "wedding",
  "pre-wedding",
  "post-wedding",
  "engagement",
  "reception",
  "outdoor",
  "indoor",
  "baby-shoot",
  "product",
  "corporate",
  "ads",
  "food-shoot",
  "album",
  "other",
];

const CATEGORY_META = {
  photography:        { label: "Photography",     accent: "#f97316" },
  wedding:        { label: "Wedding",     accent: "#f97316" },
  "pre-wedding":  { label: "Pre Wedding", accent: "#a855f7" },
  outdoor:        { label: "Outdoor",     accent: "#22c55e" },
  "baby-shoot":   { label: "Baby Shoot",  accent: "#ec4899" },
  product:        { label: "Product",     accent: "#3b82f6" },
  corporate:      { label: "Corporate",   accent: "#f59e0b" },
  ads:            { label: "Ads",         accent: "#ef4444" },
  "food-shoot":   { label: "Food Shoot",  accent: "#84cc16" },
  album:          { label: "Album",       accent: "#06b6d4" },
  other:          { label: "Other",       accent: "#94a3b8" },
  "post-wedding": { label: "Post Wedding",  accent: "#8b5cf6", },
  engagement:     {  label: "Engagement", accent: "#ec4899",},
  indoor:         {  label: "Indoor",     accent: "#14b8a6", },
  reception:      {  label: "Reception",  accent: "#f43f5e", },
};
const getLabel  = (cat) => CATEGORY_META[cat]?.label  ?? cat;
const getAccent = (cat) => CATEGORY_META[cat]?.accent ?? "#f97316";
const PREVIEW_COUNT = 8;

/* ─── Build typed MediaItems from portfolio or album ── */
function portfolioToMediaItems(item) {
  const items = [];
  const coverImage = item.cover_image || item.coverImage;
  const coverType  = item.coverMediaType || "image";
  if (coverImage) items.push(makeMediaItem(coverImage, coverType));
  if (Array.isArray(item.media) && item.media.length) {
    item.media.forEach((m) => {
      if (m.url && m.url !== coverImage)
        items.push(makeMediaItem(m.url, m.mediaType || "image", { caption: m.caption }));
    });
  } else if (Array.isArray(item.images)) {
    item.images.forEach((url) => {
      if (url && url !== coverImage) items.push(makeMediaItem(url, "image"));
    });
  }
  return items;
}

function albumToMediaItems(album) {
  const items = [];
  if (album.coverImage)
    items.push(makeMediaItem(album.coverImage, album.coverMediaType || "image"));
  (album.media || []).forEach((m) => {
    if (m.url && m.url !== album.coverImage)
      items.push(makeMediaItem(m.url, m.mediaType || "image", { caption: m.caption }));
  });
  return items;
}

/* ─── PortfolioCard ── */
function PortfolioCard({ item, onOpen, isFav, onFavToggle }) {
  const accent     = getAccent(item.category);
  const coverType  = item.coverMediaType || "image";
  const coverImage = item.cover_image || item.coverImage;
  const mediaCount =
    (item.media?.length || item.images?.length || 0) + (coverImage ? 1 : 0);

  return (
    <article className="group cursor-pointer rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50 relative">
      <button onClick={(e) => { e.stopPropagation(); onFavToggle(); }}
        className="absolute top-2.5 left-2.5 z-20 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:scale-110 hover:bg-black/80 transition-all">
        <Heart className={cn("w-4 h-4 transition-colors", isFav ? "text-red-500 fill-red-500" : "text-white/70")} />
      </button>

      <div onClick={onOpen} className="relative h-56 overflow-hidden bg-zinc-900">
        {coverImage ? (
          coverType === "video" ? (
            <AutoplayVideo url={coverImage} className="w-full h-full border-0" />
          ) : (
            <DriveThumbnail url={coverImage} mediaType={coverType}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" showBadge={false} />
          )
        ) : (
          <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
            <Camera className="w-10 h-10 text-zinc-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {coverType === "video" && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2.5 py-1">
            <Play className="w-3 h-3 text-white" /><span className="text-white text-[10px] font-semibold">Video</span>
          </div>
        )}
        {mediaCount > 1 && (
          <div className="absolute bottom-2.5 right-2.5 bg-black/70 text-white text-[11px] font-semibold px-2 py-1 rounded-full">+{mediaCount - 1}</div>
        )}
      </div>

      <div onClick={onOpen} className="p-3.5">
        <h3 className="font-bold text-white text-sm line-clamp-1 mb-1">{item.title}</h3>
        <div className="flex items-center justify-between gap-2">
          <p className="text-zinc-500 text-xs truncate">{item.client_name || item.clientName || item.location || ""}</p>
          <span className="text-[10px] font-black uppercase tracking-wider shrink-0" style={{ color: accent }}>{getLabel(item.category)}</span>
        </div>
      </div>
    </article>
  );
}

/* ─── AlbumCard ── */
function AlbumCard({ album, onOpen, isFav, onFavToggle }) {
  const accent     = getAccent(album.category);
  const coverType  = album.coverMediaType || "image";
  const totalCount = (album.coverImage ? 1 : 0) + (album.media?.length || 0);

  return (
    <article className="group rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50 relative">
      <button onClick={(e) => { e.stopPropagation(); onFavToggle(); }}
        className="absolute top-2.5 left-2.5 z-20 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:scale-110 hover:bg-black/80 transition-all">
        <Heart className={cn("w-4 h-4", isFav ? "text-red-500 fill-red-500" : "text-white/70")} />
      </button>

      <div onClick={onOpen} className="cursor-pointer relative h-80 overflow-hidden bg-zinc-900">
        {album.coverImage ? (
          coverType === "video" ? (
            <AutoplayVideo url={album.coverImage} className="w-full h-full border-0" />
          ) : (
            <DriveThumbnail url={album.coverImage} mediaType={coverType}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" showBadge={false} />
          )
        ) : (
          <div className="w-full h-full bg-zinc-800 flex items-center justify-center"><Images className="w-10 h-10 text-zinc-600" /></div>
        )}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 backdrop-blur-sm rounded-full px-2.5 py-1"
          style={{ background: accent + "30", border: `1px solid ${accent}40` }}>
          <Images className="w-3 h-3" style={{ color: accent }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accent }}>Album</span>
        </div>
        {totalCount > 1 && (
          <div className="absolute bottom-2.5 right-2.5 bg-black/70 text-white text-[11px] font-semibold px-2 py-1 rounded-full">{totalCount} files</div>
        )}
      </div>

      <div onClick={onOpen} className="cursor-pointer p-3.5">
        <h3 className="font-bold text-white text-sm line-clamp-1 mb-1">{album.title}</h3>
        <div className="flex items-center justify-between gap-2">
          <p className="text-zinc-500 text-xs truncate">{album.description || `${totalCount} items`}</p>
          <span className="text-[10px] font-black uppercase tracking-wider shrink-0" style={{ color: accent }}>{getLabel(album.category)}</span>
        </div>
      </div>
    </article>
  );
}

/* ─── CategorySection ── */
function CategorySection({ category, albums, portfolioItems, onOpenAlbum, onOpenPortfolio, favIds, onFavToggle, onOpenAlbumWithType, onOpenPortfolioWithType }) {
  const [expanded, setExpanded] = useState(false);
  const accent = getAccent(category);
  const label  = getLabel(category);

  const allCards = [
    ...albums.map((a) => ({ type: "album",     data: a, key: `album-${a.id}`     })),
    ...portfolioItems.map((p) => ({ type: "portfolio", data: p, key: `portfolio-${p.id}` })),
  ];
  const total   = allCards.length;
  const shown   = expanded ? allCards : allCards.slice(0, PREVIEW_COUNT);
  const hasMore = total > PREVIEW_COUNT;
  if (total === 0) return null;

  return (
    <section className="mb-20">
      <div className="flex items-end justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-1 h-10 rounded-full shrink-0" style={{ background: accent }} />
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{label}</h2>
            <p className="text-zinc-500 text-sm mt-0.5">
              {albums.length > 0 && `${albums.length} album${albums.length !== 1 ? "s" : ""}`}
              {albums.length > 0 && portfolioItems.length > 0 && " · "}
              {portfolioItems.length > 0 && `${portfolioItems.length} item${portfolioItems.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        {hasMore && (
          <button onClick={() => setExpanded((v) => !v)}
            className="shrink-0 flex items-center gap-1.5 text-sm font-semibold" style={{ color: accent }}>
            {expanded ? "Show less" : `See all ${total}`}
            <ArrowRight className="w-4 h-4" style={{ transform: expanded ? "rotate(90deg)" : "none" }} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {shown.map(({ type, data, key }) =>
          type === "album" ? (
            <AlbumCard key={key} album={data}
              onOpen={() => onOpenAlbum(data)}
              isFav={favIds?.has(data.id)}
              onFavToggle={() => onFavToggle(data, "album")} />
          ) : (
            <PortfolioCard key={key} item={data}
              onOpen={() => onOpenPortfolio(data)}
              isFav={favIds?.has(data.id)}
              onFavToggle={() => onFavToggle(data, "portfolio")} />
          )
        )}
      </div>

      {hasMore && !expanded && (
        <div className="mt-8 text-center">
          <button onClick={() => setExpanded(true)}
            className="px-8 py-2.5 rounded-full text-sm font-semibold border transition-all hover:scale-105"
            style={{ borderColor: accent + "55", color: accent, background: accent + "12" }}>
            Show {total - PREVIEW_COUNT} more {label.toLowerCase()}
          </button>
        </div>
      )}
    </section>
  );
}

/* ─── Main ── */
export default function DynamicPortfolioShowcase() {
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [albums,         setAlbums]         = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  // Store lightbox context so we know the parentType when saving
  const [lightboxCtx,    setLightboxCtx]    = useState(null); // { items, title, parentType }
  const { favIds, toggle: toggleFav, toggleMedia } = useFavorites();

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [pRes, aRes] = await Promise.all([
          fetch("/api/portfolio?published=true&limit=500"),
          fetch("/api/albums?limit=500"),
        ]);
        const [pData, aData] = await Promise.all([pRes.json(), aRes.json()]);
        if (!alive) return;
        setPortfolioItems(Array.isArray(pData.items)  ? pData.items  : []);
        setAlbums(        Array.isArray(aData.albums) ? aData.albums : []);
      } catch {}
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const openAlbum = useCallback((album) => {
    const items = albumToMediaItems(album);
    if (!items.length) return;
    setLightboxCtx({ items, title: album.title, parentType: "album" });
  }, []);

  const openPortfolio = useCallback((item) => {
    const items = portfolioToMediaItems(item);
    if (!items.length) return;
    setLightboxCtx({ items, title: item.title, parentType: "portfolio" });
  }, []);

  /* Group by category */
  const grouped = {};
  CATEGORY_ORDER.forEach((cat) => { grouped[cat] = { albums: [], portfolio: [] }; });
  albums.forEach((a) => { const c = grouped[a.category] ? a.category : "other"; grouped[c].albums.push(a); });
  portfolioItems.forEach((p) => { const c = grouped[p.category] ? p.category : "other"; grouped[c].portfolio.push(p); });

  const filteredGrouped = {};
  CATEGORY_ORDER.forEach((cat) => { filteredGrouped[cat] = { albums: [], portfolio: [] }; });
  const fAlbums    = activeCategory === "all" ? albums    : albums.filter((a) => (grouped[a.category] ? a.category : "other") === activeCategory);
  const fPortfolio = activeCategory === "all" ? portfolioItems : portfolioItems.filter((p) => (grouped[p.category] ? p.category : "other") === activeCategory);
  fAlbums.forEach((a) => { const c = filteredGrouped[a.category] ? a.category : "other"; filteredGrouped[c].albums.push(a); });
  fPortfolio.forEach((p) => { const c = filteredGrouped[p.category] ? p.category : "other"; filteredGrouped[c].portfolio.push(p); });

  const totalAll = portfolioItems.length + albums.length;
  const categoryCount = (cat) => (grouped[cat]?.albums.length || 0) + (grouped[cat]?.portfolio.length || 0);
  const categoriesToShow = activeCategory === "all" ? CATEGORY_ORDER : [activeCategory];
  const activeHasContent = activeCategory === "all" ? totalAll > 0
    : (filteredGrouped[activeCategory]?.albums.length || 0) + (filteredGrouped[activeCategory]?.portfolio.length || 0) > 0;

  return (
    <section className="bg-black min-h-screen text-white pt-28 pb-24 px-5 md:px-10 xl:px-16 2xl:px-20">
      <div className="max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="mb-14">
          <p className="text-orange-500 font-mono text-xs tracking-[0.4em] uppercase mb-3">Portfolio</p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 leading-none">
            Our <span className="text-orange-500">Works</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl leading-relaxed">
            Every frame tells a story — explore our collection of photography and film.
          </p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          </div>
        )}

        {!loading && (
          <>
            {/* Category filter pills */}
            <div className="flex flex-wrap gap-2 mb-14">
              {[{ cat: "all", label: "All", count: totalAll }, ...CATEGORY_ORDER.map((cat) => ({ cat, label: getLabel(cat), count: categoryCount(cat) }))].map(({ cat, label, count }) => {
                const accent = cat === "all" ? "#f97316" : getAccent(cat);
                const active = activeCategory === cat;
                return (
                  <button key={cat} onClick={() => setActiveCategory(cat)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200"
                    style={active
                      ? { background: accent, color: "#000", borderColor: accent }
                      : { background: "transparent", color: "#71717a", borderColor: "#3f3f46" }}>
                    {label}
                    <span className="text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center"
                      style={active ? { background: "rgba(0,0,0,0.25)", color: "#000" } : { background: "#27272a", color: "#71717a" }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {!activeHasContent ? (
              <div className="flex flex-col items-center justify-center py-28 gap-4">
                <Camera className="w-14 h-14 text-zinc-700" />
                <p className="text-white text-xl font-bold">No works yet</p>
                <p className="text-zinc-500 text-sm">Check back soon!</p>
              </div>
            ) : (
              categoriesToShow.map((cat) => {
                const g = filteredGrouped[cat];
                if (!g || (g.albums.length === 0 && g.portfolio.length === 0)) return null;
                return (
                  <CategorySection key={cat} category={cat}
                    albums={g.albums} portfolioItems={g.portfolio}
                    onOpenAlbum={openAlbum} onOpenPortfolio={openPortfolio}
                    favIds={favIds} onFavToggle={toggleFav}
                  />
                );
              })
            )}
          </>
        )}
      </div>

      {/* Lightbox — passes correct parentType to toggleMedia */}
      {lightboxCtx && (
        <DriveLightbox
          items={lightboxCtx.items}
          title={lightboxCtx.title}
          onClose={() => setLightboxCtx(null)}
          renderActions={(item) => (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                await toggleMedia({
                  mediaUrl:    item.url,
                  mediaType:   item.mediaType,        // ← "image" | "video" from makeMediaItem
                  parentTitle: lightboxCtx.title,
                  parentType:  lightboxCtx.parentType, // ← "album" | "portfolio" (was hardcoded "media")
                  category:    "",
                });
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors",
                favIds.has(item.url)
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/10"
                  : "bg-zinc-800 text-zinc-400 hover:text-red-400"
              )}
            >
              <Heart className={cn("w-3.5 h-3.5", favIds.has(item.url) ? "fill-red-400 text-red-400" : "")} />
              {favIds.has(item.url) ? "Saved" : "Save"}
            </button>
          )}
        />
      )}
    </section>
  );
}