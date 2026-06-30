"use client";

/**
 * components/ui/DriveMedia.tsx
 *
 * ─── UNIVERSAL MEDIA RENDERER ────────────────────────────────────────────────
 *
 * Renders ANY Cloudinary file correctly based on its explicit `mediaType`.
 * Also handles legacy Google Drive URLs for backward compatibility.
 *
 * Usage:
 *   <DriveMedia
        url={hero.backgroundImage}
        mediaType="image"
        className="w-full h-full object-contain bg-red-500"
      />
 *   <DriveMedia url={url} mediaType="video" autoPlay muted />
 *   <DriveMedia url={url} mediaType="pdf" />
 *
 * For thumbnails (grid / card views):
 *   <DriveThumbnail url={url} mediaType="video" />
 *
 * For the admin + user lightbox (full-screen viewer):
 *   <DriveLightbox items={mediaItems} startIndex={0} onClose={() => {}} />
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Play, FileText, Image as ImageIcon, X,
  ChevronLeft, ChevronRight, Download, ExternalLink,
} from "lucide-react";
import {
  toImageUrl, toPreviewUrl, toAutoplayUrl,
  toDownloadUrl, toThumbnailUrl, isCloudinaryUrl,
  MediaType, MediaItem,
} from "@/lib/cloudinary-url";
import { cn } from "@/lib/utils";

// ─── DriveMedia ───────────────────────────────────────────────────────────────

interface DriveMediaProps {
  url:        string;
  mediaType:  MediaType;
  autoPlay?:  boolean;
  muted?:     boolean;
  controls?:  boolean;
  loop?:      boolean;
  className?: string;
  imgClassName?: string;
  alt?:       string;
  imageWidth?: number;
  onError?:   () => void;
}

/**
 * DriveMedia — renders the correct DOM element for the given mediaType.
 *
 * image → <img> (Cloudinary CDN with auto optimization)
 * video → <video> for Cloudinary, <iframe> for legacy Drive
 * pdf   → <iframe> via pdf-proxy
 */
export function DriveMedia({
  url,
  mediaType,
  autoPlay  = false,
  muted     = true,
  controls  = true,
  loop      = false,
  className = "",
  imgClassName = "",
  alt       = "",
  imageWidth = 1600,
  onError,
}: DriveMediaProps) {
  const [errored, setErrored] = useState(false);

  if (!url) return <MediaPlaceholder mediaType={mediaType} className={className} />;
  if (errored) return <MediaPlaceholder mediaType={mediaType} className={className} />;

  if (mediaType === "image") {
    return (
      <img
        src={toImageUrl(url, imageWidth)}
        alt={alt}
        className={cn("block", className, imgClassName)}
        loading="lazy"
        onError={() => { setErrored(true); onError?.(); }}
      />
    );
  }

  // Cloudinary video → native <video> element (much better UX than iframe)
  if (mediaType === "video" && isCloudinaryUrl(url)) {
    return (
      <video
        src={url}
        className={cn("block", className)}
        autoPlay={autoPlay}
        muted={muted}
        controls={controls}
        loop={loop}
        playsInline
        onError={() => { setErrored(true); onError?.(); }}
      />
    );
  }

  // PDF → iframe via pdf-proxy
  if (mediaType === "pdf") {
    const embedSrc = toPreviewUrl(url);
    return (
      <iframe
        src={embedSrc}
        className={cn("border-0", className)}
        allowFullScreen
        loading="lazy"
        title={alt || "PDF"}
      />
    );
  }

  // Legacy Drive video or fallback → iframe
  const embedSrc = autoPlay ? toAutoplayUrl(url) : toPreviewUrl(url);
  return (
    <iframe
      src={embedSrc}
      className={cn("border-0", className)}
      allow="autoplay; fullscreen"
      allowFullScreen
      loading="lazy"
      title={alt || mediaType}
    />
  );
}

// ─── MediaPlaceholder ─────────────────────────────────────────────────────────

function MediaPlaceholder({ mediaType, className }: { mediaType: MediaType; className?: string }) {
  const icons: Record<MediaType, React.ReactNode> = {
    image: <ImageIcon className="w-8 h-8 text-zinc-600" />,
    video: <Play       className="w-8 h-8 text-zinc-600" />,
    pdf:   <FileText   className="w-8 h-8 text-zinc-600" />,
  };
  return (
    <div className={cn("flex items-center justify-center bg-zinc-900", className)}>
      {icons[mediaType]}
    </div>
  );
}

// ─── DriveThumbnail ───────────────────────────────────────────────────────────

interface DriveThumbnailProps {
  url:        string;
  mediaType:  MediaType;
  className?: string;
  alt?:       string;
  showBadge?: boolean;
}

export function DriveThumbnail({
  url,
  mediaType,
  className = "w-full h-full object-cover",
  alt = "",
  showBadge = true,
}: DriveThumbnailProps) {
  const [errored, setErrored] = useState(false);
  const thumbSrc = toThumbnailUrl(url, mediaType);

  return (
    <div className="relative w-full h-full">
      {errored ? (
        <MediaPlaceholder mediaType={mediaType} className="w-full h-full" />
      ) : (
        <img
          src={thumbSrc}
          alt={alt}
          className={className}
          loading="lazy"
          onError={() => setErrored(true)}
        />
      )}

      {showBadge && mediaType !== "image" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm text-xs font-bold",
            mediaType === "video"
              ? "bg-black/60 text-white border border-white/20"
              : "bg-red-900/70 text-red-200 border border-red-500/30"
          )}>
            {mediaType === "video"
              ? <><Play className="w-3.5 h-3.5 fill-white" /> Video</>
              : <><FileText className="w-3.5 h-3.5" /> PDF</>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DriveLightbox ────────────────────────────────────────────────────────────

interface DriveLightboxProps {
  items:       MediaItem[];
  startIndex?: number;
  title?:      string;
  onClose:     () => void;
  renderActions?: (item: MediaItem, index: number) => React.ReactNode;
}

export function DriveLightbox({
  items,
  startIndex = 0,
  title,
  onClose,
  renderActions,
}: DriveLightboxProps) {
  const [idx, setIdx] = useState(startIndex);
  const total = items.length;
  const item  = items[idx];

  const prev = useCallback(() => setIdx((i) => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setIdx((i) => (i + 1) % total), [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape")      onClose();
      if (e.key === "ArrowLeft")   prev();
      if (e.key === "ArrowRight")  next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [prev, next, onClose]);

  if (!item) return null;

  const dlUrl  = toDownloadUrl(item.url, item.caption || undefined);
  const viewUrl = item.url; // direct Cloudinary URL

  return (
    <div
      className="fixed inset-0 z-[1100] bg-black/97 flex flex-col"
      onClick={onClose}
    >
      {/* Header — sits above navbar (z-[1100]), with safe top padding */}
      <div
        className="shrink-0 flex items-center justify-between gap-2 px-3 sm:px-5 py-3 pt-4 border-b border-white/10 bg-black/95 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: type badge + title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className={cn(
            "shrink-0 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
            item.mediaType === "image" ? "bg-blue-500/20 text-blue-400"
              : item.mediaType === "video" ? "bg-purple-500/20 text-purple-400"
              : "bg-red-500/20 text-red-400"
          )}>
            {item.mediaType}
          </span>
          {(title || item.caption) && (
            <p className="text-xs sm:text-sm text-zinc-300 truncate">{item.caption || title}</p>
          )}
          <span className="text-zinc-600 text-xs shrink-0 ml-1">{idx + 1}/{total}</span>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Download */}
          <a
            href={dlUrl}
            download
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
            title="Download"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Download</span>
          </a>

          {/* Open in new tab */}
          <a
            href={viewUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:block">View</span>
          </a>

          {renderActions?.(item, idx)}

          {/* Close — always prominent */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold transition-colors border border-white/10"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:block">Close</span>
          </button>
        </div>
      </div>

      {/* Main viewer */}
      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden px-14"
        onClick={(e) => e.stopPropagation()}
      >
        {item.mediaType === "image" ? (
          <img
            key={item.url}
            src={toImageUrl(item.url, 2000)}
            alt={item.caption || title || ""}
            className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl select-none"
            draggable={false}
          />
        ) : item.mediaType === "video" && isCloudinaryUrl(item.url) ? (
          <video
            key={item.url}
            src={item.url}
            className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl"
            style={{ maxWidth: '60rem' }}
            controls
            autoPlay
            playsInline
          />
        ) : (
          <iframe
            key={item.url}
            src={item.mediaType === "video" ? toAutoplayUrl(item.url) : toPreviewUrl(item.url)}
            className="w-full max-w-5xl rounded-2xl border border-zinc-800"
            style={{ height: "80vh" }}
            allow="autoplay; fullscreen"
            allowFullScreen
            title={item.caption || title || item.mediaType}
          />
        )}

        {total > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm transition-all"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm transition-all"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {total > 1 && (
        <div
          className="shrink-0 border-t border-white/10 px-5 pt-3 pb-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-2 justify-center overflow-x-auto pb-1 max-w-4xl mx-auto">
            {items.map((it, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={cn(
                  "shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all",
                  i === idx
                    ? "border-amber-500 scale-110 opacity-100"
                    : "border-transparent opacity-40 hover:opacity-75"
                )}
              >
                <DriveThumbnail
                  url={it.url}
                  mediaType={it.mediaType}
                  className="w-full h-full object-cover object-[15%_center]"
                  showBadge={it.mediaType !== "image"}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AutoplayVideo ────────────────────────────────────────────────────────────

export function AutoplayVideo({
  url,
  className = "w-full h-full",
}: {
  url:        string;
  className?: string;
}) {
  const ref     = useRef<HTMLVideoElement | HTMLIFrameElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current?.parentElement ?? ref.current;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActive(true); },
      { threshold: 0.3 }
    );
    if (el) obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (isCloudinaryUrl(url)) {
    return (
      <video
        ref={ref as React.RefObject<HTMLVideoElement>}
        src={active ? url : undefined}
        data-src={url}
        className={cn("border-0 object-cover", className)}
        autoPlay
        muted
        loop
        playsInline
      />
    );
  }

  // Legacy Drive
  return (
    <iframe
      ref={ref as React.RefObject<HTMLIFrameElement>}
      src={active ? toAutoplayUrl(url) : undefined}
      data-src={toAutoplayUrl(url)}
      className={cn("border-0", className)}
      allow="autoplay; fullscreen"
      allowFullScreen
      loading="lazy"
      title="video"
    />
  );
}