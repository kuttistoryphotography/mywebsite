"use client";

/**
 * components/admin/sections/photography-categories-section.tsx
 *
 * Admin section: manage photography service categories.
 * Each category can hold any number of PDF pricing documents (stored on Google Drive).
 * When a user requests a quote for a category, all PDFs are emailed via Drive links.
 *
 * Features: Create / Edit / Delete categories  +  Upload / Delete PDFs per category
 */

import { useEffect, useRef, useState } from "react";
import {
  Plus, Trash2, Edit2, FileText, Upload, ExternalLink, Loader2,
  X, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Eye, EyeOff,
  Camera, Image, Baby, Utensils, TreePine, Megaphone, Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────
interface CategoryPdf {
  _id:               string;
  driveFileId?:      string;
  driveWebViewLink?: string;
  publicId?:         string;
  url?:              string;
  downloadUrl?:      string;
  driveDownloadLink?: string;
  fileName:          string;
  fileSizeBytes?:    number;
  label?:            string;
  uploadedAt:        string;
}

interface PhotographyCategory {
  _id:          string;
  name:         string;
  slug:         string;
  description?: string;
  isActive:     boolean;
  sortOrder:    number;
  pdfs:         CategoryPdf[];
  createdAt:    string;
}

// ── Predefined category suggestions ──────────────────────────────────────────
const PRESET_CATEGORIES = [
  { name: "Photography",         icon: Camera   },
  { name: "Wedding Services", icon: Camera   },
  { name: "Outdoor Photography", icon: TreePine },
  { name: "Baby Shoots",         icon: Baby     },
  { name: "Food Photography",    icon: Utensils },
  { name: "Ads Photography",     icon: Megaphone},
  { name: "Product Photography",     icon: Megaphone},
  { name: "Ad Shoot",     icon: Megaphone},

];

function formatBytes(b?: number) {
  if (!b) return "—";
  if (b < 1024)      return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 ** 2).toFixed(1)} MB`;
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function PhotographyCategoriesSection() {
  const [categories, setCategories] = useState<PhotographyCategory[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [expanded,   setExpanded]   = useState<Record<string, boolean>>({});
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);

  // Create/edit modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat,   setEditingCat]   = useState<PhotographyCategory | null>(null);
  const [catName,      setCatName]      = useState("");
  const [catDesc,      setCatDesc]      = useState("");
  const [catActive,    setCatActive]    = useState(true);
  const [savingCat,    setSavingCat]    = useState(false);

  // PDF upload
  const [uploadingFor,  setUploadingFor]  = useState<string | null>(null);
  const [pdfLabel,      setPdfLabel]      = useState("");
  const [pdfFiles,      setPdfFiles]      = useState<File[]>([]);
  const [uploadingPdfs, setUploadingPdfs] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Deleting
  const [deletingCat, setDeletingCat] = useState<string | null>(null);
  const [deletingPdf, setDeletingPdf] = useState<string | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Load ───────────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/photography-categories?all=1");
      const data = await res.json();
      setCategories(Array.isArray(data.categories) ? data.categories : []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Open create/edit modal ─────────────────────────────────────────────────
  const openCreate = (preset?: string) => {
    setEditingCat(null);
    setCatName(preset || "");
    setCatDesc("");
    setCatActive(true);
    setShowCatModal(true);
  };

  const openEdit = (cat: PhotographyCategory) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatDesc(cat.description || "");
    setCatActive(cat.isActive);
    setShowCatModal(true);
  };

  // ── Save category ──────────────────────────────────────────────────────────
  const handleSaveCat = async () => {
    if (!catName.trim()) { showToast("Category name is required.", false); return; }
    setSavingCat(true);
    try {
      const method = editingCat ? "PUT" : "POST";
      const body   = editingCat
        ? { id: editingCat._id, name: catName, description: catDesc, isActive: catActive }
        : { name: catName, description: catDesc, isActive: catActive };

      const res  = await fetch("/api/photography-categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      showToast(editingCat ? "Category updated!" : "Category created!");
      setShowCatModal(false);
      await load();
    } catch (e: any) {
      showToast(e?.message || "Save failed", false);
    } finally {
      setSavingCat(false);
    }
  };

  // ── Delete category ────────────────────────────────────────────────────────
  const handleDeleteCat = async (id: string) => {
    if (!confirm("Delete this category and ALL its PDFs? This cannot be undone.")) return;
    setDeletingCat(id);
    try {
      const res = await fetch(`/api/photography-categories?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      showToast("Category deleted.");
      setCategories((p) => p.filter((c) => c._id !== id));
    } catch {
      showToast("Failed to delete.", false);
    } finally {
      setDeletingCat(null);
    }
  };

  // ── Toggle active ──────────────────────────────────────────────────────────
  const handleToggleActive = async (cat: PhotographyCategory) => {
    try {
      const res = await fetch("/api/photography-categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cat._id, isActive: !cat.isActive }),
      });
      if (!res.ok) throw new Error();
      setCategories((prev) =>
        prev.map((c) => c._id === cat._id ? { ...c, isActive: !c.isActive } : c)
      );
    } catch {
      showToast("Failed to toggle.", false);
    }
  };

  // ── Upload PDFs ────────────────────────────────────────────────────────────
  const handleUploadPdfs = async (catId: string) => {
    if (!pdfFiles.length) { showToast("Select at least one PDF.", false); return; }
    setUploadingPdfs(true);
    try {
      const fd = new FormData();
      pdfFiles.forEach((f) => fd.append("files", f));
      if (pdfLabel.trim()) fd.append("label", pdfLabel.trim());

      const res  = await fetch(`/api/photography-categories/${catId}/pdfs`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      const addedCount = (data.added || []).length;
      const errCount   = (data.errors || []).length;
      showToast(
        errCount
          ? `${addedCount} uploaded, ${errCount} failed.`
          : `${addedCount} PDF(s) uploaded!`
      );
      setUploadingFor(null);
      setPdfFiles([]);
      setPdfLabel("");
      await load();
    } catch (e: any) {
      showToast(e?.message || "Upload failed", false);
    } finally {
      setUploadingPdfs(false);
    }
  };

  // ── Delete PDF ─────────────────────────────────────────────────────────────
  const handleDeletePdf = async (catId: string, pdfId: string) => {
    if (!confirm("Remove this PDF?")) return;
    setDeletingPdf(pdfId);
    try {
      const res = await fetch(`/api/photography-categories/${catId}/pdfs?pdfId=${pdfId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("PDF removed.");
      setCategories((prev) =>
        prev.map((c) =>
          c._id === catId ? { ...c, pdfs: c.pdfs.filter((p) => p._id !== pdfId) } : c
        )
      );
    } catch {
      showToast("Failed to delete PDF.", false);
    } finally {
      setDeletingPdf(null);
    }
  };

  const toggleExpand = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Photography Categories</h2>
          <p className="text-sm text-zinc-400 mt-0.5">
            Manage service categories and their pricing PDF documents.
            PDFs are stored on Google Drive and emailed to clients on quote requests.
          </p>
        </div>
        <button
          onClick={() => openCreate()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition-colors"
        >
          <Plus size={15} /> New Category
        </button>
      </div>

      {/* Quick-add presets */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-zinc-500 self-center mr-1">Quick add:</span>
        {PRESET_CATEGORIES.map(({ name, icon: Icon }) => (
          <button
            key={name}
            onClick={() => openCreate(name)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:border-amber-500/60 hover:text-amber-300 text-xs transition-colors"
          >
            <Icon size={12} /> {name}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-zinc-500">
          <Loader2 size={20} className="animate-spin mr-2" /> Loading categories…
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <Camera size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No categories yet</p>
          <p className="text-sm mt-1">Click "New Category" or use the quick-add buttons above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className={cn(
                "rounded-xl border overflow-hidden transition-colors",
                cat.isActive
                  ? "border-zinc-700/60 bg-zinc-900"
                  : "border-zinc-800/40 bg-zinc-900/40 opacity-60"
              )}
            >
              {/* Category header row */}
              <div className="flex items-center gap-3 px-5 py-3 bg-zinc-800/50 border-b border-zinc-700/40">
                <button
                  onClick={() => toggleExpand(cat._id)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  {expanded[cat._id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-semibold">{cat.name}</span>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full border",
                      cat.isActive
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-zinc-700/30 text-zinc-500 border-zinc-600/20"
                    )}>
                      {cat.isActive ? "Active" : "Hidden"}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {cat.pdfs.length} PDF{cat.pdfs.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {cat.description && (
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">{cat.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggleActive(cat)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                    title={cat.isActive ? "Hide from users" : "Show to users"}
                  >
                    {cat.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setUploadingFor(cat._id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                    title="Upload PDFs"
                  >
                    <Upload size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteCat(cat._id)}
                    disabled={deletingCat === cat._id}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                    title="Delete category"
                  >
                    {deletingCat === cat._id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Trash2 size={14} />}
                  </button>
                </div>
              </div>

              {/* PDF list (expandable) */}
              {expanded[cat._id] && (
                <div>
                  {cat.pdfs.length === 0 ? (
                    <div className="px-5 py-4 text-sm text-zinc-500">
                      No PDFs uploaded yet.{" "}
                      <button
                        onClick={() => setUploadingFor(cat._id)}
                        className="text-amber-400 hover:underline"
                      >
                        Upload now
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-800">
                      {cat.pdfs.map((pdf) => (
                        <div
                          key={pdf._id}
                          className="flex items-center gap-4 px-5 py-3 hover:bg-zinc-800/30 transition-colors"
                        >
                          <FileText size={16} className="text-amber-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate">
                              {pdf.label || pdf.fileName}
                            </p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {pdf.fileName} · {formatBytes(pdf.fileSizeBytes)} ·{" "}
                              {new Date(pdf.uploadedAt).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {pdf.driveWebViewLink && (
                              <a
                                href={pdf.url || pdf.driveWebViewLink || `/api/pdf-proxy?url=${encodeURIComponent(pdf.driveWebViewLink || "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                                title="View on Drive"
                              >
                                <ExternalLink size={13} />
                              </a>
                            )}
                            <button
                              onClick={() => handleDeletePdf(cat._id, pdf._id)}
                              disabled={deletingPdf === pdf._id}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                              title="Remove PDF"
                            >
                              {deletingPdf === pdf._id
                                ? <Loader2 size={13} className="animate-spin" />
                                : <Trash2 size={13} />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline upload row */}
                  <div className="px-5 py-3 border-t border-zinc-800/60 flex items-center gap-3">
                    <button
                      onClick={() => setUploadingFor(cat._id)}
                      className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      <Upload size={12} /> Add more PDFs
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Category Modal ──────────────────────────────────── */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">
                {editingCat ? "Edit Category" : "New Category"}
              </h3>
              <button onClick={() => setShowCatModal(false)} className="text-zinc-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-zinc-300 text-sm font-medium block mb-1">
                  Category Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Wedding Photography"
                  className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-zinc-300 text-sm font-medium block mb-1">Description</label>
                <textarea
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  rows={2}
                  placeholder="Brief description shown to users..."
                  className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={catActive}
                  onChange={(e) => setCatActive(e.target.checked)}
                  className="w-4 h-4 accent-amber-500"
                />
                <span className="text-zinc-300 text-sm">Active (visible to users)</span>
              </label>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowCatModal(false)}
                  className="flex-1 py-2 rounded-lg border border-zinc-600 text-zinc-300 text-sm hover:border-zinc-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCat}
                  disabled={savingCat || !catName.trim()}
                  className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {savingCat ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {savingCat ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Upload PDFs Modal ─────────────────────────────────────────────── */}
      {uploadingFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Upload PDFs</h3>
              <button
                onClick={() => { setUploadingFor(null); setPdfFiles([]); setPdfLabel(""); }}
                className="text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-zinc-300 text-sm font-medium block mb-1">Label (optional)</label>
                <input
                  type="text"
                  value={pdfLabel}
                  onChange={(e) => setPdfLabel(e.target.value)}
                  placeholder="e.g. Premium Package, Starter Pack…"
                  className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
                <p className="text-zinc-500 text-xs mt-1">Applied to all files in this batch.</p>
              </div>

              {/* Drop zone */}
              <div
                onClick={() => fileRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                  pdfFiles.length
                    ? "border-amber-500/60 bg-amber-500/5"
                    : "border-zinc-600 hover:border-zinc-500"
                )}
              >
                {pdfFiles.length ? (
                  <div className="space-y-1">
                    {pdfFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-center gap-2 text-amber-300 text-sm">
                        <FileText size={14} />
                        <span className="truncate max-w-[200px]">{f.name}</span>
                        <span className="text-zinc-500">({formatBytes(f.size)})</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-zinc-500 text-sm">
                    <Upload size={20} className="mx-auto mb-1" />
                    Click to select PDFs (multiple allowed, max 20 MB each)
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => setPdfFiles(Array.from(e.target.files || []))}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setUploadingFor(null); setPdfFiles([]); setPdfLabel(""); }}
                  className="flex-1 py-2 rounded-lg border border-zinc-600 text-zinc-300 text-sm hover:border-zinc-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUploadPdfs(uploadingFor)}
                  disabled={uploadingPdfs || !pdfFiles.length}
                  className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {uploadingPdfs
                    ? <><Loader2 size={14} className="animate-spin" /> Uploading…</>
                    : <><Upload size={14} /> Upload to Drive</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border",
          toast.ok
            ? "bg-emerald-900/80 border-emerald-500/30 text-emerald-200"
            : "bg-red-900/80 border-red-500/30 text-red-200"
        )}>
          {toast.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
