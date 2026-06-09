"use client";

/**
 * components/ui/MediaField.tsx
 *
 * Admin media input field — upload OR paste a Google Drive URL.
 * CRITICAL: always lets the admin choose mediaType (image / video / pdf)
 * because Drive URLs are identical regardless of file type.
 *
 * Emits: onChange(url, mediaType)
 * Stores both in parent form state so the DB gets explicit type info.
 */

import React, { useState, useRef } from "react";
import {
  Link2, Upload, X, Loader2,
  Image as ImageIcon, Film, FileText,
} from "lucide-react";
import { toImageUrl, toPreviewUrl, toAutoplayUrl, toThumbnailUrl, MediaType } from "@/lib/media";
import { cn } from "@/lib/utils";

const MEDIA_TYPES: { value: MediaType; label: string; icon: React.ReactNode }[] = [
  { value: "image", label: "Image",  icon: <ImageIcon className="w-3.5 h-3.5" /> },
  { value: "video", label: "Video",  icon: <Film      className="w-3.5 h-3.5" /> },
  { value: "pdf",   label: "PDF",    icon: <FileText  className="w-3.5 h-3.5" /> },
];

interface MediaFieldProps {
  label:          string;
  url:            string;
  mediaType:      MediaType;
  /** Called whenever url OR mediaType changes */
  onChange:       (url: string, mediaType: MediaType) => void;
  /** Limit which types admin can pick */
  allowedTypes?:  MediaType[];
  previewHeight?: string;  // Tailwind h-* class, e.g. "h-40"
  context?:       string;  // Drive upload context
  required?:      boolean;
}

export default function MediaField({
  label,
  url,
  mediaType,
  onChange,
  allowedTypes  = ["image", "video", "pdf"],
  previewHeight = "h-40",
  context       = "general",
  required      = false,
}: MediaFieldProps) {
  const [mode,      setMode]      = useState<"url" | "upload">("url");
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const acceptMime = allowedTypes
    .map((t) => t === "image" ? "image/*" : t === "video" ? "video/*" : "application/pdf")
    .join(",");

  // Upload file → Drive → returns url + inferred mediaType
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("context", context);

      const res  = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed");

      // Infer mediaType from the uploaded file's MIME type
      const inferred: MediaType =
        file.type.startsWith("video/") ? "video" :
        file.type === "application/pdf" ? "pdf" :
        "image";

      onChange(data.url, inferred);
    } catch (err: any) {
      setError(err.message || "Upload failed. Try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleUrlChange = (newUrl: string) => onChange(newUrl, mediaType);
  const handleTypeChange = (newType: MediaType) => onChange(url, newType);
  const clearMedia = () => onChange("", mediaType);

  // Build preview src based on type
  const previewSrc = url
    ? mediaType === "image"
      ? toImageUrl(url, 800)
      : toPreviewUrl(url)
    : "";

  const typeColors: Record<MediaType, string> = {
    image: "text-blue-400 bg-blue-500/15 border-blue-500/30",
    video: "text-purple-400 bg-purple-500/15 border-purple-500/30",
    pdf:   "text-red-400 bg-red-500/15 border-red-500/30",
  };

  return (
    <div className="space-y-2.5">
      {/* Label */}
      <label className="flex items-center gap-1.5 text-zinc-400 text-sm font-medium">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      {/* ── mediaType selector ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 shrink-0">File type:</span>
        <div className="flex gap-1">
          {MEDIA_TYPES.filter((t) => allowedTypes.includes(t.value)).map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => handleTypeChange(t.value)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                mediaType === t.value
                  ? typeColors[t.value]
                  : "bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-white"
              )}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        {url && (
          <span className={cn(
            "ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
            typeColors[mediaType]
          )}>
            {mediaType} saved
          </span>
        )}
      </div>

      {/* ── Input mode toggle ───────────────────────────────────────────────── */}
      <div className="flex rounded-xl overflow-hidden border border-zinc-700 w-fit">
        <button
          type="button"
          onClick={() => setMode("url")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors",
            mode === "url" ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
          )}
        >
          <Link2 className="w-3 h-3" /> Paste URL
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors",
            mode === "upload" ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
          )}
        >
          <Upload className="w-3 h-3" /> Upload to Drive
        </button>
      </div>

      {/* ── URL input ──────────────────────────────────────────────────────── */}
      {mode === "url" && (
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="Paste Google Drive share URL…"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none placeholder:text-zinc-600"
          />
          {url && (
            <button
              type="button"
              onClick={clearMedia}
              className="p-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-400 hover:text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* ── File upload ─────────────────────────────────────────────────────── */}
      {mode === "upload" && (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept={acceptMime}
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 border border-dashed border-zinc-600 rounded-xl text-zinc-400 hover:border-amber-500 hover:text-white transition-colors text-sm w-full justify-center disabled:opacity-50"
          >
            {uploading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading to Drive…</>
              : <><Upload className="w-4 h-4" /> Choose {allowedTypes.join(" / ")}</>}
          </button>
          <p className="text-[11px] text-zinc-600 mt-1">
            Type is auto-detected on upload. You can override it with the selector above.
          </p>
        </div>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {/* ── Preview ─────────────────────────────────────────────────────────── */}
      {url && previewSrc && (
        <div className={cn(
          "relative rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900",
          previewHeight
        )}>
          {mediaType === "image" ? (
            <img
              src={previewSrc}
              alt="preview"
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            /* video & pdf — show lh3 thumbnail with type badge overlay (fast, no iframe lag) */
            <div className="relative w-full h-full">
              <img
                src={toThumbnailUrl(url, mediaType)}
                alt="preview"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm",
                  mediaType === "video"
                    ? "bg-black/60 text-white border border-white/20"
                    : "bg-red-900/70 text-red-200 border border-red-500/30"
                )}>
                  {mediaType === "video" ? "▶ Video" : "📄 PDF"}
                </div>
              </div>
            </div>
          )}

          {/* Clear button */}
          <button
            type="button"
            onClick={clearMedia}
            className="absolute top-2 right-2 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors z-10"
          >
            <X className="w-3 h-3" />
          </button>

          {/* Type label */}
          <div className={cn(
            "absolute bottom-2 left-2 flex items-center gap-1 rounded-full px-2 py-0.5 border text-[10px] font-bold uppercase",
            typeColors[mediaType]
          )}>
            {mediaType === "image" ? <ImageIcon className="w-3 h-3" />
              : mediaType === "video" ? <Film className="w-3 h-3" />
              : <FileText className="w-3 h-3" />}
            {mediaType}
          </div>
        </div>
      )}
    </div>
  );
}