"use client";

/**
 * components/admin/sections/quote-pdf-library-section.tsx
 *
 * Admin panel section: manage the pricing-tier PDF library.
 * The admin uploads PDFs here; they are stored in Google Drive.
 * When a user requests a quote the system auto-emails the PDFs for
 * their service type.
 *
 * Columns: Service Type | Tier | File | Uploaded | Actions
 */

import { useEffect, useRef, useState } from "react";
import {
  Upload, Trash2, FileText, CheckCircle, AlertCircle, Loader2, X, Plus,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TIERS = [
  { value: "budget_friendly", label: "Budget Friendly" },
  { value: "premium",         label: "Premium"         },
  { value: "low_cost",        label: "Low Cost"        },
  { value: "customizable",    label: "Customizable"    },
] as const;

type Tier = (typeof TIERS)[number]["value"];

interface QuotePdfEntry {
  _id:               string;
  serviceType:       string;
  tier:              Tier;
  label:             string;
  fileName:          string;
  driveWebViewLink?: string;
  url?:              string;
  downloadUrl?:      string;
  publicId?:         string;
  driveDownloadLink?: string;
  fileSizeBytes?:    number;
  isActive:          boolean;
  createdAt:         string;
}

function formatBytes(b?: number) {
  if (!b) return "—";
  if (b < 1024)       return `${b} B`;
  if (b < 1024 ** 2)  return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 ** 2).toFixed(1)} MB`;
}

export default function QuotePdfLibrarySection() {
  const [entries, setEntries]         = useState<QuotePdfEntry[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showUpload, setShowUpload]   = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [deleting, setDeleting]       = useState<string | null>(null);
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null);

  // Upload form state
  const [serviceType, setServiceType] = useState("");
  const [tier, setTier]               = useState<Tier>("budget_friendly");
  const [pdfFile, setPdfFile]         = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/quote-pdfs?all=1");
      const data = await res.json();
      setEntries(Array.isArray(data.quotePdfs) ? data.quotePdfs : []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Upload ─────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!pdfFile || !serviceType.trim()) {
      showToast("Please fill in service type and select a PDF.", false);
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file",        pdfFile);
      fd.append("serviceType", serviceType.trim().toLowerCase());
      fd.append("tier",        tier);

      const res  = await fetch("/api/quote-pdfs", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");

      showToast("PDF uploaded successfully!");
      setShowUpload(false);
      setServiceType("");
      setTier("budget_friendly");
      setPdfFile(null);
      await load();
    } catch (e: any) {
      showToast(e?.message || "Upload failed", false);
    } finally {
      setUploading(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this PDF from the library? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/quote-pdfs?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      showToast("PDF deleted.");
      setEntries((prev) => prev.filter((e) => e._id !== id));
    } catch {
      showToast("Failed to delete.", false);
    } finally {
      setDeleting(null);
    }
  };

  // ── Group by service type ──────────────────────────────────────────────────
  const grouped = entries.reduce<Record<string, QuotePdfEntry[]>>((acc, e) => {
    const key = e.serviceType;
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  const tierCoverage = (list: QuotePdfEntry[]) => {
    const have = new Set(list.map((e) => e.tier));
    return TIERS.map((t) => ({ ...t, present: have.has(t.value) }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Quote PDF Library</h2>
          <p className="text-sm text-zinc-400 mt-0.5">
            Upload pricing-tier PDFs per service type. They are automatically
            emailed to clients when they submit a quote request.
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
        >
          <Plus size={15} />
          Add PDF
        </button>
      </div>

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Upload Pricing PDF</h3>
              <button onClick={() => setShowUpload(false)} className="text-zinc-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Service Type */}
              <div>
                <label className="text-zinc-300 text-sm font-medium block mb-1">
                  Service Type <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  placeholder="e.g. wedding, food, outdoor"
                  className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                />
                <p className="text-zinc-500 text-xs mt-1">Lowercase, matches the serviceType users choose.</p>
              </div>

              {/* Tier */}
              <div>
                <label className="text-zinc-300 text-sm font-medium block mb-1">
                  Pricing Tier <span className="text-red-400">*</span>
                </label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as Tier)}
                  className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                >
                  {TIERS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* File picker */}
              <div>
                <label className="text-zinc-300 text-sm font-medium block mb-1">
                  PDF File <span className="text-red-400">*</span>
                </label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                    pdfFile
                      ? "border-violet-500/60 bg-violet-500/5"
                      : "border-zinc-600 hover:border-zinc-500"
                  )}
                >
                  {pdfFile ? (
                    <div className="flex items-center justify-center gap-2 text-violet-300 text-sm">
                      <FileText size={16} />
                      <span>{pdfFile.name}</span>
                      <span className="text-zinc-500">({formatBytes(pdfFile.size)})</span>
                    </div>
                  ) : (
                    <div className="text-zinc-500 text-sm">
                      <Upload size={20} className="mx-auto mb-1" />
                      Click to select PDF (max 20 MB)
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowUpload(false)}
                  className="flex-1 py-2 rounded-lg border border-zinc-600 text-zinc-300 text-sm hover:border-zinc-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || !pdfFile || !serviceType.trim()}
                  className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : "Upload to Drive"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-zinc-500">
          <Loader2 size={20} className="animate-spin mr-2" /> Loading PDF library…
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No PDFs uploaded yet</p>
          <p className="text-sm mt-1">Click "Add PDF" to upload your first pricing package.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([svcType, list]) => (
            <div key={svcType} className="bg-zinc-900 border border-zinc-700/60 rounded-xl overflow-hidden">
              {/* Service type header */}
              <div className="flex items-center justify-between px-5 py-3 bg-zinc-800/50 border-b border-zinc-700/40">
                <span className="text-white font-semibold capitalize">{svcType}</span>
                <div className="flex gap-1.5">
                  {tierCoverage(list).map((t) => (
                    <span
                      key={t.value}
                      title={t.label}
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full border",
                        t.present
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-zinc-700/30 text-zinc-500 border-zinc-600/20"
                      )}
                    >
                      {t.present ? "✓" : "○"} {t.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* PDF rows */}
              <div className="divide-y divide-zinc-800">
                {list.map((entry) => (
                  <div key={entry._id} className="flex items-center gap-4 px-5 py-3 hover:bg-zinc-800/30 transition-colors">
                    <FileText size={18} className="text-violet-400 shrink-0" />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{entry.fileName}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {formatBytes(entry.fileSizeBytes)} ·{" "}
                        {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>

                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full border shrink-0",
                      "bg-violet-500/10 text-violet-300 border-violet-500/20"
                    )}>
                      {entry.label}
                    </span>

                    {/* Actions */}
                    <div className="flex gap-2 shrink-0">
                      {entry.driveWebViewLink && (
                        <a
                          href={entry.url || (entry.driveWebViewLink ? `/api/pdf-proxy?url=${encodeURIComponent(entry.driveWebViewLink)}` : "#")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                          title="View on Drive"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(entry._id)}
                        disabled={deleting === entry._id}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                        title="Delete"
                      >
                        {deleting === entry._id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
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