"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar, Search, Plus, Eye, Trash2, CheckCircle,
  XCircle, Clock, Camera, MapPin, Phone, Mail, AlertCircle, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import BookingTimeline from "@/components/admin/BookingTimeline";

interface Booking {
  id: string;
  bookingNumber: string;
  client: string;
  email: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  location: string;
  amount: number;
  paid: number;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "rejected";
  notes: string;
  createdAt: string;
  userId?: string;
  currentStage?: string;
  pdfUrl?: string | null;
  timeline?: Array<{
    stage: string;
    status: "completed" | "current" | "pending";
    notes?: string;
    startedAt?: string;
    completedAt?: string;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  pending:     "bg-amber-500/10 text-amber-400 border-amber-500/20",
  confirmed:   "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completed:   "bg-purple-500/10 text-purple-400 border-purple-500/20",
  cancelled:   "bg-red-500/10 text-red-400 border-red-500/20",
  rejected:    "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export default function BookingsSection() {
  const [bookings, setBookings]           = useState<Booking[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [isUpdating, setIsUpdating]       = useState(false);
  const [searchTerm, setSearchTerm]       = useState("");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetails, setShowDetails]     = useState(false);

  const fetchBookings = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const res = await fetch("/api/bookings/admin", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const next = (data.bookings || []) as Booking[];
      setBookings(next);
      // Keep selected booking in sync
      setSelectedBooking((prev) => {
        if (!prev) return prev;
        return next.find((b) => b.id === prev.id) ?? prev;
      });
    } catch (err) {
      console.error("[BookingsSection] fetch:", err);
      setBookings([]);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings(true);
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchBookings(false);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchBookings]);

  const filteredBookings = bookings.filter((b) => {
    const search = searchTerm.toLowerCase();
    const matchSearch =
      (b.client ?? "").toLowerCase().includes(search) ||
      (b.service ?? "").toLowerCase().includes(search) ||
      (b.bookingNumber ?? "").toLowerCase().includes(search);
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatDate = (d: string) => {
    if (!d) return "Not set";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatTime = (t: string) => {
    if (!t) return "";
    try {
      const [h, m] = t.split(":");
      const hr = parseInt(h);
      return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
    } catch { return t; }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  /* ── Update status (simple status field only) ── */
  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch("/api/bookings/admin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bookingId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");

      // Optimistic update, then refresh for full sync
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus as any, ...(data.booking || {}) } : b))
      );
      setSelectedBooking((prev) =>
        prev?.id === bookingId ? { ...prev, status: newStatus as any, ...(data.booking || {}) } : prev
      );
      // Full refresh to get updated timeline etc.
      await fetchBookings(false);
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  /* ── Update stage via timeline API ── */
  const handleStageUpdate = async (bookingId: string, stage: string, notes?: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch("/api/bookings/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, stage, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update stage");
      await fetchBookings(false);
    } catch (err: any) {
      alert("Failed to update stage: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  /* ── Delete booking ── */
  const handleDelete = async (bookingId: string) => {
    if (!confirm("Delete this booking? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/bookings/admin?id=${bookingId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      if (selectedBooking?.id === bookingId) { setShowDetails(false); setSelectedBooking(null); }
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Bookings Management</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage all your photography bookings</p>
        </div>
        <button
          onClick={() => fetchBookings(false)}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 text-white rounded-xl font-medium hover:bg-zinc-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "confirmed", "in_progress", "completed", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize",
                statusFilter === s
                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  : "bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:bg-zinc-800"
              )}
            >
              {s === "in_progress" ? "In Progress" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pending",   color: "amber",   icon: Clock,        status: "pending"     },
          { label: "Confirmed", color: "emerald",  icon: CheckCircle,  status: "confirmed"   },
          { label: "Completed", color: "blue",     icon: Camera,       status: "completed"   },
          { label: "Cancelled", color: "red",      icon: XCircle,      status: "cancelled"   },
        ].map(({ label, color, icon: Icon, status }) => (
          <div key={status} className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-${color}-500/10 rounded-lg`}>
                <Icon className={`w-4 h-4 text-${color}-500`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{bookings.filter((b) => b.status === status).length}</p>
                <p className="text-xs text-zinc-500">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-zinc-400">No bookings found</h3>
            <p className="text-sm text-zinc-500 mt-1">
              {searchTerm || statusFilter !== "all" ? "Try adjusting your filters" : "No bookings yet"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    {["Booking #", "Client", "Service", "Event Date", "Amount", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-mono text-sm text-amber-400">{booking.bookingNumber}</p>
                        <p className="text-xs text-zinc-500">{formatDate(booking.createdAt)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{booking.client}</p>
                        <p className="text-sm text-zinc-500">{booking.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm">{booking.service}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm">{formatDate(booking.date)}</p>
                        {booking.time && <p className="text-sm text-zinc-500">{formatTime(booking.time)}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{formatCurrency(booking.amount)}</p>
                        <p className="text-sm text-zinc-500">Paid: {formatCurrency(booking.paid)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("px-3 py-1 rounded-full text-xs font-medium border capitalize whitespace-nowrap", STATUS_COLORS[booking.status] || STATUS_COLORS.pending)}>
                          {booking.status === "in_progress" ? "In Progress" : (booking.status || "pending")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setSelectedBooking(booking); setShowDetails(true); }}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(booking.id)}
                            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
              <p className="text-sm text-zinc-500">
                Showing {filteredBookings.length} of {bookings.length} bookings
              </p>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetails && selectedBooking && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Booking Details</h2>
                <p className="text-sm text-zinc-500 font-mono">{selectedBooking.bookingNumber}</p>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Client Info */}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Client</h3>
                  <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <Camera className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-medium">{selectedBooking.client}</p>
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border capitalize", STATUS_COLORS[selectedBooking.status] || STATUS_COLORS.pending)}>
                          {selectedBooking.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400"><Mail className="w-4 h-4" />{selectedBooking.email}</div>
                    {selectedBooking.phone && <div className="flex items-center gap-2 text-sm text-zinc-400"><Phone className="w-4 h-4" />{selectedBooking.phone}</div>}
                    {selectedBooking.location && <div className="flex items-center gap-2 text-sm text-zinc-400"><MapPin className="w-4 h-4" />{selectedBooking.location}</div>}
                  </div>
                </div>

                {/* Event Info */}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Event</h3>
                  <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-zinc-500">Service</span><span>{selectedBooking.service}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Date</span><span>{formatDate(selectedBooking.date)}</span></div>
                    {selectedBooking.time && <div className="flex justify-between"><span className="text-zinc-500">Time</span><span>{formatTime(selectedBooking.time)}</span></div>}
                    <div className="flex justify-between"><span className="text-zinc-500">Amount</span><span className="font-semibold text-amber-400">{formatCurrency(selectedBooking.amount)}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Paid</span><span className="text-emerald-400">{formatCurrency(selectedBooking.paid)}</span></div>
                    {selectedBooking.pdfUrl && (
                      <div className="flex justify-between items-center pt-1 border-t border-zinc-700">
                        <span className="text-zinc-500">Quote PDF</span>
                        <a href={selectedBooking.pdfUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-amber-400 hover:text-amber-300 text-xs font-medium">
                          Download PDF ↗
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <BookingTimeline
                  bookingId={selectedBooking.id}
                  currentStage={selectedBooking.currentStage || "processing"}
                  timeline={selectedBooking.timeline || []}
                  onStageUpdate={(stage, notes) => handleStageUpdate(selectedBooking.id, stage, notes)}
                  isAdmin={true}
                />
              </div>

              {selectedBooking.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Notes</h3>
                  <p className="text-sm text-zinc-400 bg-zinc-800/50 rounded-xl p-4">{selectedBooking.notes}</p>
                </div>
              )}

              {/* Status Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {isUpdating && (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                    Updating...
                  </div>
                )}
                {selectedBooking.status === "pending" && (
                  <button
                    onClick={() => handleUpdateStatus(selectedBooking.id, "confirmed")}
                    disabled={isUpdating}
                    className="flex-1 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                  >
                    ✓ Confirm Booking
                  </button>
                )}
                {selectedBooking.status === "confirmed" && (
                  <button
                    onClick={() => handleUpdateStatus(selectedBooking.id, "in_progress")}
                    disabled={isUpdating}
                    className="flex-1 py-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl font-medium hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                  >
                    Mark In Progress
                  </button>
                )}
                {selectedBooking.status === "in_progress" && (
                  <button
                    onClick={() => handleUpdateStatus(selectedBooking.id, "completed")}
                    disabled={isUpdating}
                    className="flex-1 py-2.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl font-medium hover:bg-purple-500/20 transition-colors disabled:opacity-50"
                  >
                    Mark Completed
                  </button>
                )}
                {!["cancelled", "completed"].includes(selectedBooking.status) && (
                  <button
                    onClick={() => {
                      if (confirm("Cancel this booking?")) handleUpdateStatus(selectedBooking.id, "cancelled");
                    }}
                    disabled={isUpdating}
                    className="flex-1 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
