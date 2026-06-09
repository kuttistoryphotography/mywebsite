"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Folder, FolderOpen, FileText, Download, Eye, ArrowLeft,
  Grid, List, Search, CheckCircle2, ImageIcon, FileVideo,
  Loader2, X, ZoomIn, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FileItem {
  id:           string;
  name:         string;
  type:         "image" | "video" | "pdf" | "file";
  size:         string;
  rawSize:      number;
  downloadUrl:  string;   // drive.google.com/uc?export=download&id=…
  viewUrl:      string;   // Cloudinary URL or Drive /view
  previewUrl:   string;   // Cloudinary URL or Drive /preview (iframe-safe)
  driveFileId?:  string;
  publicId?:     string;
  downloadUrl?:  string;
  viewLink?:     string;
  cloudinaryUrl?: string;
  createdAt:    string;
}

interface ClientFolder {
  id:          string;
  name:        string;
  orderNumber: string;
  serviceType: string | null;
  date:        string | null;
  status:      string | null;
  fileCount:   number;
  coverImage:  string | null;
  description: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatBytes = (b?: number | null) => {
  if (!b && b !== 0) return "—";
  if (b === 0) return "0 B";
  const k = 1024, s = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${(b / Math.pow(k, i)).toFixed(1)} ${s[i]}`;
};

const formatDate = (d?: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
};

const getFileType = (mimeType: string): "image" | "video" | "pdf" | "file" => {
  const s = (mimeType || "").toLowerCase();
  if (s.startsWith("image/")) return "image";
  if (s.startsWith("video/")) return "video";
  if (s === "application/pdf") return "pdf";
  return "file";
};

/**
 * Build proper Google Drive URLs from a fileId or existing Drive URL.
 */
const buildDriveUrls = (raw: string, fileId?: string) => {
  // Extract file ID from whatever URL format we have
  let id = fileId || "";
  if (!id) {
    const m = raw.match(/\/d\/([^/?#]+)/) || raw.match(/[?&]id=([^&]+)/);
    if (m) id = m[1];
  }

  if (id) {
    return {
      downloadUrl: rawUrl.includes("res.cloudinary.com")
        ? rawUrl.includes("/raw/upload/")
          ? `/api/pdf-proxy?url=${encodeURIComponent(rawUrl)}&download=1`
          : rawUrl.replace("/upload/", "/upload/fl_attachment/")
        : `https://drive.google.com/uc?export=download&id=${id}`,
      viewUrl: rawUrl.includes("res.cloudinary.com")
        ? rawUrl.includes("/raw/upload/")
          ? `/api/pdf-proxy?url=${encodeURIComponent(rawUrl)}`
          : rawUrl
        : `https://drive.google.com/file/d/${id}/view`,
      previewUrl: rawUrl.includes("res.cloudinary.com")
        ? rawUrl.includes("/raw/upload/")
          ? `/api/pdf-proxy?url=${encodeURIComponent(rawUrl)}`
          : rawUrl
        : `https://drive.google.com/file/d/${id}/preview`,
    };
  }

  // Fallback — just use the raw URL
  return { downloadUrl: raw, viewUrl: raw, previewUrl: raw };
};

const statusLabel = (s: string | null) => {
  if (!s) return "Ready";
  const map: Record<string, string> = { completed: "Ready", confirmed: "Processing", pending: "Processing", deal_closed: "Ready" };
  return map[s] || s.replace(/_/g, " ");
};

const statusClass = (s: string | null) => {
  if (!s || s === "completed" || s === "deal_closed") return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
  if (s === "confirmed" || s === "pending") return "bg-amber-500/10 border-amber-500/20 text-amber-400";
  return "bg-zinc-500/10 border-zinc-500/20 text-zinc-400";
};

// ─── PDF Viewer Modal ─────────────────────────────────────────────────────────
function PdfModal({ file, onClose }: { file: FileItem; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-[500] bg-black/95 flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm text-zinc-300 font-medium truncate max-w-[60%]">{file.name}</p>
        <div className="flex items-center gap-3">
          <a href={file.downloadUrl} download={file.name} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
            onClick={(e) => e.stopPropagation()}>
            <Download className="w-3.5 h-3.5" /> Download PDF
          </a>
          <a href={file.viewUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
            onClick={(e) => e.stopPropagation()}>
            <ExternalLink className="w-3.5 h-3.5" /> Open in Drive
          </a>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
      </div>
      <div className="flex-1 p-4" onClick={(e) => e.stopPropagation()}>
        <iframe
          src={file.previewUrl}
          className="w-full h-full rounded-xl border border-zinc-700"
          allow="autoplay"
          title={file.name}
        />
      </div>
    </div>
  );
}

// ─── Lightbox (images + videos) ───────────────────────────────────────────────
function Lightbox({ files, startIdx, onClose }: { files: FileItem[]; startIdx: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIdx);
  const current = files[idx];
  const prev = () => setIdx((i) => (i - 1 + files.length) % files.length);
  const next = () => setIdx((i) => (i + 1) % files.length);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [idx]);

  return (
    <div className="fixed inset-0 z-[500] bg-black/97 flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm text-zinc-300 font-medium truncate max-w-[60%]">{current?.name}</p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">{idx + 1} / {files.length}</span>
          <a href={current?.downloadUrl} download={current?.name} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
            onClick={(e) => e.stopPropagation()}>
            <Download className="w-3.5 h-3.5" /> Download
          </a>
          <a href={current?.viewUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
            onClick={(e) => e.stopPropagation()}>
            <ExternalLink className="w-3.5 h-3.5" /> Open in Drive
          </a>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative px-16" onClick={(e) => e.stopPropagation()}>
        {current?.type === "video" ? (
          <video key={current.downloadUrl} src={current.downloadUrl} controls autoPlay
            className="max-h-[80vh] max-w-full rounded-xl" />
        ) : (
          /* Images from personal Drive — use /preview embed for reliable display */
          <iframe
            key={current?.previewUrl}
            src={current?.previewUrl}
            className="max-h-[80vh] w-full max-w-4xl rounded-xl border-0"
            style={{ height: "80vh" }}
            allow="autoplay"
            title={current?.name}
          />
        )}
        {files.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors rotate-180">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          </>
        )}
      </div>

      {files.length > 1 && (
        <div className="shrink-0 px-4 pb-3 pt-2 border-t border-white/10 flex gap-2 justify-center overflow-x-auto" onClick={(e) => e.stopPropagation()}>
          {files.map((f, i) => (
            <button key={f.id} onClick={() => setIdx(i)}
              className={cn("w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all",
                i === idx ? "border-amber-500 scale-110" : "border-transparent opacity-40 hover:opacity-70")}>
              {f.type === "image"
                ? <img src={f.downloadUrl} alt="" className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                : <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <FileVideo className="w-4 h-4 text-zinc-400" />
                  </div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FilesSection() {
  const [folders,         setFolders]         = useState<ClientFolder[]>([]);
  const [selectedFolder,  setSelectedFolder]   = useState<ClientFolder | null>(null);
  const [files,           setFiles]           = useState<FileItem[]>([]);
  const [loadingFolders,  setLoadingFolders]   = useState(true);
  const [loadingFiles,    setLoadingFiles]     = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [viewMode,        setViewMode]         = useState<"grid" | "list">("grid");
  const [searchQuery,     setSearchQuery]      = useState("");
  const [selectedFileIds, setSelectedFileIds]  = useState<Set<string>>(new Set());
  const [lightboxIdx,     setLightboxIdx]      = useState<number | null>(null);
  const [pdfFile,         setPdfFile]          = useState<FileItem | null>(null);
  const [downloading,     setDownloading]      = useState(false);

  const filteredFiles = useMemo(() =>
    searchQuery
      ? files.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : files,
    [files, searchQuery]
  );

  const mediaFiles = useMemo(() =>
    filteredFiles.filter((f) => f.type === "image" || f.type === "video"),
    [filteredFiles]
  );

  const toggleSelect = (id: string) => setSelectedFileIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const selectAll = () => {
    if (selectedFileIds.size === files.length) setSelectedFileIds(new Set());
    else setSelectedFileIds(new Set(files.map((f) => f.id)));
  };

  // Fetch folders
  const fetchFolders = useCallback(async () => {
    setLoadingFolders(true);
    setError(null);
    try {
      const res  = await fetch("/api/file-manager/client/folders");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load folders");
      setFolders((data.folders || []).map((f: any) => ({
        id:          String(f.id),
        name:        f.folderName || f.name,
        orderNumber: f.bookingNumber || "—",
        serviceType: f.serviceType || null,
        date:        f.eventDate   || null,
        status:      f.status      || "completed",
        fileCount:   f.fileCount   || 0,
        coverImage:  f.coverImage  || null,
        description: f.description || "",
      })));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingFolders(false);
    }
  }, []);

  // Fetch files for selected folder — map to unified FileItem with Drive URLs
  const fetchFiles = useCallback(async (folderId: string) => {
    setLoadingFiles(true);
    setError(null);
    try {
      const res  = await fetch(`/api/file-manager/client/files?folderId=${folderId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load files");

      setFiles((data.files || []).map((f: any) => {
        const rawUrl   = f.cloudinaryUrl || f.driveUrl || f.filePath || "";
        const fileId   = f.publicId || f.driveFileId || "";
        const urls     = buildDriveUrls(rawUrl, fileId);
        return {
          id:          String(f.id),
          name:        f.fileName || f.originalName,
          type:        getFileType(f.mimeType || f.fileType || ""),
          size:        formatBytes(f.fileSize),
          rawSize:     f.fileSize || 0,
          driveFileId: fileId,
          downloadUrl: urls.downloadUrl,
          viewUrl:     urls.viewUrl,
          previewUrl:  urls.previewUrl,
          createdAt:   f.uploadedAt || f.createdAt,
        };
      }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);
  useEffect(() => {
    if (selectedFolder) fetchFiles(selectedFolder.id);
    else setFiles([]);
  }, [selectedFolder, fetchFiles]);

  // Single file download — triggers browser download via Drive export link
  const downloadFile = async (file: FileItem) => {
    try {
      await fetch("/api/file-manager/client/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id }),
      });
    } catch {}
    const a = document.createElement("a");
    a.href     = file.downloadUrl;
    a.download = file.name;
    a.target   = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Bulk download — opens each file's Drive download URL sequentially
  const downloadSelected = async (ids?: string[]) => {
    if (!selectedFolder) return;
    setDownloading(true);
    try {
      const targets = ids ? files.filter((f) => ids.includes(f.id)) : files;
      if (!targets.length) return;

      for (const file of targets) {
        await fetch("/api/file-manager/client/download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId: file.id }),
        }).catch(() => {});

        const a = document.createElement("a");
        a.href     = file.downloadUrl;
        a.download = file.name;
        a.target   = "_blank";
        document.body.appendChild(a);
        a.click();
        a.remove();
        await new Promise((r) => setTimeout(r, 400));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDownloading(false);
    }
  };

  // ── Folder list ─────────────────────────────────────────────────────────────
  if (!selectedFolder) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div>
          <h1 className="text-2xl font-bold">My Files</h1>
          <p className="text-sm text-zinc-500 mt-1">Access and download your delivered photos, videos, and documents</p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-300 flex items-center justify-between gap-3">
            {error} <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {loadingFolders ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
          </div>
        ) : folders.length === 0 ? (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-14 text-center">
            <Folder className="w-14 h-14 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-zinc-400">No files yet</h3>
            <p className="text-sm text-zinc-500 mt-2 max-w-md mx-auto">
              Your delivered photos and videos will appear here once the studio uploads and shares them with you.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {folders.map((folder) => (
              <button key={folder.id} onClick={() => setSelectedFolder(folder)}
                className="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden text-left transition-all group hover:border-zinc-600 hover:shadow-xl hover:shadow-black/30">
                <div className="relative h-44 bg-zinc-800 overflow-hidden">
                  {folder.coverImage ? (
                    <img src={folder.coverImage} alt={folder.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Folder className="w-16 h-16 text-zinc-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-3 right-3">
                    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border", statusClass(folder.status))}>
                      {statusLabel(folder.status)}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-amber-400" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-white truncate">{folder.name}</h3>
                  {folder.description && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{folder.description}</p>}
                  {folder.serviceType && <p className="text-xs text-zinc-500 mt-0.5">{folder.serviceType}</p>}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800">
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <ImageIcon className="w-4 h-4" />
                      <span className="text-xs">{folder.fileCount} files</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">{folder.orderNumber}</span>
                  </div>
                  {folder.date && <p className="text-[10px] text-zinc-500 mt-1.5">{formatDate(folder.date)}</p>}
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="bg-zinc-900/30 rounded-2xl border border-zinc-800/50 p-5">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-zinc-300">How it works</h4>
              <p className="text-sm text-zinc-500 mt-1 leading-relaxed">
                After your session, our team edits and uploads your photos, videos, and documents here.
                You can preview images and PDFs inline, or download files individually or all at once.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Inside folder ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox
          files={mediaFiles}
          startIdx={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}

      {/* PDF viewer */}
      {pdfFile && <PdfModal file={pdfFile} onClose={() => setPdfFile(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => { setSelectedFolder(null); setSelectedFileIds(new Set()); setSearchQuery(""); }}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{selectedFolder.name}</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {selectedFolder.fileCount} files · {selectedFolder.orderNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedFileIds.size > 0 && (
            <button onClick={() => downloadSelected([...selectedFileIds])} disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-sm font-semibold transition-colors disabled:opacity-60">
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download ({selectedFileIds.size})
            </button>
          )}
          <button onClick={() => downloadSelected()} disabled={downloading || files.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-60">
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download All
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-300 flex items-center justify-between">
          {error} <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 bg-zinc-900/50 rounded-xl border border-zinc-800 p-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={selectAll}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              selectedFileIds.size === files.length && files.length > 0
                ? "bg-amber-500/20 text-amber-400" : "bg-zinc-800 text-zinc-400 hover:text-white")}>
            {selectedFileIds.size === files.length && files.length > 0 ? "Deselect All" : "Select All"}
          </button>
          {selectedFileIds.size > 0 && (
            <span className="text-xs text-zinc-500">{selectedFileIds.size} selected</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files…"
              className="pl-9 pr-4 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 w-44" />
          </div>
          <div className="flex items-center bg-zinc-800 rounded-lg p-1">
            {(["grid", "list"] as const).map((m) => (
              <button key={m} onClick={() => setViewMode(m)}
                className={cn("p-1.5 rounded-md transition-colors",
                  viewMode === m ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white")}>
                {m === "grid" ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Files */}
      {loadingFiles ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-amber-500 animate-spin" /></div>
      ) : filteredFiles.length === 0 ? (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-10 text-center text-zinc-500">
          No files found.
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFiles.map((file) => {
            const mediaIdx = mediaFiles.findIndex((f) => f.id === file.id);
            return (
              <div key={file.id}
                className={cn("group relative bg-zinc-900/50 rounded-xl border overflow-hidden transition-all",
                  selectedFileIds.has(file.id) ? "border-amber-500 ring-2 ring-amber-500/20" : "border-zinc-800 hover:border-zinc-700")}
                onClick={() => toggleSelect(file.id)}>

                {/* Thumbnail */}
                <div className="relative aspect-square bg-zinc-800 flex items-center justify-center">
                  {file.type === "image" ? (
                    /* Use Drive /preview embed for reliable thumbnail display from personal account */
                    <iframe
                      src={file.previewUrl}
                      className="w-full h-full border-0 pointer-events-none"
                      title={file.name}
                      loading="lazy"
                    />
                  ) : file.type === "video" ? (
                    <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center gap-2">
                      <FileVideo className="w-10 h-10 text-zinc-600" />
                      <span className="text-[10px] text-zinc-500">Video</span>
                    </div>
                  ) : file.type === "pdf" ? (
                    <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center gap-2">
                      <FileText className="w-10 h-10 text-red-400/60" />
                      <span className="text-[10px] text-zinc-500">PDF</span>
                    </div>
                  ) : (
                    <FileText className="w-10 h-10 text-zinc-600" />
                  )}

                  {/* Selection checkbox */}
                  <div className={cn("absolute top-2 left-2 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all z-10",
                    selectedFileIds.has(file.id) ? "bg-amber-500 border-amber-500" : "bg-black/50 border-white/30 opacity-0 group-hover:opacity-100")}>
                    {selectedFileIds.has(file.id) && <CheckCircle2 className="w-4 h-4 text-black" />}
                  </div>

                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                    {(file.type === "image" || file.type === "video") && (
                      <button onClick={(e) => { e.stopPropagation(); setLightboxIdx(mediaIdx); }}
                        className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                        <ZoomIn className="w-5 h-5 text-white" />
                      </button>
                    )}
                    {file.type === "pdf" && (
                      <button onClick={(e) => { e.stopPropagation(); setPdfFile(file); }}
                        className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                        <Eye className="w-5 h-5 text-white" />
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); downloadFile(file); }}
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                      <Download className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-xs font-medium truncate">{file.name}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{file.size}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List view */
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-4 py-3 w-10 text-left">
                  <input type="checkbox"
                    checked={selectedFileIds.size === files.length && files.length > 0}
                    onChange={selectAll}
                    className="rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500/50" />
                </th>
                {["Name", "Type", "Size", "Date", "Actions"].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file) => {
                const mediaIdx = mediaFiles.findIndex((f) => f.id === file.id);
                return (
                  <tr key={file.id}
                    className={cn("border-b border-zinc-800/50 transition-colors",
                      selectedFileIds.has(file.id) ? "bg-amber-500/5" : "hover:bg-zinc-800/30")}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedFileIds.has(file.id)}
                        onChange={() => toggleSelect(file.id)}
                        className="rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500/50" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                          {file.type === "image"  ? <ImageIcon className="w-4 h-4 text-blue-400" />
                            : file.type === "video" ? <FileVideo className="w-4 h-4 text-purple-400" />
                            : file.type === "pdf"   ? <FileText className="w-4 h-4 text-red-400" />
                            : <FileText className="w-4 h-4 text-zinc-400" />}
                        </div>
                        <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs capitalize text-zinc-400 bg-zinc-800 px-2 py-1 rounded-full">
                        {file.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400">{file.size}</td>
                    <td className="px-4 py-3 text-sm text-zinc-400">{formatDate(file.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {(file.type === "image" || file.type === "video") && (
                          <button onClick={() => setLightboxIdx(mediaIdx)}
                            className="p-1.5 rounded-lg hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white"
                            title="Preview">
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {file.type === "pdf" && (
                          <button onClick={() => setPdfFile(file)}
                            className="p-1.5 rounded-lg hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white"
                            title="View PDF">
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <a href={file.viewUrl} target="_blank" rel="noreferrer"
                          className="p-1.5 rounded-lg hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white"
                          title="Open in Drive">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button onClick={() => downloadFile(file)}
                          className="p-1.5 rounded-lg hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white"
                          title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
