"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ImageIcon,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Upload,
  Grid,
  List,
  X,
  Loader2,
  Link,
  CloudUpload,
  Check,
  Film,
} from "lucide-react";
import { cn } from "@/lib/utils";
import BlogManager from "./blog-manager";
import { toImageUrl, toThumbnailUrl, MediaType } from "@/lib/media";
import { DriveThumbnail } from "@/components/ui/DriveMedia";

type ContentTab = "portfolio" | "blog";

// ─── Types ────────────────────────────────────────────────────────────────────

/** A single gallery item — url + explicit mediaType (never infer from Drive URL alone) */
interface GalleryItem {
  url:       string;
  mediaType: MediaType;   // "image" | "video" | "pdf"
}

interface PortfolioItem {
  id:               string;
  title:            string;
  slug:             string;
  category:         string;
  description:      string | null;
  cover_image:      string | null;
  coverMediaType:   MediaType;
  /** Typed media array from API */
  media:            Array<{ url: string; mediaType: MediaType; caption?: string }>;
  /** Legacy flat string array — still returned by API for backward compat */
  images:           string[];
  image_count:      number;
  tags:             string[];
  featured:         boolean;
  published:        boolean;
  event_date:       string | null;
  location:         string | null;
  client_name:      string | null;
  meta_title:       string | null;
  meta_description: string | null;
  og_image:         string | null;
  focus_keywords:   string[];
  created_at:       string;
  seo?: {
  seoTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  focusKeywords?: string[];
  geoKeywords?: string[];
  aeoQuestions?: string[];
  aiDescription?: string;
  schemaType?: string;
  robots?: string;
};
}

const CATEGORIES = [
  "photography",
  "wedding",
  "pre-wedding",
  "post-wedding",
  "reception",
  "engagement",
  "outdoor",
  "indoor",
  "maternity",
  "baby-shower",
  "product",
  "corporate",
  "ads",
  "food-shoot",
  "album",
  "other",
];

function createSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Upload helper ────────────────────────────────────────────────────────────

async function uploadToGoogleDrive(file: File, context = "portfolio"): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("context", context);
  const res  = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (!data.success || !data.url) throw new Error(data.error || "Upload failed");
  return data.url;
}

/** Infer MediaType from a File's MIME type (reliable) or from a URL extension (fallback) */
function inferMediaType(fileOrUrl: File | string): MediaType {
  const s = typeof fileOrUrl === "string"
    ? fileOrUrl.toLowerCase()
    : fileOrUrl.type.toLowerCase();
  if (s.startsWith("video/") || /\.(mp4|webm|ogg|mov|avi|mkv)($|\?)/.test(s)) return "video";
  if (s === "application/pdf" || /\.pdf($|\?)/.test(s)) return "pdf";
  return "image";
}

// ─── ModeToggle ───────────────────────────────────────────────────────────────

function ModeToggle({ mode, setMode }: { mode: "url" | "file"; setMode: (m: "url" | "file") => void }) {
  return (
    <div className="flex gap-1 mb-2">
      <button type="button" onClick={() => setMode("url")}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          mode === "url" ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}>
        <Link className="w-3 h-3" /> Paste URL
      </button>
      <button type="button" onClick={() => setMode("file")}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          mode === "file" ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}>
        <CloudUpload className="w-3 h-3" /> Upload File
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ContentSection() {
  const [activeTab,      setActiveTab]      = useState<ContentTab>("portfolio");
  const [viewMode,       setViewMode]       = useState<"grid" | "list">("grid");
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [blogCount,      setBlogCount]      = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [fetchError,     setFetchError]     = useState<string | null>(null);
  const [saving,         setSaving]         = useState(false);
  const [showModal,      setShowModal]      = useState(false);
  const [editingItem,    setEditingItem]    = useState<PortfolioItem | null>(null);

  // Form state — gallery uses GalleryItem[] so mediaType is always explicit
  const [formData, setFormData] = useState({
    title:            "",
    category:         "",
    description:      "",
    cover_image:      "",
    coverMediaType:   "image" as MediaType,
    gallery:          [] as GalleryItem[],   // replaces old `images: {url,type}[]`
    client_name:      "",
    location:         "",
    event_date:       "",
    featured:         false,
    published:        false,
    meta_title:       "",
    meta_description: "",
    og_image:         "",
    focus_keywords:   [] as string[],
    seo_title: "",
    seo_description: "",
    canonical_url: "",
    geo_keywords: [] as string[],
    aeo_questions: [] as string[],
    ai_description: "",
    schema_type: "ImageGallery",
    robots: "index,follow",
  });

  const [newGalleryUrl,  setNewGalleryUrl]  = useState("");
  const [newGalleryType, setNewGalleryType] = useState<MediaType>("image");
  const [newKeyword,     setNewKeyword]     = useState("");
  const [coverMode,      setCoverMode]      = useState<"url" | "file">("url");
  const [galleryMode,    setGalleryMode]    = useState<"url" | "file">("url");
  const [uploadingCover,   setUploadingCover]   = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const coverFileRef   = useRef<HTMLInputElement>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  useEffect(() => { fetchPortfolioItems(); }, []);

  const fetchPortfolioItems = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res  = await fetch("/api/portfolio?admin=true");
      const data = await res.json();
      if (data.error) { setFetchError(data.error); setPortfolioItems([]); }
      else setPortfolioItems(Array.isArray(data.items) ? data.items : []);
    } catch (e: any) {
      setFetchError(e.message || "Failed to fetch portfolio");
      setPortfolioItems([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Modal helpers ─────────────────────────────────────────────────────────

  const resetForm = () => ({
    title: "", category: "", description: "",
    cover_image: "", coverMediaType: "image" as MediaType,
    gallery: [] as GalleryItem[],
    client_name: "", location: "", event_date: "",
    featured: false, published: false,
    meta_title: "", meta_description: "", og_image: "",
    focus_keywords: [] as string[],
    seo_title: "",
    seo_description: "",
    canonical_url: "",
    geo_keywords: [] as string[],
    aeo_questions: [] as string[],
    ai_description: "",
    schema_type: "ImageGallery",
    robots: "index,follow",
  });

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData(resetForm());
    setNewGalleryUrl("");
    setNewKeyword("");
    setCoverMode("url"); 
    setGalleryMode("url");
    setShowModal(true);
  };

  const openEditModal = (item: PortfolioItem) => {
    setEditingItem(item);

    // Build gallery from typed media array if available, else fall back to flat images
    let gallery: GalleryItem[] = [];
    if (Array.isArray(item.media) && item.media.length) {
      gallery = item.media.map((m) => ({ url: m.url, mediaType: m.mediaType }));
    } else if (Array.isArray(item.images)) {
      gallery = item.images.map((url) => ({ url, mediaType: "image" as MediaType }));
    }

    // Normalise event date to yyyy-MM-dd for <input type="date">
    let formattedDate = "";
    if (item.event_date) {
      try { formattedDate = new Date(item.event_date).toISOString().split("T")[0]; } catch {}
    }

    setFormData({
      title:            item.title,
      category:         item.category,
      description:      item.description || "",
      cover_image:      item.cover_image || "",
      coverMediaType:   item.coverMediaType || "image",
      gallery,
      client_name:      item.client_name || "",
      location:         item.location || "",
      event_date:       formattedDate,
      featured:         item.featured,
      published:        item.published,
      meta_title:       item.meta_title || "",
      meta_description: item.meta_description || "",
      og_image:         item.og_image || "",
      focus_keywords:   Array.isArray(item.focus_keywords) ? item.focus_keywords : [],
      seo_title: item.seo?.seoTitle || "",
      seo_description: item.seo?.metaDescription || "",
      canonical_url: item.seo?.canonicalUrl || "",
      geo_keywords: item.seo?.geoKeywords || [],
      aeo_questions: item.seo?.aeoQuestions || [],
      ai_description: item.seo?.aiDescription || "",
      schema_type: item.seo?.schemaType || "ImageGallery",
      robots: item.seo?.robots || "index,follow",
    });
    setNewGalleryUrl(""); setNewKeyword("");
    setCoverMode("url"); setGalleryMode("url");
    setShowModal(true);
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!formData.title.trim()) { alert("Title is required"); return; }
    if (!formData.category)     { alert("Please select a category"); return; }

    setSaving(true);
    try {
      const method  = editingItem ? "PUT" : "POST";
      const gallery = formData.gallery.filter((g) => g.url.trim() !== "");

      const payload: Record<string, unknown> = {
        ...formData,

        media: gallery,
        images: gallery.map((g) => g.url),

        cover_image: formData.cover_image,
        coverMediaType: formData.coverMediaType,

        seo: {
          seoTitle: formData.seo_title,
          metaDescription: formData.seo_description,
          canonicalUrl: formData.canonical_url,
          focusKeywords: formData.focus_keywords,
          geoKeywords: formData.geo_keywords,
          aeoQuestions: formData.aeo_questions,
          aiDescription: formData.ai_description,
          schemaType: formData.schema_type,
          robots: formData.robots,
        },
      };

      if (editingItem) payload.id = editingItem.id;

      const res  = await fetch("/api/portfolio", {
        method,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed to save"); return; }

      setShowModal(false);
      fetchPortfolioItems();
    } catch {
      alert("Failed to save portfolio item");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete / toggle ───────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this portfolio item?")) return;
    try {
      const res = await fetch(`/api/portfolio?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchPortfolioItems();
      else alert((await res.json()).error || "Failed to delete");
    } catch { alert("Failed to delete portfolio item"); }
  };

  const togglePublished = async (item: PortfolioItem) => {
    await fetch("/api/portfolio", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, published: !item.published }),
    });
    fetchPortfolioItems();
  };

  const toggleFeatured = async (item: PortfolioItem) => {
    await fetch("/api/portfolio", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, featured: !item.featured }),
    });
    fetchPortfolioItems();
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  // ── Gallery item helpers ──────────────────────────────────────────────────

  const addGalleryUrl = () => {
    const url = newGalleryUrl.trim();
    if (!url) return;
    setFormData((p) => ({ ...p, gallery: [...p.gallery, { url, mediaType: newGalleryType }] }));
    setNewGalleryUrl("");
  };

  const removeGalleryItem = (i: number) =>
    setFormData((p) => ({ ...p, gallery: p.gallery.filter((_, idx) => idx !== i) }));

  const updateGalleryType = (i: number, mediaType: MediaType) =>
    setFormData((p) => ({ ...p, gallery: p.gallery.map((g, idx) => idx === i ? { ...g, mediaType } : g) }));

  // ── Tab config ────────────────────────────────────────────────────────────

  const tabs = [
    { id: "portfolio" as ContentTab, label: "Portfolio", icon: ImageIcon, count: portfolioItems.length },
    { id: "blog"      as ContentTab, label: "Blog Posts", icon: FileText,  count: blogCount },
  ];

  const typeColors: Record<MediaType, string> = {
    image: "text-blue-400 bg-blue-500/15 border-blue-500/30",
    video: "text-purple-400 bg-purple-500/15 border-purple-500/30",
    pdf:   "text-red-400 bg-red-500/15 border-red-500/30",
  };

  // ─────────────────────────────────────────────────────────────────────────

  console.log("VIEW MODE =", viewMode);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Content Management</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your portfolio and blog posts</p>
        </div>
        {activeTab === "portfolio" && (
          <button onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-black rounded-xl font-medium hover:bg-amber-400 transition-colors">
            <Plus className="w-4 h-4" /> Add New
          </button>
        )}
      </div>

      {/* Tabs + view toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  : "bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:bg-zinc-800")}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className="px-2 py-0.5 bg-zinc-800 rounded-full text-xs">{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              console.log("GRID CLICKED");
              setViewMode("grid");
            }}
            className={cn("p-2 rounded-lg transition-colors", viewMode === "grid" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white")}>
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              console.log("LIST CLICKED");
              setViewMode("list");
            }}
            className={cn("p-2 rounded-lg transition-colors", viewMode === "list" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white")}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Portfolio tab */}
      {activeTab === "portfolio" && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
          ) : fetchError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-red-400 mb-2">Failed to load portfolio items</p>
              <p className="text-zinc-500 text-sm mb-4">{fetchError}</p>
              <button onClick={fetchPortfolioItems} className="px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition">Retry</button>
            </div>
          ) : (
            <div className={cn(viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4")}>
              {portfolioItems.map((item) => (
                <div key={item.id}
                  className={cn("bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-colors",
                    viewMode === "list" && "flex items-center")}>
                  <div className={cn("bg-zinc-800 flex items-center justify-center relative overflow-hidden",
                    viewMode === "grid" ? "h-40" : "w-32 h-24 shrink-0")}>
                    {item.cover_image ? (
                      <DriveThumbnail
                        url={item.cover_image}
                        mediaType={item.coverMediaType || "image"}
                        className="w-full h-full object-cover"
                        showBadge={item.coverMediaType !== "image"}
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-zinc-600" />
                    )}
                  </div>
                  <div className="p-4 flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-sm text-zinc-500">{item.category}</p>
                      </div>
                      {item.featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-zinc-500 mb-3">
                      <span>{item.image_count} files</span>
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={cn("px-2 py-1 rounded-full text-xs font-medium",
                        item.published ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-500/10 text-zinc-400")}>
                        {item.published ? "Published" : "Draft"}
                      </span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => togglePublished(item)}
                          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                          title={item.published ? "Unpublish" : "Publish"}>
                          {item.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button onClick={() => toggleFeatured(item)}
                          className={cn("p-1.5 hover:bg-zinc-800 rounded-lg transition-colors",
                            item.featured ? "text-amber-500" : "text-zinc-400 hover:text-amber-400")}>
                          <Star className={cn("w-4 h-4", item.featured && "fill-current")} />
                        </button>
                        <button onClick={() => openEditModal(item)}
                          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add new card */}
              <div onClick={openCreateModal}
                className="bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-700 p-8 flex flex-col items-center justify-center text-center hover:border-amber-500/50 hover:bg-zinc-900/50 transition-colors cursor-pointer min-h-50">
                <Upload className="w-8 h-8 text-zinc-500 mb-3" />
                <p className="font-medium text-zinc-400">Add Portfolio Item</p>
                <p className="text-sm text-zinc-600 mt-1">Upload photos from a shoot</p>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "blog" &&
       <BlogManager
        onCountChange={setBlogCount}
        viewMode={viewMode}
      />}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-lg font-semibold">{editingItem ? "Edit Portfolio Item" : "Add Portfolio Item"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* ── Basic info ── */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Title *</label>
                    <input 
                    value={formData.title} 
                    onChange={(e) => {
                      const title = e.target.value;
                      const slug = createSlug(title);

                      setFormData((prev) => ({
                        ...prev,

                        title,

                        canonical_url: `https://www.kuttistoryphotography.com/portfolio/${slug}`,

                        seo_title:
                          prev.seo_title || `${title} | Kutti Story Photography`,

                        meta_title:
                          prev.meta_title || `${title} | Kutti Story Photography`,
                      }));
                    }}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                      placeholder="e.g., Priya & Arjun Wedding" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Category *</label>
                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500">
                      <option value="" disabled>Select category</option>
                      {CATEGORIES.map((cat) => 
                      <option key={cat} value={cat}>
                        {cat
                          .split("-")
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(" ")}
                      </option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Client Name</label>
                    <input value={formData.client_name} onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                      placeholder="e.g., Priya & Arjun" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Location</label>
                    <input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                      placeholder="e.g., Chennai" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Event Date</label>
                    <input type="date" value={formData.event_date} onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 scheme-dark" />
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-800" />

              {/* ── Media ── */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white">Media</h3>

                {/* Cover */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Cover Image / Video</label>
                  {/* Cover type selector */}
                  <div className="flex gap-1 mb-2">
                    {(["image", "video"] as MediaType[]).map((t) => (
                      <button key={t} type="button" onClick={() => setFormData((p) => ({ ...p, coverMediaType: t }))}
                        className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize transition-all",
                          formData.coverMediaType === t ? typeColors[t] : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-white")}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <ModeToggle mode={coverMode} setMode={setCoverMode} />
                  {coverMode === "url" ? (
                    <input value={formData.cover_image} onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                      placeholder="Paste Google Drive share URL…" />
                  ) : (
                    <div className="flex items-center gap-3">
                      <input ref={coverFileRef} type="file" accept="image/*,video/*" className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingCover(true);
                          try {
                            const url = await uploadToGoogleDrive(file, "portfolio");
                            const inferred = inferMediaType(file);
                            setFormData((p) => ({ ...p, cover_image: url, coverMediaType: inferred }));
                          } catch (err: any) { alert("Cover upload failed: " + err.message); }
                          finally { setUploadingCover(false); if (coverFileRef.current) coverFileRef.current.value = ""; }
                        }} />
                      <button type="button" onClick={() => coverFileRef.current?.click()} disabled={uploadingCover}
                        className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700 text-white text-sm disabled:opacity-50">
                        {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploadingCover ? "Uploading…" : "Choose File"}
                      </button>
                      {formData.cover_image && !uploadingCover && (
                        <span className="flex items-center gap-1 text-xs text-emerald-400"><Check className="w-3 h-3" /> Uploaded</span>
                      )}
                    </div>
                  )}
                  {formData.cover_image && (
                    <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden bg-zinc-800">
                      <DriveThumbnail url={formData.cover_image} mediaType={formData.coverMediaType}
                        className="w-full h-full object-cover" showBadge={formData.coverMediaType !== "image"} />
                    </div>
                  )}
                </div>

                {/* Gallery */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Gallery ({formData.gallery.length} items)
                  </label>
                  <p className="text-xs text-zinc-500 mb-2">
                    ⚠️ Drive URLs look identical for images and videos — always select the correct type.
                  </p>

                  <ModeToggle mode={galleryMode} setMode={setGalleryMode} />

                  {galleryMode === "url" ? (
                    <div className="flex gap-2 mb-3 flex-wrap">
                      <input value={newGalleryUrl} onChange={(e) => setNewGalleryUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGalleryUrl())}
                        className="flex-1 min-w-40 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                        placeholder="Paste Drive URL…" />
                      {/* Type selector */}
                      <div className="flex gap-1">
                        {(["image", "video", "pdf"] as MediaType[]).map((t) => (
                          <button key={t} type="button" onClick={() => setNewGalleryType(t)}
                            className={cn("px-3 py-2 rounded-xl text-xs font-bold border capitalize transition-all",
                              newGalleryType === t ? typeColors[t] : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-white")}>
                            {t}
                          </button>
                        ))}
                      </div>
                      <button type="button" onClick={addGalleryUrl} disabled={!newGalleryUrl.trim()}
                        className="px-4 py-2.5 bg-zinc-700 text-white rounded-xl hover:bg-zinc-600 text-sm font-medium disabled:opacity-40">
                        Add
                      </button>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <input ref={galleryFileRef} type="file" accept="image/*,video/*,application/pdf" multiple className="hidden"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (!files.length) return;
                          setUploadingGallery(true);
                          try {
                            const items: GalleryItem[] = [];
                            for (const file of files) {
                              const url = await uploadToGoogleDrive(file, "portfolio");
                              items.push({ url, mediaType: inferMediaType(file) });
                            }
                            setFormData((p) => ({ ...p, gallery: [...p.gallery, ...items] }));
                          } catch (err: any) { alert("Gallery upload failed: " + err.message); }
                          finally { setUploadingGallery(false); if (galleryFileRef.current) galleryFileRef.current.value = ""; }
                        }} />
                      <button type="button" onClick={() => galleryFileRef.current?.click()} disabled={uploadingGallery}
                        className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700 text-white text-sm disabled:opacity-50">
                        {uploadingGallery ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
                        {uploadingGallery ? "Uploading…" : "Upload Images / Videos / PDFs"}
                      </button>
                      <p className="text-xs text-zinc-500 mt-1">Type auto-detected · override per item below</p>
                    </div>
                  )}

                  {/* Gallery list */}
                  {formData.gallery.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {formData.gallery.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-zinc-800 rounded-lg">
                          {/* Thumbnail */}
                          <div className="w-12 h-12 rounded overflow-hidden bg-zinc-700 shrink-0">
                            <DriveThumbnail url={item.url} mediaType={item.mediaType}
                              className="w-full h-full object-cover" showBadge={false} />
                          </div>
                          {/* URL */}
                          <span className="flex-1 text-xs text-zinc-400 truncate">{item.url}</span>
                          {/* Type override */}
                          <div className="flex gap-1 shrink-0">
                            {(["image", "video", "pdf"] as MediaType[]).map((t) => (
                              <button key={t} type="button" onClick={() => updateGalleryType(i, t)}
                                className={cn("px-1.5 py-0.5 rounded text-[9px] font-black capitalize border transition-all",
                                  item.mediaType === t ? typeColors[t] : "bg-zinc-700 border-zinc-600 text-zinc-500 hover:text-white")}>
                                {t}
                              </button>
                            ))}
                          </div>
                          <button type="button" onClick={() => removeGalleryItem(i)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 resize-none"
                    placeholder="Brief description of the shoot…" />
                </div>
              </div>

              {/* ── SEO ── */}
              <div className="p-5 border-t border-zinc-800">
                <h3 className="text-sm font-semibold text-white mb-4">SEO Settings</h3>

                <div className="mb-4">
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    SEO Title
                  </label>

                  <input
                    value={formData.seo_title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seo_title: e.target.value,
                      })
                    }
                    placeholder="SEO Title"
                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white"
                  />
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    Canonical URL
                  </label>

                  <input
                    value={formData.canonical_url}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        canonical_url: e.target.value,
                      })
                    }
                    placeholder="https://www.kuttistoryphotography.com/portfolio/..."
                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white"
                  />
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    GEO Keywords
                  </label>

                  <textarea
                    value={formData.geo_keywords.join(", ")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        geo_keywords: e.target.value
                          .split(",")
                          .map((k) => k.trim())
                          .filter(Boolean),
                      })
                    }
                    rows={3}
                    placeholder="Madurai, Theni, Dindigul, Chennai..."
                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white"
                  />
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    AEO Questions
                  </label>

                  <textarea
                    value={formData.aeo_questions.join("\n")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        aeo_questions: e.target.value
                          .split("\n")
                          .map((q) => q.trim())
                          .filter(Boolean),
                      })
                    }
                    rows={5}
                    placeholder={`What is the best wedding photographer in Madurai?
                    How much does wedding photography cost?
                    Why choose Kutti Story Photography?`}
                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white"
                  />
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    AI Description
                  </label>

                  <textarea
                    value={formData.ai_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ai_description: e.target.value,
                      })
                    }
                    rows={5}
                    placeholder="Describe this portfolio for AI search engines like ChatGPT, Gemini, Claude..."
                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white"
                  />
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    Schema Type
                  </label>

                  <select
                    value={formData.schema_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        schema_type: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white"
                  >
                    <option value="ImageGallery">ImageGallery</option>
                    <option value="Photograph">Photograph</option>
                    <option value="CreativeWork">CreativeWork</option>
                    <option value="Event">Event</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    Robots
                  </label>

                  <select
                    value={formData.robots}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        robots: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white"
                  >
                    <option value="index,follow">index,follow</option>
                    <option value="noindex,follow">noindex,follow</option>
                    <option value="index,nofollow">index,nofollow</option>
                    <option value="noindex,nofollow">noindex,nofollow</option>
                  </select>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-zinc-300">Meta Title</label>
                    <span
                      className={cn(
                        "text-xs",
                        formData.meta_title.length > 100
                          ? "text-red-400"
                          : formData.meta_title.length > 80
                          ? "text-amber-400"
                          : "text-zinc-500"
                      )}
                    >
                      {formData.meta_title.length}/100
                    </span>
                  </div>
                  <input value={formData.meta_title} onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    placeholder={formData.title ? `${formData.title} | Photography` : "Enter meta title"}
                    maxLength={100}
                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 text-sm" />
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-zinc-300">Meta Description</label>
                    <span className={cn("text-xs", formData.meta_description.length > 300 ? "text-red-400" : formData.meta_description.length > 250 ? "text-amber-400" : "text-zinc-500")}>
                      {formData.meta_description.length}/300
                    </span>
                  </div>
                  <textarea value={formData.meta_description} onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    maxLength={300} rows={3}
                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 text-sm resize-none"
                    placeholder="Enter a compelling description (up to 300 characters)" />
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">Social Share Image (OG)</label>
                  <input value={formData.og_image} onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
                    placeholder={formData.cover_image || "Paste image URL for social sharing"}
                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 text-sm" />
                  <p className="text-xs text-zinc-500 mt-1">Leave empty to use cover image. Recommended: 1200×630px</p>
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">Focus Keywords</label>
                  <div className="flex gap-2 mb-2">
                    <input value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newKeyword.trim()) {
                          e.preventDefault();
                          const kw = newKeyword.trim().toLowerCase();
                          if (!formData.focus_keywords.includes(kw))
                            setFormData((p) => ({ ...p, focus_keywords: [...p.focus_keywords, kw] }));
                          setNewKeyword("");
                        }
                      }}
                      placeholder="Type keyword and press Enter"
                      className="flex-1 px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 text-sm" />
                    <button type="button"
                      onClick={() => {
                        const kw = newKeyword.trim().toLowerCase();
                        if (kw && !formData.focus_keywords.includes(kw)) {
                          setFormData((p) => ({ ...p, focus_keywords: [...p.focus_keywords, kw] }));
                          setNewKeyword("");
                        }
                      }}
                      className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 text-sm font-medium">
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.focus_keywords.map((kw, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                        {kw}
                        <button type="button" onClick={() => setFormData((p) => ({ ...p, focus_keywords: p.focus_keywords.filter((_, j) => j !== i) }))}
                          className="hover:text-white"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* SEO preview */}
                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-2">Google Search Preview:</p>
                  <p className="text-blue-400 text-sm font-medium truncate">
                    {formData.seo_title || formData.meta_title || `${formData.title || "Portfolio Title"} | Photography`}
                  </p>
                  <p className="text-emerald-500 text-xs truncate">
                    https://www.kuttistoryphotography.com/portfolio/{createSlug(formData.title) || "slug"}
                  </p>
                  <p className="text-zinc-400 text-xs line-clamp-2">
                    {formData.seo_description || formData.meta_description || formData.description || "Add a meta description to improve click-through rates."}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 p-5 border-t border-zinc-800 bg-zinc-900 shrink-0">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-amber-500" />
                  <span className="text-sm text-zinc-400">Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.published} onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-amber-500" />
                  <span className="text-sm text-zinc-400">Published</span>
                </label>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-white bg-transparent hover:bg-zinc-800 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={handleSave} disabled={saving || !formData.title.trim() || !formData.category}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : (editingItem ? "Update Portfolio" : "Create Portfolio")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}