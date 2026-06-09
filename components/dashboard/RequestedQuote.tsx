"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Edit3,
  Eye,
  ChevronRight,
  RefreshCw,
  Send,
  MessageSquare,
  AlertCircle,
  Calendar,
  User,
  Package,
  ThumbsUp,
  RotateCcw,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadUrl as cloudinaryDownloadUrl, previewUrl as cloudinaryPreviewUrl } from "@/lib/drive-url";
import RequoteDialog from "./RequoteDialog";

// Timeline status types
type QuoteStatus =
  | "quote_requested"
  | "quote_reviewed"
  | "requoted"
  | "reviewing"
  | "deal_closed"
  | "order_denied";

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
  pdfUrl?: string | null;
}

// Timeline steps configuration
const timelineSteps: { status: QuoteStatus; label: string; description: string }[] = [
  { status: "quote_requested", label: "Quote Requested", description: "Your request has been submitted" },
  { status: "quote_reviewed", label: "Quote Reviewed", description: "We've reviewed your requirements" },
  { status: "requoted", label: "Requoted", description: "Updated quote has been sent" },
  { status: "reviewing", label: "Reviewing", description: "Final review in progress" },
  { status: "deal_closed", label: "Deal Closed", description: "Booking confirmed!" },
];

const getStatusIndex = (status: QuoteStatus): number => {
  if (status === "order_denied") return -1;
  return timelineSteps.findIndex((step) => step.status === status);
};

const getStatusColor = (status: QuoteStatus) => {
  switch (status) {
    case "quote_requested":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "quote_reviewed":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "requoted":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "reviewing":
      return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    case "deal_closed":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "order_denied":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    default:
      return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  }
};

const getStatusLabel = (status: QuoteStatus) => {
  switch (status) {
    case "quote_requested":
      return "Quote Requested";
    case "quote_reviewed":
      return "Quote Reviewed";
    case "requoted":
      return "Requoted";
    case "reviewing":
      return "Reviewing";
    case "deal_closed":
      return "Deal Closed";
    case "order_denied":
      return "Order Denied";
    default:
      return status;
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Wedding Services":
      return User;
    case "Product Photography":
      return Package;
    case "Ad Shoot":
      return FileText;
    default:
      return FileText;
  }
};

export default function RequestedQuote() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [filter, setFilter] = useState<"all" | QuoteStatus>("all");
  const [showRequoteDialog, setShowRequoteDialog] = useState(false);
  const [selectedQuoteForRequote, setSelectedQuoteForRequote] = useState<QuoteRequest | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const focusedEntityType = searchParams.get("entityType");
  const focusedEntityId = searchParams.get("entityId");
  const focusedQuoteId = focusedEntityType === "quote" ? focusedEntityId : null;

  // Fetch user's quotes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/quotes');
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          setQuotes(data.quotes || []);
        } else {
          setQuotes([]);
        }
      } catch (err) {
        console.error('Failed to fetch quotes', err);
        setQuotes([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!focusedQuoteId || quotes.length === 0) return;

    const targetQuote = quotes.find((q) => String(q.id) === String(focusedQuoteId));
    if (!targetQuote) return;

    setFilter("all");
    setSelectedQuote(targetQuote);
  }, [focusedQuoteId, quotes]);

  const filteredQuotes = filter === "all" ? quotes : quotes.filter((q) => q.status === filter);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleEdit = (quoteId: string) => {
    // Navigate to booking form with quote data for editing
    // In future, this will pass the quote data to pre-fill the form
    router.push(`/booking?edit=${quoteId}`);
  };

  const handleAcceptQuote = async (quoteId: string) => {
    if (
      !confirm(
        "Are you sure you want to accept this quote? This will convert it to a confirmed order."
      )
    ) {
      return;
    }
  
    setActionLoading(quoteId);
  
    try {
      // STEP 1: Accept quote
      const response = await fetch(`/api/quotes/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteId,
          action: "accept",
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to accept quote");
      }
  
      // STEP 2: Create booking from quote
      const bookingResponse = await fetch(`/api/bookings/from-quote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteId,
        }),
      });
  
      if (!bookingResponse.ok) {
        const bookingError = await bookingResponse.json();
        throw new Error(
          bookingError.error || "Failed to create booking"
        );
      }
  
      const bookingResult = await bookingResponse.json();
  
      // STEP 3: Update local state
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === quoteId
            ? {
                ...q,
                status: "deal_closed" as QuoteStatus,
              }
            : q
        )
      );
  
      alert(
        `Quote accepted successfully!\nBooking Created: ${bookingResult.bookingNumber}`
      );
  
      // Optional redirect
      router.push("/dashboard?tab=bookings");
  
    } catch (error: any) {
      console.error("Error accepting quote:", error);
  
      alert(
        error.message ||
          "Failed to accept quote. Please try again."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequoteClick = (quote: QuoteRequest) => {
    setSelectedQuoteForRequote(quote);
    setShowRequoteDialog(true);
  };

  const handleRequoteSubmit = async (reason: string) => {
    if (!selectedQuoteForRequote) return;

    const quoteId = selectedQuoteForRequote.id;
    
    try {
      const response = await fetch(`/api/quotes/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId,
          action: "requote",
          reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit requote request");
      }

      const result = await response.json();
      
      // Update the quote in the local state
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === quoteId 
            ? { ...q, status: "requoted" as QuoteStatus, clientNotes: reason } 
            : q
        )
      );

      alert("Requote request submitted successfully! Our team will review and respond soon.");
    } catch (error: any) {
      console.error("Error submitting requote:", error);
      throw error; // Re-throw to let the dialog handle it
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Requested Quotes</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Track your quote requests and their status
          </p>
        </div>
        <button
          onClick={() => router.push("/booking")}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-xl transition-colors"
        >
          <Send className="w-4 h-4" />
          <span className="text-sm font-medium">New Quote Request</span>
        </button>
      </div>

      {focusedQuoteId && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Opened from notification: focusing quote #{focusedQuoteId}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            filter === "all"
              ? "bg-zinc-800 text-white"
              : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
          )}
        >
          All ({quotes.length})
        </button>
        {(
          [
            "quote_requested",
            "quote_reviewed",
            "requoted",
            "reviewing",
            "deal_closed",
            "order_denied",
          ] as QuoteStatus[]
        ).map((status) => {
          const count = quotes.filter((q) => q.status === status).length;
          if (count === 0) return null;
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                filter === status
                  ? "bg-zinc-800 text-white"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
              )}
            >
              {getStatusLabel(status)} ({count})
            </button>
          );
        })}
      </div>

      {/* Quotes List */}
      <div className="space-y-4">
        {filteredQuotes.length === 0 ? (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-12 text-center">
            <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-zinc-400">No quotes found</h3>
            <p className="text-sm text-zinc-500 mt-1">
              {filter === "all"
                ? "You haven't requested any quotes yet"
                : `No quotes with status "${getStatusLabel(filter)}"`}
            </p>
            <button
              onClick={() => router.push("/booking")}
              className="mt-6 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-medium transition-colors"
            >
              Request a Quote
            </button>
          </div>
        ) : (
          filteredQuotes.map((quote) => {
            const CategoryIcon = getCategoryIcon(quote.category);
            return (
              <div
                key={quote.id}
                id={`quote-${quote.id}`}
                className={cn(
                  "bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-colors",
                  focusedQuoteId && String(quote.id) === String(focusedQuoteId) && "border-amber-500/60 shadow-[0_0_0_1px_rgba(245,158,11,0.35)]"
                )}
              >
                {/* Quote Header */}
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-zinc-800 rounded-xl">
                      <CategoryIcon className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-white">{quote.title}</h3>
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                            getStatusColor(quote.status)
                          )}
                        >
                          {getStatusLabel(quote.status)}
                        </span>
                        {quote.pdfUrl && (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded-full flex items-center gap-1">
                            <FileText className="w-2.5 h-2.5" />PDF
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500">
                        <span className="font-mono">{quote.requestNumber}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(quote.createdAt)}
                        </span>
                        {quote.eventDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Event: {formatDate(quote.eventDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {quote.estimatedAmount && (
                      <div className="text-right mr-4">
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                          Estimated
                        </p>
                        <p className="text-lg font-bold text-white">
                          ₹{quote.estimatedAmount.toLocaleString("en-IN")}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() =>
                        setSelectedQuote(selectedQuote?.id === quote.id ? null : quote)
                      }
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {quote.status !== "deal_closed" && quote.status !== "order_denied" && (
                      <button
                        onClick={() => handleEdit(quote.id)}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedQuote?.id === quote.id && (
                  <div className="border-t border-zinc-800 p-6 bg-zinc-900/30 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Timeline */}
                    <div className="mb-6">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">
                        Status Timeline
                      </h4>
                      {quote.status === "order_denied" ? (
                        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                          <XCircle className="w-6 h-6 text-red-400" />
                          <div>
                            <p className="font-semibold text-red-400">Order Denied</p>
                            <p className="text-sm text-zinc-500">
                              {quote.adminNotes || "This quote request was not accepted"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          {/* Timeline Line */}
                          <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-zinc-800" />

                          {/* Timeline Steps */}
                          <div className="space-y-6">
                            {timelineSteps.map((step, index) => {
                              const currentIndex = getStatusIndex(quote.status);
                              const isCompleted = index <= currentIndex;
                              const isCurrent = index === currentIndex;

                              return (
                                <div key={step.status} className="flex items-start gap-4">
                                  <div
                                    className={cn(
                                      "relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                      isCompleted
                                        ? isCurrent
                                          ? "bg-amber-500 text-black"
                                          : "bg-emerald-500 text-white"
                                        : "bg-zinc-800 text-zinc-500"
                                    )}
                                  >
                                    {isCompleted && !isCurrent ? (
                                      <CheckCircle2 className="w-4 h-4" />
                                    ) : isCurrent ? (
                                      <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Clock className="w-4 h-4" />
                                    )}
                                  </div>
                                  <div className="flex-1 pt-1">
                                    <p
                                      className={cn(
                                        "font-medium",
                                        isCompleted ? "text-white" : "text-zinc-500"
                                      )}
                                    >
                                      {step.label}
                                    </p>
                                    <p className="text-sm text-zinc-500">{step.description}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notes Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {quote.clientNotes && (
                        <div className="p-4 bg-zinc-800/50 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-zinc-400" />
                            <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                              Your Notes
                            </h5>
                          </div>
                          <p className="text-sm text-zinc-300">{quote.clientNotes}</p>
                        </div>
                      )}
                      {quote.adminNotes && (
                        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-amber-400" />
                            <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                              Studio Response
                            </h5>
                          </div>
                          <p className="text-sm text-zinc-300">{quote.adminNotes}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {quote.status !== "deal_closed" && quote.status !== "order_denied" && (
                      <div className="mt-6 space-y-3">
                        {/* Accept and Requote buttons - Show when quote has an estimated amount (admin has reviewed) */}
                        {quote.estimatedAmount && (
                          <div className="flex flex-col gap-3 p-4 bg-linear-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/20 rounded-xl">
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white mb-1">
                                  Quote Ready for Review
                                </p>
                                <p className="text-xs text-zinc-400">
                                  Please review the quote and either accept or request changes
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleRequoteClick(quote)}
                                  disabled={actionLoading === quote.id}
                                  className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                  <span className="text-sm font-medium">Requote</span>
                                </button>
                                <button
                                  onClick={() => handleAcceptQuote(quote.id)}
                                  disabled={actionLoading === quote.id}
                                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                                >
                                  {actionLoading === quote.id ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                      <span className="text-sm font-medium">Processing...</span>
                                    </>
                                  ) : (
                                    <>
                                      <ThumbsUp className="w-4 h-4" />
                                      <span className="text-sm font-medium">Accept Quote</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                            {/* PDF download — shown only when admin has attached one */}
                            {quote.pdfUrl && (
                <div className="flex flex-wrap gap-2 self-start">
                                <a
                                  href={cloudinaryPreviewUrl(quote.pdfUrl!)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-xl transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span className="text-sm font-medium">Preview PDF</span>
                                </a>
                                <a
                                  href={cloudinaryDownloadUrl(quote.pdfUrl, `quote-${quote.requestNumber}.pdf`)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  
                                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-xl transition-colors"
                                >
                                  <Download className="w-4 h-4" />
                                  <span className="text-sm font-medium">Download PDF</span>
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Other action buttons */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleEdit(quote.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                            <span className="text-sm font-medium">Edit Request</span>
                          </button>
                          <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-xl transition-colors">
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-sm font-medium">Contact Studio</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {quote.status === "deal_closed" && (
                      <div className="mt-6 space-y-3">
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                          <div>
                            <p className="font-semibold text-emerald-400">Booking Confirmed!</p>
                            <p className="text-sm text-zinc-400">
                              Check your bookings tab for details
                            </p>
                          </div>
                          <button
                            onClick={() => router.push("/dashboard?tab=bookings")}
                            className="ml-auto flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300"
                          >
                            View Booking <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                        {quote.pdfUrl && (
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={cloudinaryPreviewUrl(quote.pdfUrl!)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-xl transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="text-sm font-medium">Preview PDF</span>
                            </a>
                            <a
                              href={cloudinaryDownloadUrl(quote.pdfUrl, `quote-${quote.requestNumber}.pdf`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              
                              className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-xl transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              <span className="text-sm font-medium">Download PDF</span>
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Requote Dialog */}
      {selectedQuoteForRequote && (
        <RequoteDialog
          isOpen={showRequoteDialog}
          onClose={() => {
            setShowRequoteDialog(false);
            setSelectedQuoteForRequote(null);
          }}
          onSubmit={handleRequoteSubmit}
          quoteNumber={selectedQuoteForRequote.requestNumber}
          quoteTitle={selectedQuoteForRequote.title}
        />
      )}
    </div>
  );
}