"use client";

import React, { useRef, useState } from "react";
import { X, Loader2, Calendar, MapPin, User, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import MediaField from "@/components/ui/MediaField";
import { DriveThumbnail } from "@/components/ui/DriveMedia";
import { MediaType, makeMediaItem, MediaItem } from "@/lib/media";

interface PortfolioFormModalProps {
  isOpen:      boolean;
  onClose:     () => void;
  onSubmit:    (data: any) => Promise<void>;
  editData?:   any;
  categories:  any[];
}

const generateSlug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function PortfolioFormModal({
  isOpen,
  onClose,
  onSubmit,
  editData,
  categories,
}: PortfolioFormModalProps) {
  const [loading, setLoading] = useState(false);

  // Cover
  const [coverUrl,       setCoverUrl]       = useState<string>(editData?.cover_image || "");
  const [coverMediaType, setCoverMediaType] = useState<MediaType>(editData?.coverMediaType || "image");

  // Gallery — typed MediaItem array
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => {
    if (editData?.media?.length) return editData.media;
    // Legacy: flat images array — default all to image
    if (editData?.images?.length) {
      return (editData.images as string[]).map((url: string, i: number) =>
        makeMediaItem(url, "image", { sortOrder: i })
      );
    }
    return [];
  });

  // New gallery item form
  const [newUrl,       setNewUrl]       = useState("");
  const [newMediaType, setNewMediaType] = useState<MediaType>("image");
  const [newCaption,   setNewCaption]   = useState("");
  const [uploadingNew, setUploadingNew] = useState(false);
  const newFileRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title:            editData?.title            || "",
    slug:             editData?.slug             || "",
    category:         editData?.category         || "",
    description:      editData?.description      || "",
    client_name:      editData?.client_name      || "",
    event_date:       editData?.event_date        || "",
    location:         editData?.location         || "",
    featured:         editData?.featured         || false,
    published:        editData?.published        || false,
    display_order:    editData?.display_order    || 0,
    meta_title:       editData?.meta_title       || "",
    meta_description: editData?.meta_description || "",
  });

  if (!isOpen) return null;

  const handleTitleChange = (title: string) => {
    setFormData({ ...formData, title, slug: generateSlug(title), meta_title: title });
  };

  // Cover change from MediaField
  const handleCoverChange = (url: string, type: MediaType) => {
    setCoverUrl(url);
    setCoverMediaType(type);
  };

  // Add a URL-pasted gallery item
  const addGalleryItem = () => {
    if (!newUrl.trim()) return;
    setMediaItems((prev) => [
      ...prev,
      makeMediaItem(newUrl.trim(), newMediaType, { caption: newCaption, sortOrder: prev.length }),
    ]);
    setNewUrl(""); setNewCaption("");
  };

  // Upload a file to Drive → add to gallery
  const handleGalleryFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingNew(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("context", "portfolio");
        const res  = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!data.url) throw new Error(data.error || "Upload failed");
        const inferred: MediaType =
          file.type.startsWith("video/") ? "video" :
          file.type === "application/pdf" ? "pdf" :
          "image";
        setMediaItems((prev) => [
          ...prev,
          makeMediaItem(data.url, inferred, { sortOrder: prev.length }),
        ]);
      }
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploadingNew(false);
      if (newFileRef.current) newFileRef.current.value = "";
    }
  };

  const updateItemType = (idx: number, type: MediaType) => {
    setMediaItems((prev) => prev.map((m, i) => i === idx ? { ...m, mediaType: type } : m));
  };

  const removeItem = (idx: number) =>
    setMediaItems((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        cover_image:    coverUrl,
        coverMediaType,
        media:          mediaItems,
        images:         mediaItems.map((m) => m.url), // legacy compat
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const typeColors: Record<MediaType, string> = {
    image: "border-blue-500/40 text-blue-400 bg-blue-500/10",
    video: "border-purple-500/40 text-purple-400 bg-purple-500/10",
    pdf:   "border-red-500/40 text-red-400 bg-red-500/10",
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-bold">{editData ? "Edit Portfolio Item" : "Add Portfolio Item"}</h2>
            <p className="text-sm text-zinc-500 mt-1">All media stored in Google Drive — specify image / video / PDF for each file</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-7">

          {/* ── Basic info ── */}
          <section className="space-y-4">
            <h3 className="text-amber-500 font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1.5">Title *</label>
                <input
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                  placeholder="e.g. Priya & Arjun Wedding"
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1.5">Slug *</label>
                <input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-xs text-zinc-500 mt-1">Auto-generated from title</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Display Order</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                placeholder="Describe this portfolio item…"
              />
            </div>
          </section>

          {/* ── Event details ── */}
          <section className="space-y-4">
            <h3 className="text-amber-500 font-semibold">Event Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5"><User className="w-4 h-4 inline mr-1" />Client Name</label>
                <input value={formData.client_name} onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  placeholder="Optional"
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5"><Calendar className="w-4 h-4 inline mr-1" />Event Date</label>
                <input type="date" value={formData.event_date} onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5"><MapPin className="w-4 h-4 inline mr-1" />Location</label>
                <input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Chennai"
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            </div>
          </section>

          {/* ── Cover media ── */}
          <section className="space-y-4">
            <h3 className="text-amber-500 font-semibold">Cover Media</h3>
            <p className="text-xs text-zinc-500 -mt-2">
              Select the correct type — Drive URLs look identical for images and videos.
            </p>
            <MediaField
              label="Cover Image / Video / PDF"
              url={coverUrl}
              mediaType={coverMediaType}
              onChange={handleCoverChange}
              allowedTypes={["image", "video"]}
              previewHeight="h-48"
              context="portfolio"
            />
          </section>

          {/* ── Gallery media ── */}
          <section className="space-y-4">
            <h3 className="text-amber-500 font-semibold">
              Gallery Media
              <span className="text-zinc-500 font-normal text-sm ml-2">({mediaItems.length} items)</span>
            </h3>
            <p className="text-xs text-zinc-500 -mt-2">
              For each item, choose the correct type (image / video / PDF) so it renders correctly on the site.
            </p>

            {/* Add by URL */}
            <div className="bg-zinc-800/50 rounded-xl border border-zinc-700 p-4 space-y-3">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Add item</p>
              <div className="flex gap-2 flex-wrap">
                <input
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGalleryItem())}
                  placeholder="Paste Google Drive URL…"
                  className="flex-1 min-w-40 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {/* Type selector */}
                <div className="flex gap-1">
                  {(["image", "video", "pdf"] as MediaType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewMediaType(t)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-semibold border transition-all capitalize",
                        newMediaType === t ? typeColors[t] : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-white"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addGalleryItem}
                  disabled={!newUrl.trim()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-sm font-semibold disabled:opacity-40 transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Upload files */}
              <div className="flex items-center gap-3">
                <input ref={newFileRef} type="file" accept="image/*,video/*,application/pdf" multiple className="hidden" onChange={handleGalleryFile} />
                <button
                  type="button"
                  onClick={() => newFileRef.current?.click()}
                  disabled={uploadingNew}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 rounded-lg text-sm text-zinc-300 hover:text-white disabled:opacity-50 transition-colors"
                >
                  {uploadingNew ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploadingNew ? "Uploading…" : "Upload files to Drive"}
                </button>
                <p className="text-xs text-zinc-600">Type auto-detected · you can override below</p>
              </div>
            </div>

            {/* Gallery grid */}
            {mediaItems.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-64 overflow-y-auto pr-1">
                {mediaItems.map((m, i) => (
                  <div
                    key={i}
                    className={cn(
                      "relative group rounded-xl overflow-hidden border aspect-square bg-zinc-800",
                      typeColors[m.mediaType]
                    )}
                  >
                    {/* Thumbnail */}
                    <DriveThumbnail
                      url={m.url}
                      mediaType={m.mediaType}
                      className="w-full h-full object-cover"
                      showBadge={false}
                    />

                    {/* Type override buttons on hover */}
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                      {(["image", "video", "pdf"] as MediaType[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => updateItemType(i, t)}
                          className={cn(
                            "w-full px-2 py-0.5 rounded text-[10px] font-bold capitalize transition-colors",
                            m.mediaType === t ? "bg-amber-500 text-black" : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      ×
                    </button>

                    {/* Type badge */}
                    <span className={cn(
                      "absolute bottom-1 left-1 text-[8px] font-black uppercase px-1 py-0.5 rounded",
                      typeColors[m.mediaType]
                    )}>
                      {m.mediaType}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── SEO & Publishing ── */}
          <section className="space-y-4">
            <h3 className="text-amber-500 font-semibold">SEO & Publishing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Meta Title</label>
                <input value={formData.meta_title} onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Meta Description</label>
                <input value={formData.meta_description} onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-amber-500" />
                <span className="text-sm">Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.published} onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-amber-500" />
                <span className="text-sm">Publish Now</span>
              </label>
            </div>
          </section>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800 flex items-center justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose}
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-black rounded-lg font-medium hover:bg-amber-400 transition-colors disabled:opacity-50">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Upload className="w-4 h-4" />{editData ? "Update" : "Create"} Portfolio</>}
          </button>
        </div>
      </div>
    </div>
  );
}
