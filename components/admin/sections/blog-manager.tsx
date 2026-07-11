"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { toImageUrl } from "@/lib/media";
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Star, Upload, X, Copy,
  Loader2, Video, ImageIcon, Link, CloudUpload, Check,
} from "lucide-react";

type BlogStatus = "draft" | "published" | "archived";
type MediaMode = "url" | "file";

interface BlogItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author_name: string;
  cover_image: string;
  category: string;
  tags: string[];
  status: BlogStatus;
  is_featured: boolean;
  view_count: number;
  meta_title: string;
  meta_description: string;
  og_image: string;
  canonical_url: string;
  focus_keywords: string[];
  schema_type: string;
  created_at: string;
  published_at: string | null;
}

interface BlogManagerProps {
  onCountChange?: (count: number) => void;
  viewMode: "grid" | "list";
}

const emptyForm = {
  title: "",
  slug: "",
  category: "General",
  excerpt: "",
  content: "",
  cover_image: "",
  status: "draft" as BlogStatus,
  is_featured: false,
  tagsText: "",
  meta_title: "",
  meta_description: "",
  og_image: "",
  canonical_url: "",
  focus_keywords_text: "",
  schema_type: "Article",
};

async function uploadToGoogleDrive(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("context", "blog");
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (!data.success || !data.url) throw new Error(data.error || "Upload failed");
  return data.url;
}

function ModeToggle({ mode, setMode }: { mode: MediaMode; setMode: (m: MediaMode) => void }) {
  return (
    <div className="flex gap-1 mb-2">
      <button type="button" onClick={() => setMode("url")}
        className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
          mode === "url" ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-white")}>
        <Link className="w-3 h-3" /> Paste URL
      </button>
      <button type="button" onClick={() => setMode("file")}
        className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
          mode === "file" ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-white")}>
        <CloudUpload className="w-3 h-3" /> Upload File
      </button>
    </div>
  );
}

export default function BlogManager({  onCountChange,  viewMode, }: BlogManagerProps) {
  console.log("BLOG VIEW MODE =", viewMode);
  const [posts, setPosts] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<BlogItem | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  // Cover image upload state
  const [coverMode, setCoverMode] = useState<MediaMode>("url");
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverFileRef = useRef<HTMLInputElement>(null);

  // Content media upload state
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<Array<{ url: string; type: string }>>([]);
  const mediaFileRef = useRef<HTMLInputElement>(null);

  const visiblePosts = useMemo(() => posts, [posts]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/blog?admin=true&limit=100");
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to fetch"); setPosts([]); return; }
      const blogs = Array.isArray(data.blogs) ? data.blogs : [];
      setPosts(blogs);
      onCountChange?.(blogs.length);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch blog posts");
      setPosts([]);
      onCountChange?.(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBlogs(); }, []);

  const openCreateModal = () => {
    setEditing(null);
    setFormData(emptyForm);
    setUploadedUrls([]);
    setCoverMode("url");
    setShowModal(true);
  };

  const openEditModal = (post: BlogItem) => {
    setEditing(post);
    setFormData({
      title: post.title || "",
      slug: post.slug || "",
      category: post.category || "General",
      excerpt:             post.excerpt || "",
      content:             post.content || "",
      cover_image:         post.cover_image || "",
      status:              post.status || "draft",
      is_featured:         Boolean(post.is_featured),
      tagsText:            Array.isArray(post.tags) ? post.tags.join(", ") : "",
      meta_title:          post.meta_title || "",
      meta_description:    post.meta_description || "",
      og_image:            post.og_image || "",
      canonical_url:       post.canonical_url || "",
      focus_keywords_text: Array.isArray(post.focus_keywords) ? post.focus_keywords.join(", ") : "",
      schema_type:         post.schema_type || "Article",
    });
    setUploadedUrls([]);
    setCoverMode("url");
    setShowModal(true);
  };

  const parseTags = (value: string) =>
    value.split(",").map((t) => t.trim()).filter(Boolean);

  const handleSave = async () => {
    if (!formData.title.trim()) { alert("Title is required"); return; }
    if (!formData.content.trim()) { alert("Content is required"); return; }
    setSaving(true);
    try {
      const payload = {
         id: editing?.id,
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        category: formData.category.trim() || "General",
        excerpt:          formData.excerpt,
        content:          formData.content,
        cover_image:      formData.cover_image,
        status:           formData.status,
        is_featured:      formData.is_featured,
        tags:             parseTags(formData.tagsText),
        meta_title:       formData.meta_title,
        meta_description: formData.meta_description,
        og_image:         formData.og_image,
        canonical_url:    formData.canonical_url,
        focus_keywords:   parseTags(formData.focus_keywords_text),
        schema_type:      formData.schema_type,
      };

      const url = "/api/blog";
      const method = editing ? "PUT" : "POST";
      console.log("Sending payload:", payload);
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log("Response:", res.status, data);
      if (!res.ok) { alert(data.error || "Failed to save blog post"); return; }
      setShowModal(false);
      await fetchBlogs();
    } catch (err) {
      console.error(err);
      alert("Failed to save blog post");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this blog post?")) return;
    try {
      const res = await fetch(`/api/blog?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed to delete"); return; }
      await fetchBlogs();
    } catch (err) { console.error(err); alert("Failed to delete"); }
  };

  const toggleStatus = async (post: BlogItem) => {
    const nextStatus: BlogStatus = post.status === "published" ? "draft" : "published";
    try {
      const res = await fetch(`/api/blog`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: post.id,
          status: nextStatus,
        }),
        });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed to update status"); return; }
      await fetchBlogs();
    } catch { alert("Failed to update status"); }
  };

  const toggleFeatured = async (post: BlogItem) => {
    try {
      const res = await fetch(`/api/blog`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            id: post.id,
            is_featured: !post.is_featured,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed to update"); return; }
      await fetchBlogs();
    } catch { alert("Failed to update"); }
  };

  // Cover image — file upload to Google Drive
  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadToGoogleDrive(file);
      setFormData((prev) => ({
        ...prev,
        cover_image: url,
        og_image: prev.og_image || url,
      }));
    } catch (err: any) {
      alert("Cover upload failed: " + err.message);
    } finally {
      setUploadingCover(false);
      e.target.value = "";
    }
  };

  // Content media — file upload to Google Drive
  const handleMediaFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingMedia(true);
    try {
      const results: Array<{ url: string; type: string }> = [];
      for (const file of files) {
        const url = await uploadToGoogleDrive(file);
        results.push({ url, type: file.type });
        // Auto-set cover if not set and it's an image
        if (file.type.startsWith("image/") && !formData.cover_image) {
          setFormData((prev) => ({ ...prev, cover_image: url }));
        }
      }
      setUploadedUrls((prev) => [...results, ...prev]);
    } catch (err: any) {
      alert("Media upload failed: " + err.message);
    } finally {
      setUploadingMedia(false);
      e.target.value = "";
    }
  };

  const appendToContent = (url: string, type: string) => {
    const snippet = type.startsWith("video/")
      ? `\n<p><video controls src="${url}" class="w-full rounded-xl"></video></p>\n`
      : `\n<p><img src="${url}" alt="Blog media" class="w-full rounded-xl" /></p>\n`;
    setFormData((prev) => ({ ...prev, content: (prev.content || "") + snippet }));
  };

  const copyUrl = async (url: string) => {
    try { await navigator.clipboard.writeText(url); } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-black rounded-xl font-medium hover:bg-amber-400 transition-colors">
          <Plus className="w-4 h-4" /> Add Blog Post
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-red-400 mb-2">Failed to load blog posts</p>
          <p className="text-zinc-500 text-sm mb-4">{error}</p>
          <button onClick={fetchBlogs} className="px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition">Retry</button>
        </div>
      ) : (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-4"
          )}
        >
          
          {visiblePosts.map((post) => (
            <div
              key={post.id}
              className={cn(
                "bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-colors flex",
                viewMode === "grid"
                  ? "p-4 h-full"
                  : "p-5"
              )}
            >
              <div
                className={cn(
                  "w-full",
                  viewMode === "grid"
                    ? "flex flex-col h-full"
                    : "flex items-start gap-4"
                )}
              >
                {/* Thumbnail */}
                {post.cover_image ? (
                  <img src={toImageUrl(post.cover_image, 200)} alt={post.title}
                    className={cn(
                      "rounded-xl object-cover border border-zinc-700",
                      viewMode === "grid"
                        ? "w-full h-48 mb-4"
                        : "w-16 h-16 shrink-0"
                    )}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-6 h-6 text-zinc-600" />
                  </div>
                )}

                <div
                  className={cn(
                    "flex-1 min-w-0",
                    viewMode === "grid" && "flex flex-col h-full"
                  )}
                >
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="font-semibold text-lg truncate">{post.title}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                      post.status === "published" ? "bg-emerald-500/10 text-emerald-400"
                        : post.status === "archived" ? "bg-zinc-500/10 text-zinc-400"
                        : "bg-amber-500/10 text-amber-400")}>
                      {post.status}
                    </span>
                    {post.is_featured && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400">Featured</span>
                    )}
                    {post.category && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-zinc-800 text-zinc-400">{post.category}</span>
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-sm text-zinc-500 mb-2",
                      viewMode === "grid"
                        ? "line-clamp-3 flex-1"
                        : "line-clamp-1"
                    )}
                  >{post.excerpt || "No excerpt"}</p>
                  <div className="flex items-center gap-4 text-xs text-zinc-600">
                    <span>{new Date(post.created_at).toLocaleDateString("en-IN")}</span>
                    {post.status === "published" && <span>{post.view_count} views</span>}
                  </div>
                </div>

                <div
                  className={cn(
                    "flex items-center gap-1 shrink-0",
                    viewMode === "grid"
                      ? "mt-auto pt-4 justify-end border-t border-zinc-800"
                      : ""
                  )}
                >
                  <button onClick={() => toggleStatus(post)}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    title={post.status === "published" ? "Unpublish" : "Publish"}>
                    {post.status === "published" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => toggleFeatured(post)}
                    className={cn("p-2 hover:bg-zinc-800 rounded-lg transition-colors",
                      post.is_featured ? "text-amber-500" : "text-zinc-400 hover:text-amber-400")}
                    title={post.is_featured ? "Remove featured" : "Mark featured"}>
                    <Star className={cn("w-4 h-4", post.is_featured && "fill-current")} />
                  </button>
                  <button onClick={() => openEditModal(post)}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(post.id)}
                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!visiblePosts.length && (
            <div className="bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-700 p-10 text-center">
              <FileEmpty />
              <p className="font-medium text-zinc-300 mt-3">No blog posts yet</p>
              <p className="text-sm text-zinc-500 mt-1">Create your first post from admin.</p>
            </div>
          )}
        </div>
      )}

      {/* ===== MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-lg font-semibold">{editing ? "Edit Blog Post" : "Create Blog Post"}</h2>
              <button onClick={() => setShowModal(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Title + Category */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      const slug = title
                        .toLowerCase()
                        .trim()
                        .replace(/[^\w\s-]/g, "")
                        .replace(/\s+/g, "-")
                        .replace(/-+/g, "-");

                      setFormData((p) => ({
                        ...p,
                        title,
                        slug,
                        canonical_url: `https://www.kuttistoryphotography.com/blog/${slug}`,
                        meta_title: p.meta_title || title,
                      }));
                    }}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                    placeholder="Enter blog title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Category</label>
                  <input type="text" value={formData.category}
                    onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                    placeholder="Wedding / Product / Corporate" />
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => {
                    const excerpt = e.target.value;

                    setFormData((p) => ({
                      ...p,
                      excerpt,

                      // Auto-fill Meta Description only if it's empty
                      meta_description: p.meta_description || excerpt,
                    }));
                  }}
                />
              </div>

              {/* ── Cover Image ── */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Cover Image</label>
                <ModeToggle mode={coverMode} setMode={setCoverMode} />

                {coverMode === "url" ? (
                  <input type="text" value={formData.cover_image}
                    onChange={(e) => {
                      const url = e.target.value;

                      setFormData((p) => ({
                        ...p,
                        cover_image: url,
                        og_image: p.og_image || url,
                      }));
                    }}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                    placeholder="https://example.com/image.jpg or paste any URL" />
                ) : (
                  <div className="flex items-center gap-3">
                    <input ref={coverFileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverFileChange} />
                    <button type="button" onClick={() => coverFileRef.current?.click()} disabled={uploadingCover}
                      className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700 text-white text-sm disabled:opacity-50 transition-colors">
                      {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploadingCover ? "Uploading to Drive..." : "Choose Image File"}
                    </button>
                    {formData.cover_image && !uploadingCover && (
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <Check className="w-3 h-3" /> Uploaded
                      </span>
                    )}
                  </div>
                )}

                {formData.cover_image && (
                  <div className="mt-2 relative">
                    <img src={formData.cover_image} alt="Cover preview"
                      className="h-28 w-auto object-cover rounded-xl border border-zinc-700"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <button type="button" onClick={() => setFormData((p) => ({ ...p, cover_image: "" }))}
                      className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-colors text-xs">
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* ── Content Media Upload (Google Drive) ── */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm font-medium text-zinc-300">Upload Media for Content</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Images and videos are uploaded to Google Drive — paste or insert into content below</p>
                  </div>
                  <div>
                    <input ref={mediaFileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleMediaFileChange} />
                    <button type="button" onClick={() => mediaFileRef.current?.click()} disabled={uploadingMedia}
                      className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-white disabled:opacity-50 transition-colors">
                      {uploadingMedia ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
                      {uploadingMedia ? "Uploading..." : "Upload Image / Video"}
                    </button>
                  </div>
                </div>

                {uploadedUrls.length > 0 && (
                  <div className="space-y-2 max-h-44 overflow-y-auto">
                    {uploadedUrls.map((item, idx) => (
                      <div key={`${item.url}-${idx}`} className="flex items-center gap-2 p-2 bg-zinc-800 rounded-lg">
                        <div className="shrink-0 text-zinc-400">
                          {item.type.startsWith("video/") ? <Video className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                        </div>
                        {item.type.startsWith("image/") && (
                          <img src={item.url} alt="" className="w-10 h-10 rounded object-cover border border-zinc-700 shrink-0" />
                        )}
                        <span className="flex-1 text-xs text-zinc-300 truncate">{item.url}</span>
                        <button type="button" onClick={() => setFormData((p) => ({ ...p, cover_image: item.url }))}
                          className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 shrink-0"
                          title="Set as cover image">Cover</button>
                        <button type="button" onClick={() => appendToContent(item.url, item.type)}
                          className="px-2 py-1 text-xs bg-amber-500/20 text-amber-400 rounded hover:bg-amber-500/30 shrink-0">Insert</button>
                        <button type="button" onClick={() => copyUrl(item.url)}
                          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded shrink-0">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Tags (comma separated)</label>
                <input type="text" value={formData.tagsText}
                  onChange={(e) => setFormData((p) => ({ ...p, tagsText: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  placeholder="wedding, photography, tips" />
              </div>

              {/* SEO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Meta Title</label>
                  <input type="text" value={formData.meta_title}
                    onChange={(e) => setFormData((p) => ({ ...p, meta_title: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                    placeholder="SEO meta title" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Schema Type</label>
                  <input type="text" value={formData.schema_type}
                    onChange={(e) => setFormData((p) => ({ ...p, schema_type: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                    placeholder="Article" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Meta Description</label>
                <textarea value={formData.meta_description}
                  onChange={(e) => setFormData((p) => ({ ...p, meta_description: e.target.value }))}
                  rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 resize-none"
                  placeholder="SEO meta description" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">OG Image URL</label>
                  <input type="text" value={formData.og_image}
                    onChange={(e) => setFormData((p) => ({ ...p, og_image: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                    placeholder="Leave blank to use cover image" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Canonical URL</label>
                  <input
                    type="text"
                    value={formData.canonical_url}
                    readOnly
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-400 cursor-not-allowed"
                    placeholder="Generated automatically"
                  />
                </div>
              </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Slug
              </label>

              <input
                type="text"
                value={formData.slug}
                onChange={(e) => {
                  const slug = e.target.value
                    .toLowerCase()
                    .trim()
                    .replace(/[^\w\s-]/g, "")
                    .replace(/\s+/g, "-")
                    .replace(/-+/g, "-");

                  setFormData((p) => ({
                    ...p,
                    slug,
                    canonical_url: `https://www.kuttistoryphotography.com/blog/${slug}`,
                  }));
                }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                placeholder="best-wedding-photography-packages-madurai-2026"
              />
            </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Focus Keywords (comma separated)</label>
                <input type="text" value={formData.focus_keywords_text}
                  onChange={(e) => setFormData((p) => ({ ...p, focus_keywords_text: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  placeholder="wedding photography chennai, cinematic wedding" />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Content (HTML supported) *</label>
                <textarea value={formData.content}
                  onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
                  rows={14}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 font-mono text-sm"
                  placeholder="<p>Your blog content here...</p>" />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 p-5 border-t border-zinc-800 bg-zinc-900">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-400">
                  <input type="checkbox" checked={formData.is_featured}
                    onChange={(e) => setFormData((p) => ({ ...p, is_featured: e.target.checked }))}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500" />
                  Featured
                </label>
                <select value={formData.status}
                  onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as BlogStatus }))}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl">
                  Cancel
                </button>
                <button type="button" onClick={handleSave} disabled={saving || !formData.title.trim()}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? "Update Blog" : "Create Blog"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FileEmpty() {
  return (
    <svg viewBox="0 0 24 24" className="w-10 h-10 text-zinc-600 mx-auto" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
    </svg>
  );
}