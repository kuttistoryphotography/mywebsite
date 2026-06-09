"use client";

import { useRef, useState, useEffect } from "react";
import {
  FileText, Clock, CheckCircle2, XCircle, Eye, ChevronRight, RefreshCw,
  Send, MessageSquare, AlertCircle, Calendar, User, Package, Search,
  Filter, DollarSign, Edit3, ChevronDown, Mail, Phone, MapPin, X,
  Upload, Loader2, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadUrl as cloudinaryDownloadUrl, previewUrl as cloudinaryPreviewUrl } from "@/lib/drive-url";

type QuoteStatus =
  | "quote_requested" | "quote_reviewed" | "requoted"
  | "reviewing" | "deal_closed" | "order_denied";

interface ClientInfo { name: string; email: string; phone: string; location: string; }

interface QuoteRequest {
  id: string;
  requestNumber: string;
  title: string;
  category: string;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
  eventDate?: string;
  estimatedAmount?: number;
  clientNotes?: string;
  adminNotes?: string;
  client: ClientInfo;
  serviceType: string;
  duration?: string;
  venue?: string;
  requoteReason?: string;
  requoteCount?: number;
  lastAction?: string;
  actionTakenAt?: string;
  pdfUrl?: string | null;
}

const timelineSteps: { status: QuoteStatus; label: string; description: string }[] = [
  { status: "quote_requested", label: "Quote Requested",  description: "Client submitted request"  },
  { status: "quote_reviewed",  label: "Quote Reviewed",   description: "Quote prepared and sent"   },
  { status: "requoted",        label: "Requoted",         description: "Revised quote sent"         },
  { status: "reviewing",       label: "Reviewing",        description: "Client reviewing quote"     },
  { status: "deal_closed",     label: "Deal Closed",      description: "Booking confirmed"          },
];

const getStatusIndex = (s: QuoteStatus) =>
  s === "order_denied" ? -1 : timelineSteps.findIndex((t) => t.status === s);

const getStatusColor = (s: QuoteStatus) => ({
  quote_requested: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  quote_reviewed:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  requoted:        "bg-purple-500/10 text-purple-400 border-purple-500/20",
  reviewing:       "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  deal_closed:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  order_denied:    "bg-red-500/10 text-red-400 border-red-500/20",
}[s] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20");

const getStatusLabel = (s: QuoteStatus) => ({
  quote_requested: "Quote Requested",
  quote_reviewed:  "Quote Reviewed",
  requoted:        "Requoted",
  reviewing:       "Reviewing",
  deal_closed:     "Deal Closed",
  order_denied:    "Order Denied",
}[s] || s);

const getCategoryIcon = (c: string) =>
  c === "Product Photography" ? Package : c === "Ad Shoot" ? Edit3 : FileText;

const nextStatusMap: Record<QuoteStatus, QuoteStatus | null> = {
  quote_requested: "quote_reviewed",
  quote_reviewed:  "requoted",
  requoted:        "reviewing",
  reviewing:       "deal_closed",
  deal_closed:     null,
  order_denied:    null,
};

async function uploadPdf(file: File): Promise<{ url: string; downloadUrl: string }> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("context", "quote");

  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json();

  if (!data.success || !data.url) {
    throw new Error(data.error || "Upload failed");
  }

  // Store the stable secure_url in DB; derive downloadUrl client-side
  return {
    url:         data.url,          // permanent — save this in DB
    downloadUrl: data.downloadUrl ?? data.url,
  };
}

export default function QuotesSection() {
  const [quotes, setQuotes]               = useState<QuoteRequest[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [filter, setFilter]               = useState<"all" | QuoteStatus>("all");
  const [searchQuery, setSearchQuery]     = useState("");
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteFormData, setQuoteFormData] = useState({ amount: "", notes: "" });
  const [pdfFile, setPdfFile]             = useState<File | null>(null);
  // pdfStableUrl = permanent secure_url stored in DB
  const [pdfStableUrl, setPdfStableUrl]   = useState("");
  // pdfPreviewUrl = fl_attachment version used for browser download
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [uploadingPdf, setUploadingPdf]   = useState(false);
  const [sendingQuote, setSendingQuote]   = useState(false);
  const pdfFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/quotes");
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          setQuotes(Array.isArray(data.quotes) ? data.quotes : []);
        } else setQuotes([]);
      } catch { setQuotes([]); }
    })();
    return () => { mounted = false; };
  }, []);

  const filteredQuotes = quotes.filter((q) => {
    const matchFilter = filter === "all" || q.status === filter;
    const s = searchQuery.toLowerCase();
    const matchSearch = !s || q.title.toLowerCase().includes(s)
      || q.requestNumber.toLowerCase().includes(s)
      || (q.client?.name || "").toLowerCase().includes(s);
    return matchFilter && matchSearch;
  });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const handleUpdateStatus = async (quoteId: string, newStatus: QuoteStatus) => {
    try {
      const res = await fetch("/api/quotes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: quoteId, status: newStatus }),
      });
      if (res.ok) {
        setQuotes((prev) => prev.map((q) => q.id === quoteId ? { ...q, status: newStatus, updatedAt: new Date().toISOString() } : q));

        // ── Auto-create booking when deal is closed ──────────────────────────
        if (newStatus === "deal_closed") {
          try {
            const bookingRes = await fetch("/api/bookings/from-quote", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ quoteId }),
            });
            if (bookingRes.ok) {
              const bookingData = await bookingRes.json();
              console.log("[Quotes] Booking auto-created:", bookingData.bookingNumber);
            } else {
              const errData = await bookingRes.json().catch(() => ({}));
              console.error("[Quotes] Auto-booking failed:", errData.error);
            }
          } catch (bookingErr) {
            console.error("[Quotes] Auto-booking error:", bookingErr);
          }
        }

        setSelectedQuote(null);
      }
    } catch (err) { console.error(err); }
  };

  const clearPdf = () => { setPdfFile(null); setPdfStableUrl(""); setPdfPreviewUrl(""); };

  const handlePdfFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.includes("pdf")) { alert("Please select a PDF file"); return; }
    if (file.size > 20 * 1024 * 1024) { alert("PDF must be under 20MB"); return; }
    setUploadingPdf(true);
    setPdfFile(file);
    try {
      const result = await uploadPdf(file);
      setPdfStableUrl(result.url);           // permanent — saved to DB
      setPdfPreviewUrl(result.downloadUrl);  // fl_attachment — for browser download
    } catch (err: any) {
      alert("PDF upload failed: " + err.message);
      setPdfFile(null);
      setPdfStableUrl("");
      setPdfPreviewUrl("");
    } finally { setUploadingPdf(false); }
  };

  const handleSendQuote = async (quoteId: string) => {
    if (!quoteFormData.amount) return;
    setSendingQuote(true);
    try {
      // Always save the stable URL to DB (not the fl_attachment version)
      const finalPdfUrl = pdfStableUrl || undefined;
      const res = await fetch("/api/quotes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id:           quoteId,
          quoted_price: Number(quoteFormData.amount),
          admin_notes:  quoteFormData.notes,
          status:       "quoted",
          pdf_url:      finalPdfUrl,
        }),
      });
      if (res.ok) {
        const newStatus: QuoteStatus =
          selectedQuote?.status === "quote_requested" ? "quote_reviewed" : "requoted";
        setQuotes((prev) =>
          prev.map((q) => q.id === quoteId ? {
            ...q,
            status: newStatus,
            estimatedAmount: Number(quoteFormData.amount),
            adminNotes: quoteFormData.notes,
            pdfUrl: finalPdfUrl || q.pdfUrl,
            updatedAt: new Date().toISOString(),
          } : q)
        );
        setShowQuoteModal(false);
        setQuoteFormData({ amount: "", notes: "" });
        clearPdf();
      }
    } catch (err) { console.error(err); }
    finally { setSendingQuote(false); }
  };

  // ── Auto-confirm booking when admin marks deal as closed from detail panel ──
  const handleConfirmDeal = async (quoteId: string) => {
    try {
      // 1. Update quote status to deal_closed
      const res = await fetch("/api/quotes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: quoteId, status: "deal_closed" }),
      });
      if (!res.ok) return;

      setQuotes((prev) => prev.map((q) =>
        q.id === quoteId ? { ...q, status: "deal_closed" as QuoteStatus, updatedAt: new Date().toISOString() } : q
      ));

      // 2. Auto-create booking
      const bookingRes = await fetch("/api/bookings/from-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId }),
      });
      if (bookingRes.ok) {
        const bd = await bookingRes.json();
        alert(`✅ Booking confirmed! Booking number: ${bd.bookingNumber}`);
      }
      setSelectedQuote(null);
    } catch (err) { console.error(err); }
  };

  const handleDenyOrder = async (quoteId: string, reason: string) => {
    try {
      const res = await fetch("/api/quotes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: quoteId, status: "declined", admin_notes: reason }),
      });
      if (res.ok) {
        setQuotes((prev) => prev.map((q) => q.id === quoteId ? { ...q, status: "order_denied" as QuoteStatus, adminNotes: reason, updatedAt: new Date().toISOString() } : q));
        setSelectedQuote(null);
      }
    } catch { }
  };

  const handleDelete = async (quoteId: string) => {
    if (!confirm("Delete this quote? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/quotes?id=${encodeURIComponent(quoteId)}`, { method: "DELETE" });
      if (res.ok) { setQuotes((prev) => prev.filter((q) => q.id !== quoteId)); setSelectedQuote(null); }
    } catch { }
  };

  const pendingCount     = quotes.filter((q) => q.status === "quote_requested").length;
  const reviewingCount   = quotes.filter((q) => ["quote_reviewed","requoted","reviewing"].includes(q.status)).length;
  const requoteCount     = quotes.filter((q) => q.lastAction === "requote_requested").length;
  const acceptedCount    = quotes.filter((q) => q.lastAction === "accepted" || q.status === "deal_closed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quote Management</h1>
          <p className="text-sm text-zinc-500 mt-1">Review and respond to client quote requests</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { count: pendingCount,   color: "blue",    icon: AlertCircle, label: "Pending",  pulse: false },
            { count: requoteCount,   color: "purple",  icon: RefreshCw,   label: "Requote Requests", pulse: true },
            { count: reviewingCount, color: "amber",   icon: Clock,       label: "In Progress", pulse: false },
            { count: acceptedCount,  color: "emerald", icon: CheckCircle2,label: "Accepted", pulse: false },
          ].filter(({ label }) => label !== "Requote Requests" || requoteCount > 0).map(({ count, color, icon: Icon, label, pulse }) => (
            <div key={label} className={cn(`flex items-center gap-2 px-3 py-2 bg-${color}-500/10 border border-${color}-500/20 rounded-xl`, pulse && "animate-pulse")}>
              <Icon className={`w-4 h-4 text-${color}-400`} />
              <span className={`text-sm font-medium text-${color}-400`}>{count} {label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input type="text" placeholder="Search by name, request number, or title..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500" />
          <select value={filter} onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50">
            <option value="all">All Quotes ({quotes.length})</option>
            {(["quote_requested","quote_reviewed","requoted","reviewing","deal_closed","order_denied"] as QuoteStatus[]).map((s) => (
              <option key={s} value={s}>{getStatusLabel(s)} ({quotes.filter((q) => q.status === s).length})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Quotes",    value: quotes.length, color: "white" },
          { label: "Conversion Rate", value: `${quotes.length > 0 ? Math.round((quotes.filter((q) => q.status === "deal_closed").length / quotes.length) * 100) : 0}%`, color: "emerald" },
          { label: "Total Value",     value: `₹${quotes.reduce((acc, q) => acc + (Number(q.estimatedAmount) || 0), 0).toLocaleString("en-IN")}`, color: "white" },
          { label: "Avg Response",    value: "2.4 days", color: "white" },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color === "emerald" ? "text-emerald-400" : ""}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Quotes List */}
      <div className="space-y-4">
        {filteredQuotes.length === 0 ? (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-12 text-center">
            <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-zinc-400">No quotes found</h3>
            <p className="text-sm text-zinc-500 mt-1">{searchQuery ? "Try adjusting your search" : "No quote requests yet"}</p>
          </div>
        ) : (
          filteredQuotes.map((quote) => {
            const CategoryIcon = getCategoryIcon(quote.category);
            const isExpanded = selectedQuote?.id === quote.id;

            return (
              <div key={quote.id} className={cn("bg-zinc-900/50 rounded-2xl border overflow-hidden transition-all", isExpanded ? "border-amber-500/30" : "border-zinc-800 hover:border-zinc-700")}>
                {/* Quote Row */}
                <div className="p-6 cursor-pointer" onClick={() => setSelectedQuote(isExpanded ? null : quote)}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-zinc-800 rounded-xl"><CategoryIcon className="w-5 h-5 text-amber-500" /></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-white">{quote.title}</h3>
                          <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border", getStatusColor(quote.status))}>
                            {getStatusLabel(quote.status)}
                          </span>
                          {quote.status === "quote_requested" && <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-full animate-pulse">NEW</span>}
                          {quote.lastAction === "requote_requested" && <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] font-bold rounded-full animate-pulse">REQUOTE REQUEST</span>}
                          {quote.lastAction === "accepted" && <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full">✓ ACCEPTED</span>}
                          {quote.pdfUrl && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded-full flex items-center gap-1"><FileText className="w-2.5 h-2.5" />PDF</span>}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500 flex-wrap">
                          <span className="font-mono">{quote.requestNumber}</span>
                          <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{quote.client?.name || quote.client?.email || "Unknown"}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDate(quote.createdAt)}</span>
                          {quote.eventDate && <span className="flex items-center gap-1 text-amber-500"><Calendar className="w-3.5 h-3.5" />Event: {formatDate(quote.eventDate)}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {quote.estimatedAmount && (
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Quote Amount</p>
                          <p className="text-lg font-bold text-white">₹{Number(quote.estimatedAmount).toLocaleString("en-IN")}</p>
                        </div>
                      )}
                      <ChevronDown className={cn("w-5 h-5 text-zinc-500 transition-transform", isExpanded && "rotate-180")} />
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left: Client & Service */}
                      <div className="space-y-4">
                        <div className="p-4 bg-zinc-800/50 rounded-xl">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">Client Information</h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3"><User className="w-4 h-4 text-zinc-500" /><span className="text-sm text-white">{quote.client?.name || "Unknown"}</span></div>
                            <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-zinc-500" /><a href={`mailto:${quote.client?.email}`} className="text-sm text-amber-400 hover:underline">{quote.client?.email || "—"}</a></div>
                            <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-zinc-500" /><a href={`tel:${quote.client?.phone}`} className="text-sm text-amber-400 hover:underline">{quote.client?.phone || "—"}</a></div>
                            <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-zinc-500" /><span className="text-sm text-zinc-300">{quote.client?.location || "—"}</span></div>
                          </div>
                        </div>
                        <div className="p-4 bg-zinc-800/50 rounded-xl">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">Service Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-zinc-500">Service</span><span>{quote.serviceType}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-500">Category</span><span>{quote.category}</span></div>
                            {quote.duration && <div className="flex justify-between"><span className="text-zinc-500">Duration</span><span>{quote.duration}</span></div>}
                            {quote.venue && <div className="flex justify-between"><span className="text-zinc-500">Venue</span><span className="text-right">{quote.venue}</span></div>}
                          </div>
                        </div>
                        {/* PDF Preview / Download (for existing PDF) */}
                        {quote.pdfUrl && (
                          <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3">Quote PDF</h4>
                            <div className="flex gap-3">
                              {/* Preview — opens PDF in Google Docs Viewer (works for Cloudinary raw URLs) */}
                              <a
                                href={cloudinaryPreviewUrl(quote.pdfUrl!)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-colors"
                              >
                                <Eye className="w-4 h-4" /> Preview
                              </a>
                              {/* Download — fl_attachment forces browser save-dialog; no cross-origin `download` attr needed */}
                              <a
                                href={cloudinaryDownloadUrl(quote.pdfUrl!, `quote-${quote.requestNumber}.pdf`)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors"
                              >
                                <Download className="w-4 h-4" /> Download
                              </a>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Centre: Timeline */}
                      <div className="p-4 bg-zinc-800/30 rounded-xl">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">Status Timeline</h4>
                        {quote.status === "order_denied" ? (
                          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <XCircle className="w-6 h-6 text-red-400" />
                            <div><p className="font-semibold text-red-400">Order Denied</p><p className="text-sm text-zinc-500">{quote.adminNotes || "This order was denied"}</p></div>
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-zinc-700" />
                            <div className="space-y-4">
                              {timelineSteps.map((step, index) => {
                                const currentIndex = getStatusIndex(quote.status);
                                const isCompleted = index <= currentIndex;
                                const isCurrent   = index === currentIndex;
                                return (
                                  <div key={step.status} className="flex items-start gap-3">
                                    <div className={cn("relative z-10 w-8 h-8 rounded-full flex items-center justify-center",
                                      isCompleted ? isCurrent ? "bg-amber-500 text-black" : "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-500")}>
                                      {isCompleted && !isCurrent ? <CheckCircle2 className="w-4 h-4" /> : isCurrent ? <RefreshCw className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 pt-1">
                                      <p className={cn("text-sm font-medium", isCompleted ? "text-white" : "text-zinc-500")}>{step.label}</p>
                                      <p className="text-xs text-zinc-500">{step.description}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Notes & Actions */}
                      <div className="space-y-4">
                        {quote.lastAction === "requote_requested" && quote.requoteReason && (
                          <div className="p-4 bg-purple-500/10 border-2 border-purple-500/30 rounded-xl animate-pulse">
                            <div className="flex items-center gap-2 mb-2"><RefreshCw className="w-5 h-5 text-purple-400" /><h5 className="text-sm font-bold text-purple-400">🔄 Client Requested Requote</h5></div>
                            <div className="bg-purple-500/5 p-3 rounded-lg mt-2"><p className="text-xs text-purple-300 mb-1 font-semibold">Client's Reason:</p><p className="text-sm text-white">{quote.requoteReason}</p></div>
                            {(quote.requoteCount || 0) > 1 && <p className="text-xs text-purple-400 mt-2">⚠️ Requoted {quote.requoteCount} times</p>}
                          </div>
                        )}

                        {quote.lastAction === "accepted" && (
                          <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-xl">
                            <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-5 h-5 text-emerald-400" /><h5 className="text-sm font-bold text-emerald-400">✅ Client Accepted Quote!</h5></div>
                            <p className="text-sm text-emerald-300 mt-2">A booking has been created automatically.</p>
                            <button onClick={() => (window.location.href = "/admin?tab=bookings")} className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">View Bookings <ChevronRight className="w-3 h-3" /></button>
                          </div>
                        )}

                        {quote.clientNotes && (
                          <div className="p-4 bg-zinc-800/50 rounded-xl">
                            <div className="flex items-center gap-2 mb-2"><MessageSquare className="w-4 h-4 text-zinc-400" /><h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Client Notes</h5></div>
                            <p className="text-sm text-zinc-300">{quote.clientNotes}</p>
                          </div>
                        )}
                        {quote.adminNotes && (
                          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                            <div className="flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4 text-amber-400" /><h5 className="text-xs font-bold uppercase tracking-wider text-amber-400">Your Response</h5></div>
                            <p className="text-sm text-zinc-300">{quote.adminNotes}</p>
                          </div>
                        )}

                        {quote.status !== "deal_closed" && quote.status !== "order_denied" && (
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Quick Actions</h4>
                            <button
                              onClick={() => {
                                setQuoteFormData({ amount: quote.estimatedAmount?.toString() || "", notes: quote.adminNotes || "" });
                                // Pre-populate existing PDF stable URL so admin can keep or replace
                                setPdfStableUrl(quote.pdfUrl || "");
                                setPdfPreviewUrl(quote.pdfUrl ? cloudinaryDownloadUrl(quote.pdfUrl) : "");
                                setPdfFile(null);
                                setShowQuoteModal(true);
                              }}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-medium transition-colors"
                            >
                              <Send className="w-4 h-4" />
                              {quote.status === "quote_requested" ? "Send Quote" : "Send Revised Quote"}
                            </button>
                            {nextStatusMap[quote.status] && quote.status !== "quote_requested" && (
                              <button
                                onClick={() => {
                                  const next = nextStatusMap[quote.status]!;
                                  if (next === "deal_closed") {
                                    if (confirm("Confirm deal and automatically create a booking?")) {
                                      handleConfirmDeal(quote.id);
                                    }
                                  } else {
                                    handleUpdateStatus(quote.id, next);
                                  }
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-medium transition-colors">
                                <ChevronRight className="w-4 h-4" />Move to {getStatusLabel(nextStatusMap[quote.status]!)}
                              </button>
                            )}
                            <button onClick={() => { const reason = prompt("Reason for denying:"); if (reason) handleDenyOrder(quote.id, reason); }}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium transition-colors">
                              <XCircle className="w-4 h-4" />Deny Order
                            </button>
                            <button onClick={() => handleDelete(quote.id)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800/60 hover:bg-red-500/10 text-red-400 rounded-xl font-medium transition-colors">
                              <X className="w-4 h-4" />Delete Quote
                            </button>
                          </div>
                        )}

                        {quote.status === "deal_closed" && (
                          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                            <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-400" /><span className="font-semibold text-emerald-400">Deal Closed</span></div>
                            <p className="text-sm text-zinc-500 mt-1">Converted to a booking</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Send Quote Modal ─────────────────────────────────────────── */}
      {showQuoteModal && selectedQuote && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <div>
                <h3 className="text-lg font-bold">Send Quote</h3>
                <p className="text-sm text-zinc-500">{selectedQuote.requestNumber} · {selectedQuote.client?.name}</p>
              </div>
              <button onClick={() => setShowQuoteModal(false)} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-5">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Quote Amount (₹) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input type="number" value={quoteFormData.amount}
                    onChange={(e) => setQuoteFormData((p) => ({ ...p, amount: e.target.value }))}
                    placeholder="Enter quote amount"
                    className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Notes for Client</label>
                <textarea value={quoteFormData.notes}
                  onChange={(e) => setQuoteFormData((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Add any details about this quote..."
                  rows={3}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none" />
              </div>

              {/* PDF Upload */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Quote PDF <span className="text-zinc-600">(optional — client can download)</span>
                </label>

                {/* Current/uploaded PDF indicator */}
                {pdfStableUrl && (
                  <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-blue-300">{pdfFile ? pdfFile.name : "PDF attached"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={cloudinaryPreviewUrl(pdfStableUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        Preview ↗
                      </a>
                      <button onClick={clearPdf} className="text-red-400 hover:text-red-300">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                <input ref={pdfFileRef} type="file" accept="application/pdf" className="hidden" onChange={handlePdfFileChange} />
                <button type="button" onClick={() => pdfFileRef.current?.click()} disabled={uploadingPdf}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-50 text-sm">
                  {uploadingPdf ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading PDF...</>
                    : <><Upload className="w-4 h-4" />{pdfStableUrl ? "Replace PDF" : "Upload Quote PDF"}</>}
                </button>
                <p className="text-xs text-zinc-600 mt-1">PDF stored on Google Drive · max 20MB · publicly downloadable by client</p>
              </div>

              {/* Summary */}
              <div className="p-4 bg-zinc-800/50 rounded-xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Quote Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-zinc-500">Client</span><span>{selectedQuote.client?.name || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Service</span><span>{selectedQuote.serviceType}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Amount</span><span className="text-amber-400 font-bold">₹{Number(quoteFormData.amount || 0).toLocaleString("en-IN")}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">PDF</span><span className={pdfStableUrl ? "text-blue-400" : "text-zinc-600"}>{pdfStableUrl ? "Attached ✓" : "None"}</span></div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-6 border-t border-zinc-800">
              <button onClick={() => setShowQuoteModal(false)} className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-medium transition-colors">Cancel</button>
              <button onClick={() => handleSendQuote(selectedQuote.id)}
                disabled={!quoteFormData.amount || uploadingPdf || sendingQuote}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-black rounded-xl font-medium transition-colors">
                {sendingQuote ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</> : <><Send className="w-4 h-4" />Send Quote</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}