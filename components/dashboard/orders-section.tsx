"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Camera, Calendar, Clock, ArrowLeft, CheckCircle2, Circle, X,
  MapPin, Package, Video, Sparkles, FileCheck, PartyPopper,
  Download, FileText,
} from "lucide-react";
import Link from "next/link";
import OrderCancelForm from "./order-cancel-form";
import PaymentModal from "./PaymentModal";
import { downloadUrl as cloudinaryDownloadUrl } from "@/lib/drive-url";

// DB stage → UI display step
const ORDER_STATUSES = [
  { id: "processing",  dbStage: "processing",  label: "Processing",     icon: Clock       },
  { id: "booked",      dbStage: "confirmed",    label: "Booked",         icon: Calendar    },
  { id: "preparing",   dbStage: "in_progress",  label: "Preparing",      icon: Package     },
  { id: "editing",     dbStage: "editing",      label: "Editing",        icon: Video       },
  { id: "finalizing",  dbStage: "delivered",    label: "Finalizing",     icon: Sparkles    },
  { id: "end-editing", dbStage: "delivered",    label: "End of Editing", icon: FileCheck   },
  { id: "completed",   dbStage: "completed",    label: "Completed",      icon: PartyPopper },
] as const;

type OrderStatusId = (typeof ORDER_STATUSES)[number]["id"];

interface PaymentRecord {
  id: string;
  payment_date?: string;
  created_at?: string;
  amount: number;
  payment_status: "verified" | "verifying" | "pending" | "rejected";
  utr_number?: string;
  rejection_reason?: string;
}

interface TimelineEntry {
  stage: string;
  status: "completed" | "current" | "pending";
  notes?: string;
  startedAt?: string;
  completedAt?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  serviceType: string;
  serviceName: string;
  bookingDate: string;
  eventDate: string;
  venue?: string;
  bookingStatus?: string;    // raw DB status: pending | confirmed | in_progress | completed | cancelled
  currentStatus: OrderStatusId; // UI step id
  currentStage?: string;        // raw DB stage for timeline
  cancellationReason?: string | null;
  totalCost: number;
  currency: string;
  payments: PaymentRecord[];
  timeline: TimelineEntry[];
  pdfUrl?: string | null;
  addons?: string[];
}

export default function OrdersSection() {
  const searchParams = useSearchParams();
  const [orders, setOrders]                     = useState<Order[]>([]);
  const [isCancelOpen, setIsCancelOpen]         = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder]       = useState<Order | null>(null);
  const [orderPayments, setOrderPayments]       = useState<PaymentRecord[]>([]);

  const focusedEntityType = searchParams.get("entityType");
  const focusedEntityId   = searchParams.get("entityId");
  const focusedBookingId  = focusedEntityType === "booking" ? focusedEntityId : null;

  // ── Map DB stage/status → UI OrderStatusId ─────────────────────────────
  const dbStageToUiId = (stage: string, status?: string): OrderStatusId => {
    const s = (stage || status || "processing").toLowerCase();
    const map: Record<string, OrderStatusId> = {
      processing: "processing",
      pending:    "processing",
      confirmed:  "booked",
      in_progress:"preparing",
      editing:    "editing",
      delivered:  "finalizing",
      completed:  "completed",
      cancelled:  "processing",
    };
    return map[s] || "processing";
  };

  const getStatusIndex = (uiId: string) =>
    ORDER_STATUSES.findIndex((s) => s.id === uiId);

  const isOrderCancelled = (order: Order) =>
    order.bookingStatus === "cancelled";

  const getOrderStatusLabel = (order: Order) => {
    if (isOrderCancelled(order)) return "Cancelled";
    return ORDER_STATUSES.find((s) => s.id === order.currentStatus)?.label || "Processing";
  };

  const calculatePaidAmount = (payments?: PaymentRecord[]) =>
    (payments ?? [])
      .filter((p) => p.payment_status === "verified")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const formatCurrency = (amount: number, currency?: string) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: typeof currency === "string" && currency.trim() ? currency.toUpperCase() : "INR",
      minimumFractionDigits: 0,
    }).format(Number(amount) || 0);

  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  // ── Fetch bookings ──────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings");
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data.bookings)) return;

      const mapped: Order[] = data.bookings.map((b: any) => ({
        id:            String(b.id || b._id),
        orderNumber:   b.orderNumber || b.bookingNumber || String(b._id),
        serviceType:   b.serviceType || b.eventType || b.serviceName || "",
        serviceName:   b.serviceName || b.serviceType || b.eventType || "",
        bookingDate:   b.bookingDate || b.createdAt || "",
        eventDate:     b.eventDate || b.date || "",
        venue:         b.venue || b.location || b.eventLocation || "",
        bookingStatus: b.bookingStatus || b.status || "pending",
        currentStatus: dbStageToUiId(b.currentStage || b.status || "processing"),
        currentStage:  b.currentStage || "processing",
        cancellationReason: b.cancellationReason || null,
        totalCost:     Number(b.totalCost || b.estimatedPrice || b.amount || 0),
        currency:      b.currency || "INR",
        payments:      Array.isArray(b.payments) ? b.payments : [],
        timeline:      Array.isArray(b.timeline) ? b.timeline : [],
        pdfUrl:        b.pdfUrl || null,
        addons:        Array.isArray(b.addons) ? b.addons : [],
      }));

      setOrders(mapped);
      setSelectedOrder((prev) => {
        if (!prev) return prev;
        return mapped.find((o) => o.id === prev.id) ?? prev;
      });
    } catch (err) {
      console.error("[OrdersSection] fetch:", err);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Focus booking from notification link
  useEffect(() => {
    if (!focusedBookingId || orders.length === 0) return;
    const target = orders.find((o) => String(o.id) === String(focusedBookingId));
    if (target) setSelectedOrder(target);
  }, [focusedBookingId, orders]);

  // Fetch payments for selected order
  const fetchOrderPayments = useCallback(async (bookingId: string) => {
    try {
      const res = await fetch(`/api/payments?bookingId=${bookingId}`);
      if (res.ok) {
        const data = await res.json();
        setOrderPayments(data.payments || []);
      }
    } catch (err) {
      console.error("[OrdersSection] payments fetch:", err);
    }
  }, []);

  useEffect(() => {
    if (selectedOrder) fetchOrderPayments(selectedOrder.id);
  }, [selectedOrder, fetchOrderPayments]);

  // ── ORDER LIST VIEW ─────────────────────────────────────────────────────
  if (!selectedOrder) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Bookings</h1>
            <p className="text-sm text-zinc-500 mt-1">Track and manage your photography orders</p>
          </div>
        </div>

        {focusedBookingId && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            Opened from notification — focusing booking #{focusedBookingId}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-300">No bookings yet</h3>
            <p className="text-sm text-zinc-500 mt-2 max-w-md mx-auto">
              You haven't made any bookings yet. Start your photography journey with us!
            </p>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-semibold transition-colors"
            >
              <Camera className="w-4 h-4" /> Book a Session
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusIndex = Math.max(getStatusIndex(order.currentStatus), 0);
              const paidAmount = calculatePaidAmount(order.payments);
              const pendingAmount = order.totalCost - paidAmount;
              const isCancelled = isOrderCancelled(order);

              return (
                <div
                  key={order.id}
                  className={cn(
                    "bg-zinc-900/50 rounded-2xl border overflow-hidden transition-all",
                    focusedBookingId && String(order.id) === String(focusedBookingId)
                      ? "border-amber-500/60 shadow-[0_0_0_1px_rgba(245,158,11,0.35)]"
                      : isCancelled
                      ? "border-red-500/20"
                      : "border-zinc-800 hover:border-zinc-700"
                  )}
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                          <Camera className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium text-zinc-500">Order no</span>
                            <span className="text-sm font-bold text-white">#{order.orderNumber}</span>
                            <span
                              className={cn(
                                "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                isCancelled
                                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                                  : order.currentStatus === "completed"
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                  : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                              )}
                            >
                              {getOrderStatusLabel(order)}
                            </span>
                          </div>
                          <p className="text-lg font-semibold text-amber-400 mt-0.5">
                            {formatCurrency(order.totalCost, order.currency)}
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">{order.serviceName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-sm font-semibold transition-colors"
                        >
                          View Details
                        </button>
                        {!isCancelled && order.currentStatus !== "completed" && (
                          <button
                            onClick={() => { setSelectedOrder(order); setIsCancelOpen(true); }}
                            className="px-3 py-2 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-2">
                        {ORDER_STATUSES.slice(0, 5).map((status, index) => (
                          <div key={status.id} className="flex flex-col items-center flex-1">
                            <span className={cn("text-[9px] font-medium uppercase tracking-wide mb-2 text-center", index <= statusIndex ? "text-amber-400" : "text-zinc-600")}>
                              {status.label}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="relative h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((statusIndex / (ORDER_STATUSES.length - 1)) * 100, 100)}%` }}
                        />
                        {ORDER_STATUSES.slice(0, 5).map((status, index) => (
                          <div
                            key={status.id}
                            className={cn("absolute top-1/2 w-3 h-3 rounded-full border-2 transition-all", index <= statusIndex ? "bg-amber-500 border-amber-500" : "bg-zinc-900 border-zinc-700")}
                            style={{ left: `${(index / 4) * 100}%`, transform: "translate(-50%, -50%)" }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 text-xs text-zinc-500 flex-wrap">
                      <span>{order.serviceType}</span>
                      <span className="text-zinc-700">•</span>
                      <span>Booked {formatDate(order.bookingDate)}</span>
                      <span className="text-zinc-700">•</span>
                      <span>Event {formatDate(order.eventDate)}</span>
                      {pendingAmount > 0 && !isCancelled && (
                        <>
                          <span className="text-zinc-700">•</span>
                          <span className="text-amber-400">{formatCurrency(pendingAmount, order.currency)} pending</span>
                        </>
                      )}
                      {isCancelled && (
                        <>
                          <span className="text-zinc-700">•</span>
                          <span className="text-red-400">Cancelled</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── ORDER DETAIL VIEW ───────────────────────────────────────────────────
  const statusIndex = Math.max(getStatusIndex(selectedOrder.currentStatus), 0);
  const isSelectedOrderCancelled = isOrderCancelled(selectedOrder);
  const paidAmount = (orderPayments ?? [])
    .filter((p) => p.payment_status === "verified")
    .reduce((sum, p) => sum + parseFloat(String(p.amount || 0)), 0);
  const pendingAmount = selectedOrder.totalCost - paidAmount;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">Order #{selectedOrder.orderNumber}</h1>
            <span
              className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                isSelectedOrderCancelled
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : selectedOrder.currentStatus === "completed"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400"
              )}
            >
              {getOrderStatusLabel(selectedOrder)}
            </span>
          </div>
          <p className="text-sm text-zinc-500 mt-1">{selectedOrder.serviceName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Order Info & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">Order Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-zinc-500">Service Type</p>
                <p className="text-sm font-medium">{selectedOrder.serviceType}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500">Booking Date</p>
                <p className="text-sm font-medium">{formatDate(selectedOrder.bookingDate)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500">Event Date</p>
                <p className="text-sm font-medium">{formatDate(selectedOrder.eventDate)}</p>
              </div>
              {selectedOrder.venue && (
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500">Venue</p>
                  <p className="text-sm font-medium">{selectedOrder.venue}</p>
                </div>
              )}
            </div>

            {/* PDF Download */}
            {selectedOrder.pdfUrl && (
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <a
                  href={cloudinaryDownloadUrl(selectedOrder.pdfUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-sm font-semibold hover:bg-amber-500/20 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Quote PDF
                </a>
              </div>
            )}

            {selectedOrder.addons && selectedOrder.addons.length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <p className="text-xs text-zinc-500 mb-2">Add-ons</p>
                <div className="flex flex-wrap gap-2">
                  {selectedOrder.addons.map((addon) => (
                    <span key={addon} className="px-2.5 py-1 bg-zinc-800 rounded-lg text-xs font-medium text-zinc-300">{addon}</span>
                  ))}
                </div>
              </div>
            )}

            {isSelectedOrderCancelled && selectedOrder.cancellationReason && (
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Cancellation Reason</p>
                <p className="text-sm text-red-300 whitespace-pre-line bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                  {selectedOrder.cancellationReason}
                </p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-6">Order Timeline</h3>
            <div className="space-y-0">
              {ORDER_STATUSES.map((status, index) => {
                // Match timeline entry by dbStage
                const timelineEntry = selectedOrder.timeline.find(
                  (t) => t.stage === status.dbStage
                );
                const isCompleted = index < statusIndex;
                const isCurrent   = index === statusIndex;
                const isPending   = index > statusIndex;
                const StatusIcon  = status.icon;
                const isLast      = index === ORDER_STATUSES.length - 1;

                return (
                  <div key={status.id} className="relative flex items-start gap-4">
                    {!isLast && (
                      <div className={cn("absolute left-[15px] top-8 w-0.5 h-[calc(100%-8px)]", isCompleted || isCurrent ? "bg-amber-500" : "bg-zinc-700")} />
                    )}
                    <div className={cn("relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all",
                      isCompleted ? "bg-amber-500 border-2 border-amber-500"
                      : isCurrent ? "bg-amber-500/20 border-2 border-amber-500"
                      : "bg-zinc-900 border-2 border-zinc-700")}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4 text-black" />
                        : isCurrent ? <StatusIcon className="w-4 h-4 text-amber-400" />
                        : <Circle className="w-3 h-3 text-zinc-600" />}
                    </div>
                    <div className={cn("flex-1 pb-6", isPending && "opacity-40")}>
                      <div className="flex items-center justify-between">
                        <h4 className={cn("font-semibold", isCurrent ? "text-amber-400" : isCompleted ? "text-white" : "text-zinc-500")}>
                          {status.label}
                        </h4>
                        {timelineEntry?.completedAt && (
                          <span className="text-xs text-zinc-500">{formatDate(timelineEntry.completedAt)}</span>
                        )}
                        {timelineEntry?.startedAt && isCurrent && (
                          <span className="text-xs text-zinc-500">{formatDate(timelineEntry.startedAt)}</span>
                        )}
                      </div>
                      {timelineEntry?.notes && <p className="text-sm text-zinc-500 mt-1">{timelineEntry.notes}</p>}
                      {isCurrent && !timelineEntry?.notes && <p className="text-sm text-amber-400/70 mt-1">In progress...</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Payment Info */}
        <div className="space-y-6">
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Total Cost</span>
                <span className="text-lg font-bold text-white">{formatCurrency(selectedOrder.totalCost, selectedOrder.currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Paid Amount</span>
                <span className="text-sm font-semibold text-emerald-400">{formatCurrency(paidAmount, selectedOrder.currency)}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                <span className="text-sm font-medium text-zinc-400">Pending Amount</span>
                <span className={cn("text-lg font-bold", pendingAmount > 0 ? "text-amber-400" : "text-emerald-400")}>
                  {formatCurrency(pendingAmount, selectedOrder.currency)}
                </span>
              </div>
            </div>
            {pendingAmount > 0 && !isSelectedOrderCancelled && (
              <button onClick={() => setIsPaymentModalOpen(true)} className="w-full mt-4 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-semibold transition-colors">
                Pay Now
              </button>
            )}
          </div>

          {/* PDF Download Card (right column) */}
          {selectedOrder.pdfUrl && (
            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3">Documents</h3>
              <a
                href={cloudinaryDownloadUrl(selectedOrder.pdfUrl)}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">Quote PDF</p>
                  <p className="text-xs text-zinc-500">Tap to download</p>
                </div>
                <Download className="w-4 h-4 text-amber-400 shrink-0" />
              </a>
            </div>
          )}

          {/* Payment History */}
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">Payment History</h3>
            <div className="space-y-3">
              {orderPayments.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">No payment records yet</p>
              ) : (
                orderPayments.map((payment) => (
                  <div key={payment.id} className={cn("flex flex-col p-3 rounded-xl border",
                    payment.payment_status === "verified" ? "bg-emerald-500/5 border-emerald-500/10"
                    : payment.payment_status === "verifying" ? "bg-blue-500/5 border-blue-500/10"
                    : payment.payment_status === "rejected" ? "bg-red-500/5 border-red-500/10"
                    : "bg-amber-500/5 border-amber-500/10")}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center",
                          payment.payment_status === "verified" ? "bg-emerald-500/10"
                          : payment.payment_status === "verifying" ? "bg-blue-500/10"
                          : payment.payment_status === "rejected" ? "bg-red-500/10"
                          : "bg-amber-500/10")}>
                          {payment.payment_status === "verified" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            : payment.payment_status === "rejected" ? <X className="w-4 h-4 text-red-400" />
                            : <Clock className="w-4 h-4 text-amber-400" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{formatCurrency(payment.amount, selectedOrder.currency)}</p>
                          <p className="text-[10px] text-zinc-500">UPI • {formatDate(payment.payment_date || payment.created_at || "")}</p>
                        </div>
                      </div>
                      <span className={cn("text-[10px] font-bold uppercase tracking-wider",
                        payment.payment_status === "verified" ? "text-emerald-400"
                        : payment.payment_status === "verifying" ? "text-blue-400"
                        : payment.payment_status === "rejected" ? "text-red-400"
                        : "text-amber-400")}>
                        {payment.payment_status}
                      </span>
                    </div>
                    {payment.utr_number && <p className="text-[10px] text-zinc-500 mt-2 font-mono">UTR: {payment.utr_number}</p>}
                    {payment.rejection_reason && <p className="text-[10px] text-red-400 mt-2">{payment.rejection_reason}</p>}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-zinc-900/30 rounded-2xl border border-zinc-800/50 p-4">
            <p className="text-xs text-zinc-500 leading-relaxed">
              Need help with your order? Contact us at{" "}
              <a href="mailto:support@kuttistory.com" className="text-amber-400 hover:underline">support@kuttistory.com</a>
            </p>
          </div>
        </div>
      </div>

      {selectedOrder && (
        <>
          <OrderCancelForm
            isOpen={isCancelOpen}
            onClose={() => setIsCancelOpen(false)}
            onCancelled={({ bookingStatus, currentStatus, cancellationReason }) => {
              const update = {
                bookingStatus,
                currentStatus: dbStageToUiId(currentStatus),
                cancellationReason,
              };
              setOrders((prev) => prev.map((o) => o.id === selectedOrder.id ? { ...o, ...update } : o));
              setSelectedOrder((prev) => prev ? { ...prev, ...update } : prev);
              setIsCancelOpen(false);
            }}
            orderNumber={selectedOrder.orderNumber}
            orderId={selectedOrder.id}
          />
          <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            bookingId={selectedOrder.id}
            amount={pendingAmount}
            bookingNumber={selectedOrder.orderNumber}
            onPaymentSuccess={() => fetchOrderPayments(selectedOrder.id)}
          />
        </>
      )}
    </div>
  );
}