"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FolderOpen, FileText, ImageIcon, FileVideo, Upload, Plus, Search,
  Grid, List, ExternalLink, Trash2, Users, Share2, X, Check,
  Loader2, Eye, EyeOff, Link2, Link2Off, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FolderItem {
  id: string;
  folderName: string;
  description: string;
  color: string;
  isSharedWithClient: boolean;
  fileCount: number;
  lastUploadedAt: string | null;
  coverImage: string | null;
  createdAt: string;
  assignedClientId: string | null;
  assignedClientName: string | null;
  assignedClientEmail: string | null;
  assignedBookingId: string | null;
  assignedBookingNumber: string | null;
  assignedEventType: string | null;
}

interface FileItem {
  id: string;
  folderId: string | null;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  uploadedAt: string;
  isSharedWithClient: boolean;
  // Drive fields
  driveFileId: string | null;
  driveUrl: string | null;        // legacy — kept for backward compat
  driveWebViewLink: string | null;  // legacy — kept for backward compat
  publicId?: string | null;        // Cloudinary public_id
  cloudinaryUrl?: string | null;   // Cloudinary direct URL
  downloadUrl?: string | null;     // Cloudinary download URL
  viewLink?: string | null;        // resolved view link
  driveFolderName: string | null;
  filePath: string | null;          // resolved best URL
}

interface AssignUser    { id: string; name: string; email: string; }
interface AssignBooking { id: string; userId: string; bookingNumber: string; eventType: string | null; }

const MAX_FILES = 10;

const fmt = {
  bytes: (b?: number | null) => {
    if (!b && b !== 0) return "—";
    if (b === 0) return "0 B";
    const k = 1024, s = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return `${(b / Math.pow(k, i)).toFixed(1)} ${s[i]}`;
  },
  date: (d?: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
  },
};

const fileCategory = (f: FileItem): "image" | "video" | "pdf" | "document" => {
  const s = (f.mimeType || f.fileName || "").toLowerCase();
  if (s.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(s)) return "image";
  if (s.startsWith("video/") || /\.(mp4|mov|avi|mkv|webm)$/i.test(s)) return "video";
  if (s === "application/pdf" || s.endsWith(".pdf")) return "pdf";
  return "document";
};

/** Best URL for previewing a file */
// const previewUrl = (f: FileItem): string => {
//   if (f.viewLink) return f.viewLink;
//   if (f.cloudinaryUrl && !f.cloudinaryUrl.includes("drive.google.com")) {
//     if (f.fileType === "application/pdf" || f.cloudinaryUrl.includes("/raw/upload/")) {
//       return `/api/pdf-proxy?url=${encodeURIComponent(f.cloudinaryUrl)}`;
//     }
//     return f.cloudinaryUrl;
//   }
//   if (f.driveWebViewLink) return f.driveWebViewLink.replace(/\/view(\?.*)?$/, "/preview");
//   return f.filePath || "";
// };

/** Best URL for downloading a file */
const downloadUrl = (f: FileItem): string => {
  if (f.downloadUrl) return f.downloadUrl;
  if (f.cloudinaryUrl) return f.cloudinaryUrl;
  if (f.driveUrl) return f.driveUrl;
  return f.filePath || "";
};

/** Drive view link */
const viewUrl = (f: FileItem): string =>
  f.viewLink || f.cloudinaryUrl || f.driveWebViewLink || f.filePath || "";

// ─── Main component ───────────────────────────────────────────────────────────
export default function FilesSection() {
  const [folders,         setFolders]         = useState<FolderItem[]>([]);
  const [files,           setFiles]           = useState<FileItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [viewMode,        setViewMode]         = useState<"grid" | "list">("grid");
  const [search,          setSearch]           = useState("");
  const [loadingFolders,  setLoadingFolders]   = useState(true);
  const [loadingFiles,    setLoadingFiles]     = useState(false);
  const [uploading,       setUploading]        = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [toast,           setToast]           = useState<string | null>(null);

  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showUpload,       setShowUpload]       = useState(false);
  const [showAssign,       setShowAssign]       = useState(false);

  const [newName,   setNewName]   = useState("");
  const [newDesc,   setNewDesc]   = useState("");
  const [newShared, setNewShared] = useState(false);

  const [uploadQueue,  setUploadQueue]  = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [assignFolderId,    setAssignFolderId]    = useState<string | null>(null);
  const [assignUsers,       setAssignUsers]       = useState<AssignUser[]>([]);
  const [assignBookings,    setAssignBookings]    = useState<AssignBooking[]>([]);
  const [selectedUserId,    setSelectedUserId]    = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [loadingAssign,     setLoadingAssign]     = useState(false);
  const [savingAssign,      setSavingAssign]      = useState(false);

  const selectedFolder = useMemo(
    () => folders.find((f) => f.id === selectedFolderId) ?? null,
    [folders, selectedFolderId]
  );
  const filteredFiles = useMemo(
    () => search ? files.filter((f) => f.fileName.toLowerCase().includes(search.toLowerCase())) : files,
    [files, search]
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchFolders = async () => {
    setLoadingFolders(true);
    setError(null);
    try {
      const res  = await fetch("/api/file-manager/folders");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFolders(data.folders || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingFolders(false);
    }
  };

  const fetchFiles = async (folderId: string) => {
    setLoadingFiles(true);
    setError(null);
    try {
      const res  = await fetch(`/api/file-manager/files?folderId=${folderId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFiles(data.files || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => { fetchFolders(); }, []);
  useEffect(() => {
    if (selectedFolderId) fetchFiles(selectedFolderId);
    else setFiles([]);
  }, [selectedFolderId]);

  // ── Create folder ─────────────────────────────────────────────────────────
  const handleCreateFolder = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch("/api/file-manager/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), description: newDesc, isSharedWithClient: newShared }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setShowCreateFolder(false);
      setNewName(""); setNewDesc(""); setNewShared(false);
      await fetchFolders();
      showToast("Folder created");
    } catch (e: any) {
      setError(e.message);
    }
  };

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!uploadQueue.length || !selectedFolderId) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      uploadQueue.forEach((f) => fd.append("files", f));
      fd.append("folderId", selectedFolderId);

      const res  = await fetch("/api/file-manager/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowUpload(false);
      setUploadQueue([]);
      await fetchFiles(selectedFolderId);
      await fetchFolders();
      showToast(`${data.uploadedCount || uploadQueue.length} file(s) uploaded to Cloudinary`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  // ── Delete file ───────────────────────────────────────────────────────────
  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Delete this file permanently?")) return;
    try {
      const res = await fetch(`/api/file-manager/files?id=${fileId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      if (selectedFolderId) await fetchFolders();
      showToast("File deleted");
    } catch (e: any) {
      setError(e.message);
    }
  };

  // ── Delete folder ─────────────────────────────────────────────────────────
  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm("Delete this folder and all its files permanently?")) return;
    try {
      const res = await fetch(`/api/file-manager/folders?id=${folderId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      if (selectedFolderId === folderId) { setSelectedFolderId(null); setFiles([]); }
      await fetchFolders();
      showToast("Folder deleted");
    } catch (e: any) {
      setError(e.message);
    }
  };

  // ── Toggle sharing ────────────────────────────────────────────────────────
  const handleToggleSharing = async (folder: FolderItem) => {
    try {
      const res = await fetch("/api/file-manager/folders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: folder.id, isSharedWithClient: !folder.isSharedWithClient }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await fetchFolders();
      showToast(folder.isSharedWithClient ? "Folder hidden from client" : "Folder shared with client");
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleToggleFileSharing = async (file: FileItem) => {
    try {
      const res = await fetch("/api/file-manager/files", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: file.id, isSharedWithClient: !file.isSharedWithClient }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setFiles((prev) => prev.map((f) => f.id === file.id ? { ...f, isSharedWithClient: !f.isSharedWithClient } : f));
    } catch (e: any) {
      setError(e.message);
    }
  };

  // ── Assign modal ──────────────────────────────────────────────────────────
  const openAssignModal = async (folderId: string) => {
    setAssignFolderId(folderId);
    setShowAssign(true);
    setLoadingAssign(true);
    try {
      const [uRes, bRes] = await Promise.all([
        fetch("/api/file-manager/assignments?type=users"),
        fetch("/api/file-manager/assignments?type=bookings"),
      ]);
      const [uData, bData] = await Promise.all([uRes.json(), bRes.json()]);
      setAssignUsers(uData.users || []);
      setAssignBookings(bData.bookings || []);
      const folder = folders.find((f) => f.id === folderId);
      setSelectedUserId(folder?.assignedClientId || "");
      setSelectedBookingId(folder?.assignedBookingId || "");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingAssign(false);
    }
  };

  const handleAssign = async () => {
    if (!assignFolderId) return;
    setSavingAssign(true);
    try {
      const res = await fetch("/api/file-manager/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId:  assignFolderId,
          clientId:  selectedUserId  || null,
          bookingId: selectedBookingId || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setShowAssign(false);
      await fetchFolders();
      showToast("Folder assigned");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingAssign(false);
    }
  };

  const handleClearAssignment = async (folderId: string) => {
    try {
      const res = await fetch("/api/file-manager/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId, clientId: null, bookingId: null }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await fetchFolders();
      showToast("Assignment cleared");
    } catch (e: any) {
      setError(e.message);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-zinc-700 text-white text-sm px-4 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">File Manager</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            All files stored on Cloudinary
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCreateFolder(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-xl text-sm font-semibold hover:bg-amber-400 transition-colors">
            <Plus className="w-4 h-4" /> New Folder
          </button>
          {selectedFolderId && (
            <button onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm hover:bg-zinc-700 transition-colors">
              <Upload className="w-4 h-4" /> Upload to Drive
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-300 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Create Folder panel */}
      {showCreateFolder && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold">Create New Folder</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="Folder name *"
              className="px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
            <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
              className="px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={newShared} onChange={(e) => setNewShared(e.target.checked)}
              className="rounded border-zinc-600 bg-zinc-800 text-amber-500" />
            <span className="text-sm text-zinc-400">Share with client immediately</span>
          </label>
          <div className="flex gap-2">
            <button onClick={handleCreateFolder} disabled={!newName.trim()}
              className="px-5 py-2 bg-amber-500 text-black rounded-xl text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition-colors">
              Create Folder
            </button>
            <button onClick={() => { setShowCreateFolder(false); setNewName(""); setNewDesc(""); }}
              className="px-5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm hover:bg-zinc-700 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Upload panel */}
      {showUpload && selectedFolderId && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold">Upload Files</h3>
          <p className="text-xs text-zinc-500">
            Files are uploaded to Cloudinary › <span className="text-zinc-300">{selectedFolder?.folderName}</span>.
            Up to {MAX_FILES} files, 50 MB each.
          </p>
          <input ref={fileInputRef} type="file" multiple className="hidden"
            onChange={(e) => setUploadQueue(Array.from(e.target.files || []).slice(0, MAX_FILES))} />
          <button onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-3 w-full border-2 border-dashed border-zinc-700 rounded-xl text-zinc-400 hover:border-amber-500 hover:text-white transition-colors justify-center text-sm">
            <Upload className="w-4 h-4" /> Click to select files
          </button>

          {uploadQueue.length > 0 && (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {uploadQueue.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-zinc-800 px-3 py-2 rounded-lg">
                  <span className="truncate text-zinc-300">{f.name}</span>
                  <span className="text-zinc-500 shrink-0 ml-2">{fmt.bytes(f.size)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={handleUpload} disabled={uploading || !uploadQueue.length}
              className="flex items-center gap-2 px-5 py-2 bg-amber-500 text-black rounded-xl text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition-colors">
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading to Drive…</> : "Upload"}
            </button>
            <button onClick={() => { setShowUpload(false); setUploadQueue([]); }}
              className="px-5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm hover:bg-zinc-700 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssign && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Assign Folder to Client</h3>
              <button onClick={() => setShowAssign(false)}><X className="w-5 h-5 text-zinc-400 hover:text-white" /></button>
            </div>
            {loadingAssign ? (
              <div className="flex items-center gap-2 text-zinc-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading clients…</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-2 uppercase tracking-wider">Select Client</label>
                  <select value={selectedUserId} onChange={(e) => { setSelectedUserId(e.target.value); setSelectedBookingId(""); }}
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50">
                    <option value="">— No client —</option>
                    {assignUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
                {selectedUserId && (
                  <div>
                    <label className="block text-xs text-zinc-500 mb-2 uppercase tracking-wider">Link to Booking (optional)</label>
                    <select value={selectedBookingId} onChange={(e) => setSelectedBookingId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50">
                      <option value="">— No booking —</option>
                      {assignBookings.filter((b) => b.userId === selectedUserId).map((b) => (
                        <option key={b.id} value={b.id}>{b.bookingNumber}{b.eventType ? ` — ${b.eventType}` : ""}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={handleAssign} disabled={savingAssign}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 text-black rounded-xl text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition-colors">
                {savingAssign ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save Assignment
              </button>
              <button onClick={() => setShowAssign(false)}
                className="flex-1 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm hover:bg-zinc-700 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main split layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Folder list */}
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold">Folders</h3>
            <span className="text-xs text-zinc-500">{folders.length}</span>
          </div>
          {loadingFolders ? (
            <div className="flex items-center gap-2 text-zinc-500 text-sm py-4"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
          ) : folders.length === 0 ? (
            <p className="text-sm text-zinc-500 py-4">No folders yet. Create one above.</p>
          ) : (
            <div className="space-y-2">
              {folders.map((folder) => (
                <div key={folder.id}
                  className={cn("rounded-xl border transition-all",
                    selectedFolderId === folder.id ? "border-amber-500/50 bg-amber-500/5" : "border-zinc-800 hover:border-zinc-700")}>
                  <button onClick={() => setSelectedFolderId(folder.id === selectedFolderId ? null : folder.id)}
                    className="w-full text-left p-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0">
                        <FolderOpen className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{folder.folderName}</p>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                          <span>{folder.fileCount} files</span>
                          {folder.lastUploadedAt && <span>· {fmt.date(folder.lastUploadedAt)}</span>}
                          {folder.isSharedWithClient && (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <Share2 className="w-3 h-3" /> Shared
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {folder.assignedClientName && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-blue-400 pl-11">
                        <Users className="w-3 h-3" />
                        {folder.assignedClientName}
                        {folder.assignedBookingNumber && <span className="text-zinc-500">· {folder.assignedBookingNumber}</span>}
                      </div>
                    )}
                  </button>
                  <div className="flex flex-wrap gap-1.5 px-3 pb-3">
                    <button onClick={() => openAssignModal(folder.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white text-[11px] hover:bg-zinc-700 transition-colors">
                      <Users className="w-3 h-3" /> Assign
                    </button>
                    <button onClick={() => handleToggleSharing(folder)}
                      className={cn("flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] transition-colors",
                        folder.isSharedWithClient
                          ? "bg-emerald-500/10 text-emerald-400 hover:bg-red-500/10 hover:text-red-400"
                          : "bg-zinc-800 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10")}>
                      {folder.isSharedWithClient ? <><EyeOff className="w-3 h-3" /> Unshare</> : <><Eye className="w-3 h-3" /> Share</>}
                    </button>
                    {folder.assignedClientId && (
                      <button onClick={() => handleClearAssignment(folder.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-500 hover:text-red-400 text-[11px] hover:bg-red-500/10 transition-colors">
                        <Link2Off className="w-3 h-3" /> Clear
                      </button>
                    )}
                    <button onClick={() => handleDeleteFolder(folder.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-500 hover:text-red-400 text-[11px] hover:bg-red-500/10 transition-colors">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Files panel */}
        <div className="xl:col-span-2 bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div>
              <h3 className="font-semibold">Files</h3>
              <p className="text-xs text-zinc-500">
                {selectedFolder
                  ? `${selectedFolder.folderName} · ${filteredFiles.length} file(s)`
                  : "Select a folder to view files"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search files…"
                  className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 w-44" />
              </div>
              <div className="flex items-center gap-1">
                {(["grid", "list"] as const).map((m) => (
                  <button key={m} onClick={() => setViewMode(m)}
                    className={cn("p-2 rounded-lg transition-colors", viewMode === m ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white")}>
                    {m === "grid" ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {!selectedFolder ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-600 border border-dashed border-zinc-800 rounded-2xl">
              <FolderOpen className="w-12 h-12 mb-3" />
              <p className="text-sm">Select a folder to view its files</p>
            </div>
          ) : loadingFiles ? (
            <div className="flex items-center justify-center py-20 text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-600 border border-dashed border-zinc-800 rounded-2xl">
              <FileText className="w-10 h-10 mb-3" />
              <p className="text-sm">No files in this folder yet</p>
              <button onClick={() => setShowUpload(true)} className="mt-3 text-amber-400 text-sm hover:text-amber-300">
                Upload Files →
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredFiles.map((file) => {
                const cat = fileCategory(file);
                return (
                  <div key={file.id} className="bg-zinc-900/70 rounded-2xl border border-zinc-800 overflow-hidden group">
                    <div className="relative h-32 bg-zinc-800 flex items-center justify-center">
                      {cat === "image" ? (
                        <img
                          src={(() => {
                            const url = file.cloudinaryUrl || file.filePath || "";
                            if (url.includes("res.cloudinary.com")) {
                              return url.replace("/upload/", "/upload/c_fill,w_400,h_300,q_auto,f_auto/");
                            }
                            const id = url.match(/\/d\/([^/?#]+)/)?.[1];
                            return id ? `https://lh3.googleusercontent.com/d/${id}=w400` : url;
                          })()}
                          alt={file.fileName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : cat === "video" ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FileVideo className="w-10 h-10 text-zinc-600" />
                        </div>
                      ) : cat === "pdf" ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FileText className="w-10 h-10 text-red-400/60" />
                        </div>
                      ) : (
                        <FileText className="w-10 h-10 text-zinc-600" />
                      )}

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                        <a href={viewUrl(file)} target="_blank" rel="noreferrer"
                          className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors" title="Open file">
                          <ExternalLink className="w-4 h-4 text-white" />
                        </a>
                        <a href={downloadUrl(file)} download={file.fileName} target="_blank" rel="noreferrer"
                          className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors" title="Download">
                          <Download className="w-4 h-4 text-white" />
                        </a>
                        <button onClick={() => handleDeleteFile(file.id)}
                          className="p-2 rounded-lg bg-red-500/30 hover:bg-red-500/50 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4 text-red-300" />
                        </button>
                      </div>

                      {/* Share toggle */}
                      <button onClick={() => handleToggleFileSharing(file)}
                        className={cn("absolute top-2 right-2 p-1 rounded-md z-10 transition-colors",
                          file.isSharedWithClient ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800/80 text-zinc-500 hover:text-emerald-400")}
                        title={file.isSharedWithClient ? "Shared — click to unshare" : "Private — click to share"}>
                        {file.isSharedWithClient ? <Link2 className="w-3.5 h-3.5" /> : <Link2Off className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="p-3">
                      <p className="text-xs font-medium truncate">{file.fileName}</p>
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1">
                        <span>{fmt.bytes(file.fileSize)}</span>
                        <span className="text-zinc-600">{file.driveFolderName || "Cloudinary"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List view */
            <div className="overflow-x-auto rounded-2xl border border-zinc-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Size</th>
                    <th className="text-left px-4 py-3">Folder</th>
                    <th className="text-left px-4 py-3">Uploaded</th>
                    <th className="text-left px-4 py-3">Shared</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {filteredFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {fileCategory(file) === "image" ? <ImageIcon className="w-4 h-4 text-blue-400 shrink-0" />
                            : fileCategory(file) === "video" ? <FileVideo className="w-4 h-4 text-purple-400 shrink-0" />
                            : <FileText className="w-4 h-4 text-zinc-500 shrink-0" />}
                          <span className="truncate max-w-[180px]">{file.fileName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{fmt.bytes(file.fileSize)}</td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">{file.driveFolderName || "Cloudinary"}</td>
                      <td className="px-4 py-3 text-zinc-500">{fmt.date(file.uploadedAt)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleToggleFileSharing(file)}
                          className={cn("flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors",
                            file.isSharedWithClient
                              ? "bg-emerald-500/10 text-emerald-400 hover:bg-red-500/10 hover:text-red-400"
                              : "bg-zinc-800 text-zinc-500 hover:bg-emerald-500/10 hover:text-emerald-400")}>
                          {file.isSharedWithClient ? <><Check className="w-3 h-3" /> Shared</> : "Private"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <a href={viewUrl(file)} target="_blank" rel="noreferrer"
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors" title="Open file">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <a href={downloadUrl(file)} download={file.fileName} target="_blank" rel="noreferrer"
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors" title="Download">
                            <Download className="w-4 h-4" />
                          </a>
                          <button onClick={() => handleDeleteFile(file.id)}
                            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
