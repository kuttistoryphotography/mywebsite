"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Plus, Trash2, Edit2, Save, X, Loader2, Eye, EyeOff,
  Play, ChevronLeft, ChevronRight,
  Image as ImageIcon, Grid3x3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import MediaField from "@/components/ui/MediaField";
import { DriveThumbnail, DriveLightbox, AutoplayVideo } from "@/components/ui/DriveMedia";
import { MediaType, MediaItem, makeMediaItem, toImageUrl } from "@/lib/media";

/* ─── Constants ── */
const CATEGORIES = [
  "wedding","pre-wedding","outdoor","baby-shoot",
  "product","corporate","ads","food-shoot","album","other",
];
const CAT_LABELS: Record<string,string> = {
  wedding:"Wedding","pre-wedding":"Pre Wedding",outdoor:"Outdoor",
  "baby-shoot":"Baby Shoot",product:"Product",corporate:"Corporate",
  ads:"Ads","food-shoot":"Food Shoot",other:"Other",
};

/* ─── Types ── */
interface AlbumMediaFront {
  url:       string;
  mediaType: MediaType;
  caption?:  string;
  sortOrder: number;
}
interface Album {
  id:          string;
  title:       string;
  slug:        string;
  category:    string;
  coverImage?: string;
  coverMediaType: MediaType;
  description?: string;
  mediaCount:  number;
  media:       AlbumMediaFront[];
  published:   boolean;
  sortOrder:   number;
}

async function uploadToCloudinary(file: File, context = "album"): Promise<{ url: string; mediaType: MediaType }> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("context", context);
  const res  = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (!data.success || !data.url) throw new Error(data.error || "Upload failed");
  const mediaType: MediaType =
    file.type.startsWith("video/") ? "video" :
    file.type === "application/pdf" ? "pdf" : "image";
  return { url: data.url, mediaType };
}

/* ─── AlbumModal ── */
function AlbumModal({
  editingAlbum, onSave, onClose,
}: { editingAlbum: Album | null; onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    title:       editingAlbum?.title       ?? "",
    category:    editingAlbum?.category    ?? "wedding",
    description: editingAlbum?.description ?? "",
    coverImage:  editingAlbum?.coverImage  ?? "",
    published:   editingAlbum?.published   ?? false,
    sortOrder:   editingAlbum?.sortOrder   ?? 0,
  });
  const [coverMediaType, setCoverMediaType] = useState<MediaType>(editingAlbum?.coverMediaType ?? "image");
  const [mediaList, setMediaList]   = useState<AlbumMediaFront[]>(editingAlbum?.media ?? []);
  const [newUrl,    setNewUrl]      = useState("");
  const [newType,   setNewType]     = useState<MediaType>("image");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [saving,    setSaving]      = useState(false);
  const [preview,   setPreview]     = useState(false);
  const mediaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editingAlbum) return;
    (async () => {
      try {
        const res  = await fetch(`/api/albums/${editingAlbum.slug}`);
        const data = await res.json();
        if (data.album?.media) setMediaList(data.album.media);
        if (data.album?.coverMediaType) setCoverMediaType(data.album.coverMediaType);
      } catch {}
    })();
  }, [editingAlbum?.slug]);

  const handleCoverChange = (url: string, type: MediaType) => {
    setForm((p) => ({ ...p, coverImage: url }));
    setCoverMediaType(type);
  };

  const handleMediaFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingMedia(true);
    try {
      for (const file of files) {
        const { url, mediaType } = await uploadToCloudinary(file, "album");
        setMediaList((prev) => [...prev, { url, mediaType, caption: "", sortOrder: prev.length }]);
      }
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploadingMedia(false);
      if (mediaRef.current) mediaRef.current.value = "";
    }
  };

  const addMediaUrl = () => {
    if (!newUrl.trim()) return;
    setMediaList((prev) => [...prev, { url: newUrl.trim(), mediaType: newType, caption: "", sortOrder: prev.length }]);
    setNewUrl("");
  };

  const updateItemType = (i: number, type: MediaType) =>
    setMediaList((prev) => prev.map((m, idx) => idx === i ? { ...m, mediaType: type } : m));

  const removeMedia = (i: number) =>
    setMediaList((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!form.title.trim() || !form.category) return;
    setSaving(true);
    try {
      const payload = { ...form, coverMediaType, media: mediaList };
      const url     = editingAlbum ? `/api/albums/${editingAlbum.slug}` : "/api/albums";
      const method  = editingAlbum ? "PUT" : "POST";
      const res     = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data    = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      onSave();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const previewItems: MediaItem[] = [
    ...(form.coverImage ? [makeMediaItem(form.coverImage, coverMediaType)] : []),
    ...mediaList.filter((m) => m.url !== form.coverImage).map((m) =>
      makeMediaItem(m.url, m.mediaType, { caption: m.caption })
    ),
  ];

  const typeColors: Record<MediaType, string> = {
    image: "border-blue-500/40 text-blue-400 bg-blue-500/10",
    video: "border-purple-500/40 text-purple-400 bg-purple-500/10",
    pdf:   "border-red-500/40 text-red-400 bg-red-500/10",
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-zinc-900 rounded-2xl w-full max-w-2xl border border-zinc-700 shadow-2xl my-4">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <h3 className="text-white font-bold text-lg">{editingAlbum ? "Edit Album" : "New Album"}</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"><X className="w-5 h-5 text-zinc-400" /></button>
          </div>

          <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
            {/* Title */}
            <div>
              <label className="block text-zinc-400 text-sm font-medium mb-1.5">Album Title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Priya & Arjun Wedding"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none" />
            </div>

            {/* Category */}
            <div>
              <label className="block text-zinc-400 text-sm font-medium mb-1.5">Category *</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none">
                {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_LABELS[c] ?? c}</option>)}
              </select>
            </div>

            {/* Cover — with explicit mediaType selector */}
            <MediaField
              label="Cover Image / Video"
              url={form.coverImage}
              mediaType={coverMediaType}
              onChange={handleCoverChange}
              allowedTypes={["image", "video"]}
              previewHeight="h-36"
              context="album"
            />

            {/* Description */}
            <div>
              <label className="block text-zinc-400 text-sm font-medium mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none resize-none" />
            </div>

            {/* Sort + publish */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-zinc-400 text-sm font-medium mb-1.5">Sort Order</label>
                <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer mt-5">
                <div onClick={() => setForm({ ...form, published: !form.published })}
                  className={cn("w-10 h-6 rounded-full transition-colors relative", form.published ? "bg-green-500" : "bg-zinc-700")}>
                  <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-transform", form.published ? "translate-x-5" : "translate-x-1")} />
                </div>
                <span className="text-zinc-400 text-sm">{form.published ? "Published" : "Draft"}</span>
              </label>
            </div>

            {/* Gallery media */}
            <div className="border-t border-zinc-800 pt-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-semibold">
                  Gallery Media
                  <span className="text-zinc-500 text-sm font-normal ml-2">({mediaList.length} items)</span>
                </h4>
                {previewItems.length > 0 && (
                  <button type="button" onClick={() => setPreview(true)}
                    className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300">
                    <Grid3x3 className="w-3.5 h-3.5" /> Preview all
                  </button>
                )}
              </div>

              <p className="text-xs text-zinc-500 mb-3">
                ⚠️ Drive URLs look the same for images and videos — always select the correct type.
              </p>

              {/* Add by URL */}
              <div className="flex gap-2 mb-3 flex-wrap">
                <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMediaUrl())}
                  placeholder="Paste Drive URL…"
                  className="flex-1 min-w-32 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" />
                <div className="flex gap-1">
                  {(["image", "video", "pdf"] as MediaType[]).map((t) => (
                    <button key={t} type="button" onClick={() => setNewType(t)}
                      className={cn("px-3 py-2 rounded-xl text-xs font-bold border capitalize transition-all",
                        newType === t ? typeColors[t] : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-white")}>
                      {t}
                    </button>
                  ))}
                </div>
                <button onClick={addMediaUrl} disabled={!newUrl.trim()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-sm font-semibold disabled:opacity-40">
                  Add
                </button>
              </div>

              {/* Upload */}
              <div className="mb-4">
                <input ref={mediaRef} type="file" accept="image/*,video/*,application/pdf" multiple className="hidden" onChange={handleMediaFiles} />
                <button type="button" onClick={() => mediaRef.current?.click()} disabled={uploadingMedia}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700 text-white text-sm disabled:opacity-50">
                  {uploadingMedia ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {uploadingMedia ? "Uploading…" : "Upload files to Drive"}
                </button>
                <p className="text-xs text-zinc-600 mt-1">Type auto-detected · override below per item</p>
              </div>

              {/* Grid with type override */}
              {mediaList.length > 0 && (
                <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                  {mediaList.map((m, i) => (
                    <div key={i} className={cn("relative group rounded-lg overflow-hidden border aspect-square bg-zinc-800", typeColors[m.mediaType])}>
                      <DriveThumbnail url={m.url} mediaType={m.mediaType} className="w-full h-full object-cover" showBadge={false} />

                      {/* Type override on hover */}
                      <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                        {(["image", "video", "pdf"] as MediaType[]).map((t) => (
                          <button key={t} type="button" onClick={() => updateItemType(i, t)}
                            className={cn("w-full py-0.5 rounded text-[9px] font-black capitalize transition-colors",
                              m.mediaType === t ? "bg-amber-500 text-black" : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600")}>
                            {t}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => removeMedia(i)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 text-xs z-10">
                        ×
                      </button>
                      <span className={cn("absolute bottom-1 left-1 text-[8px] font-black uppercase px-1 rounded", typeColors[m.mediaType])}>
                        {m.mediaType}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-zinc-800">
            <button onClick={onClose} className="px-5 py-2.5 text-sm text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.title.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-black rounded-xl font-semibold text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingAlbum ? "Update Album" : "Create Album"}
            </button>
          </div>
        </div>
      </div>

      {/* Full-screen preview lightbox */}
      {preview && previewItems.length > 0 && (
        <DriveLightbox items={previewItems} title={form.title || "Preview"} onClose={() => setPreview(false)} />
      )}
    </>
  );
}

/* ─── Album Card ── */
function AlbumCard({ album, onEdit, onDelete, onTogglePublish, onPreview }: {
  album: Album; onEdit: () => void; onDelete: () => void; onTogglePublish: () => void; onPreview: () => void;
}) {
  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-colors group">
      <div className="relative h-48 cursor-pointer" onClick={onPreview}>
        {album.coverImage ? (
          <DriveThumbnail
            url={album.coverImage}
            mediaType={album.coverMediaType || "image"}
            className="w-full h-full object-cover"
            alt={album.title}
            showBadge={true}
          />
        ) : (
          <div className="w-full h-full bg-zinc-800 flex flex-col items-center justify-center text-zinc-600 gap-2">
            <ImageIcon className="w-8 h-8" /><span className="text-xs">No cover</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1">
            <Grid3x3 className="w-6 h-6 text-white" />
            <span className="text-white text-xs font-medium">View All Media</span>
          </div>
        </div>
        <div className="absolute top-2 right-2">
          <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold",
            album.published ? "bg-green-500/20 text-green-400" : "bg-zinc-700/80 text-zinc-400")}>
            {album.published ? "Live" : "Draft"}
          </span>
        </div>
        {album.mediaCount > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
            {album.mediaCount} file{album.mediaCount !== 1 ? "s" : ""}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-white truncate">{album.title}</h3>
        {album.description && <p className="text-zinc-500 text-xs mt-0.5 line-clamp-1">{album.description}</p>}
        <div className="flex gap-2 mt-3">
          <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs">
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </button>
          <button onClick={onTogglePublish}
            className={cn("px-3 py-2 rounded-xl text-xs",
              album.published ? "bg-zinc-700 hover:bg-zinc-600 text-zinc-300" : "bg-green-600 hover:bg-green-500 text-white")}>
            {album.published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onDelete} className="px-3 py-2 rounded-xl text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main ── */
export default function AlbumsSection() {
  const [albums,       setAlbums]       = useState<Album[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [previewAlbum, setPreviewAlbum] = useState<Album | null>(null);
  const [filterCat,    setFilterCat]    = useState("all");

  const fetchAlbums = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/albums?admin=true&limit=200");
      const data = await res.json();
      setAlbums(data.albums || []);
    } catch { setAlbums([]); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { fetchAlbums(); }, [fetchAlbums]);

  const handleTogglePublish = async (album: Album) => {
    await fetch(`/api/albums/${album.slug}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !album.published }),
    });
    await fetchAlbums();
  };

  const handleDelete = async (album: Album) => {
    if (!confirm(`Delete "${album.title}"? This cannot be undone.`)) return;
    await fetch(`/api/albums/${album.slug}`, { method: "DELETE" });
    await fetchAlbums();
  };

  const presentCats = Array.from(new Set(albums.map((a) => a.category)));
  const filtered    = filterCat === "all" ? albums : albums.filter((a) => a.category === filterCat);

  const previewItems: MediaItem[] = previewAlbum
    ? [
        ...(previewAlbum.coverImage ? [makeMediaItem(previewAlbum.coverImage, previewAlbum.coverMediaType)] : []),
        ...(previewAlbum.media || [])
          .filter((m) => m.url !== previewAlbum.coverImage)
          .map((m) => makeMediaItem(m.url, m.mediaType, { caption: m.caption })),
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Albums</h2>
          <p className="text-zinc-500 text-sm">{albums.length} album{albums.length !== 1 ? "s" : ""} total</p>
        </div>
        <button onClick={() => { setEditingAlbum(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-semibold text-sm">
          <Plus className="w-4 h-4" /> New Album
        </button>
      </div>

      {/* Category filter */}
      {!loading && presentCats.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {[["all", `All (${albums.length})`], ...presentCats.map((c) => [c, `${CAT_LABELS[c] ?? c} (${albums.filter((a) => a.category === c).length})`])].map(([val, lbl]) => (
            <button key={val} onClick={() => setFilterCat(val)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                filterCat === val ? "bg-amber-500 text-black border-amber-500" : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white")}>
              {lbl}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-amber-500 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-600">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-semibold">No albums yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((album) => (
            <AlbumCard key={album.id} album={album}
              onEdit={() => { setEditingAlbum(album); setShowModal(true); }}
              onDelete={() => handleDelete(album)}
              onTogglePublish={() => handleTogglePublish(album)}
              onPreview={() => setPreviewAlbum(album)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <AlbumModal editingAlbum={editingAlbum}
          onSave={() => { setShowModal(false); fetchAlbums(); }}
          onClose={() => setShowModal(false)} />
      )}

      {previewAlbum && previewItems.length > 0 && (
        <DriveLightbox items={previewItems} title={previewAlbum.title} onClose={() => setPreviewAlbum(null)} />
      )}
    </div>
  );
}