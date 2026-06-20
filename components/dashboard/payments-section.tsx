"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import PaymentModal from "./PaymentModal";
import {
  CreditCard,
  Download,
  Eye,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Receipt,
  Wallet,
  TrendingUp,
  Filter,
  Search,
  MoreVertical,
  IndianRupee,
} from "lucide-react";
import Link from "next/link";

// Types
interface Payment {
  id: string;
  orderId: string;
  orderNumber: string;
  serviceName: string;
  amount: number;
  status: "paid" | "pending" | "failed" | "refunded" | "verifying";
  method: "card" | "upi" | "bank" | "cash";
  date: string;
  transactionId?: string;
  invoiceUrl?: string;
}

interface InvoiceLineItem {
  id: number;
  item_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  serviceName: string;
  amount: number;          // subtotal
  tax: number;             // tax_amount
  taxRate: number;         // tax_rate percentage
  discount: number;        // discount_amount
  total: number;           // total_amount
  amountPaid: number;
  amountDue: number;
  status: "paid" | "sent" | "draft" | "partially_paid" | "overdue" | "cancelled";
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  notes?: string;
  items: InvoiceLineItem[];
}

export default function PaymentsSection() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "invoices">("overview");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const focusedEntityType = searchParams.get("entityType");
  const focusedEntityId = searchParams.get("entityId");

  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        setLoading(true);

        const [paymentsResponse, invoicesResponse] = await Promise.all([
          fetch('/api/payments'),
          fetch('/api/invoices'),
        ]);

        if (paymentsResponse.ok) {
          const paymentsJson = await paymentsResponse.json();
          const paymentsData = paymentsJson.payments || [];

          const mappedPayments: Payment[] = paymentsData.map((payment: any) => {
            let status: Payment['status'] = 'pending';
          
            if (payment.status === 'completed') {
              status = 'paid';
            } else if (payment.status === 'verifying') {
              status = 'verifying';
            } else if (payment.status === 'failed') {
              status = 'failed';
            } else if (payment.status === 'refunded') {
              status = 'refunded';
            }
          
            return {
              id: payment.id,
          
              orderId: payment.booking?.orderId || '',
          
              orderNumber: payment.booking?.bookingNumber || 'N/A',
          
              serviceName:
                payment.booking.service_name ||
                payment.booking.serviceName ||
                'Photography Service',
          
              amount: Number(payment.amount || 0),
          
              status,
          
              method: payment.paymentMethod || 'upi',
          
              date:
                payment.createdAt ||
                new Date().toISOString(),
          
              transactionId:
                payment.transactionId || '',
            };
          });

          setPayments(mappedPayments);
        } else {
          setPayments([]);
        }

        if (invoicesResponse.ok) {
          const invoicesJson = await invoicesResponse.json();
          const invoicesData = invoicesJson.invoices || [];

          const validStatuses: Invoice['status'][] = ['paid', 'sent', 'draft', 'partially_paid', 'overdue', 'cancelled'];
          const mappedInvoices: Invoice[] = invoicesData.map((invoice: any) => {
            const apiStatus = invoice.status as string;
            const status: Invoice['status'] = validStatuses.includes(apiStatus as Invoice['status'])
              ? (apiStatus as Invoice['status'])
              : 'sent';

            return {
              id: String(invoice._id || invoice.id || ''),
              invoiceNumber:
                invoice.invoiceNumber ||
                invoice.invoice_number ||
                'N/A',
              orderId: String(
                invoice.bookingId ||
                invoice.booking_id ||
                ''
              ),
              orderNumber: invoice.booking_number || `ORD-${invoice.booking_id}`,
              serviceName: invoice.event_type || invoice.items?.[0]?.item_name || 'Photography Service',
              amount: Number(invoice.subtotal || 0),
              tax: Number(invoice.tax_amount || 0),
              taxRate: Number(invoice.tax_rate || 0),
              discount: Number(invoice.discount_amount || 0),
              total: Number(invoice.total || invoice.total_amount || 0),
              amountPaid: Number(invoice.amount_paid || 0),
              amountDue: Number(invoice.amount_due || 0),
              status,
              issueDate: invoice.issue_date,
              dueDate: invoice.due_date,
              paidDate: invoice.paid_at || (apiStatus === 'paid' ? invoice.updated_at : undefined),
              notes: invoice.notes || undefined,
              items: (invoice.items || []).map((item: any) => ({
                id: Number(item.id),
                item_name: item.item_name,
                description: item.description || undefined,
                quantity: Number(item.quantity),
                unit_price: Number(item.unit_price),
                line_total: Number(item.line_total),
              })),
            };
          });

          setInvoices(mappedInvoices);
        } else {
          setInvoices([]);
        }
      } catch (error) {
        console.error('Failed to fetch billing data:', error);
        setPayments([]);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, []);

  useEffect(() => {
    if (focusedEntityType === "invoice") {
      setActiveTab("invoices");
      return;
    }

    if (focusedEntityType === "payment") {
      setActiveTab("transactions");
    }
  }, [focusedEntityType]);

  useEffect(() => {
    if (!focusedEntityId || focusedEntityType !== "invoice" || invoices.length === 0) return;

    const targetInvoice = invoices.find((invoice) => String(invoice.id) === String(focusedEntityId));
    if (targetInvoice) {
      setSelectedInvoice(targetInvoice);
    }
  }, [focusedEntityType, focusedEntityId, invoices]);

  // Calculate totals
  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments
    .filter((p) => p.status === "pending" || p.status === "verifying")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalRefunded = payments
    .filter((p) => p.status === "refunded")
    .reduce((sum, p) => sum + p.amount, 0);

  const filteredPayments = payments.filter((payment) => {
    const matchesStatus = filterStatus === "all" || payment.status === filterStatus;
    const matchesSearch =
      payment.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.serviceName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesStatus = filterStatus === "all" || invoice.status === filterStatus;
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.serviceName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "paid":
        return {
          color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
          icon: CheckCircle2,
          label: "Paid",
        };
      case "verifying":
        return {
          color: "bg-blue-500/10 border-blue-500/20 text-blue-400",
          icon: Clock,
          label: "Verifying Payment",
        };
      case "pending":
        return {
          color: "bg-amber-500/10 border-amber-500/20 text-amber-400",
          icon: Clock,
          label: "Pending",
        };
      case "failed":
        return {
          color: "bg-red-500/10 border-red-500/20 text-red-400",
          icon: XCircle,
          label: "Failed",
        };
      case "refunded":
        return {
          color: "bg-purple-500/10 border-purple-500/20 text-purple-400",
          icon: AlertCircle,
          label: "Refunded",
        };
      case "overdue":
        return {
          color: "bg-red-500/10 border-red-500/20 text-red-400",
          icon: AlertCircle,
          label: "Overdue",
        };
      case "sent":
        return {
          color: "bg-amber-500/10 border-amber-500/20 text-amber-400",
          icon: Clock,
          label: "Pending",
        };
      case "draft":
        return {
          color: "bg-zinc-500/10 border-zinc-500/20 text-zinc-400",
          icon: FileText,
          label: "Draft",
        };
      case "partially_paid":
        return {
          color: "bg-blue-500/10 border-blue-500/20 text-blue-400",
          icon: AlertCircle,
          label: "Partial",
        };
      case "cancelled":
        return {
          color: "bg-zinc-700/30 border-zinc-700/30 text-zinc-500",
          icon: XCircle,
          label: "Cancelled",
        };
      default:
        return {
          color: "bg-zinc-500/10 border-zinc-500/20 text-zinc-400",
          icon: Clock,
          label: status,
        };
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "card":
        return "Credit/Debit Card";
      case "upi":
        return "UPI";
      case "bank":
        return "Bank Transfer";
      case "cash":
        return "Cash";
      default:
        return method;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDownloadPDF = async () => {
  try {
    const response = await fetch(
      `/api/invoices/${selectedInvoice?.id}/pdf`
    );

    if (!response.ok) {
      throw new Error("Failed to download PDF");
    }

    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedInvoice?.invoiceNumber}.pdf`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("PDF Download Error:", error);
  }
};

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Invoice Detail View
  if (selectedInvoice) {
    const statusConfig = getStatusConfig(selectedInvoice.status);
    const StatusIcon = statusConfig.icon;

    return (
  <>
    <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedInvoice(null)}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">{selectedInvoice.invoiceNumber}</h1>
              <p className="text-sm text-zinc-500 mt-1">{selectedInvoice.serviceName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Download PDF</span>
            </button>
            {(selectedInvoice.status === "sent" || selectedInvoice.status === "partially_paid") && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-medium transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                <span className="text-sm">Pay Now</span>
              </button>
            )}
          </div>
        </div>

        {/* Invoice Card */}
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden">
          {/* Invoice Header */}
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500">Invoice Number</p>
                <p className="font-bold text-lg">{selectedInvoice.invoiceNumber}</p>
              </div>
            </div>
            <span className={cn("px-3 py-1.5 rounded-full text-xs font-bold uppercase border flex items-center gap-1.5", statusConfig.color)}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusConfig.label}
            </span>
          </div>

          {/* Invoice Details */}
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Order Number</p>
              <p className="font-medium">{selectedInvoice.orderNumber}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Issue Date</p>
              <p className="font-medium">{formatDate(selectedInvoice.issueDate)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Due Date</p>
              <p className="font-medium">{formatDate(selectedInvoice.dueDate)}</p>
            </div>
            {selectedInvoice.paidDate && (
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Paid Date</p>
                <p className="font-medium text-emerald-400">{formatDate(selectedInvoice.paidDate)}</p>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div className="border-t border-zinc-800">
            <div className="p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">Invoice Items</h3>
              <div className="space-y-1">
                {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                  selectedInvoice.items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between py-3 border-b border-zinc-800/50 last:border-0">
                      <div className="flex-1 pr-4">
                        <p className="font-medium">{item.item_name}</p>
                        {item.description && <p className="text-xs text-zinc-500 mt-0.5">{item.description}</p>}
                        <p className="text-xs text-zinc-500 mt-0.5">{item.quantity} × {formatCurrency(item.unit_price)}</p>
                      </div>
                      <p className="font-medium shrink-0">{formatCurrency(item.line_total)}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-between py-3 border-b border-zinc-800/50">
                    <p className="font-medium">{selectedInvoice.serviceName}</p>
                    <p className="font-medium">{formatCurrency(selectedInvoice.amount)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="p-6 bg-zinc-800/30">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Subtotal</span>
                  <span>{formatCurrency(selectedInvoice.amount)}</span>
                </div>
                {selectedInvoice.taxRate > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Tax ({selectedInvoice.taxRate}% GST)</span>
                    <span>{formatCurrency(selectedInvoice.tax)}</span>
                  </div>
                )}
                {selectedInvoice.discount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Discount</span>
                    <span className="text-emerald-400">− {formatCurrency(selectedInvoice.discount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-700">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-lg text-amber-400">{formatCurrency(selectedInvoice.total)}</span>
                </div>
                {selectedInvoice.amountPaid > 0 && selectedInvoice.amountDue > 0 && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Amount Paid</span>
                      <span className="text-emerald-400">{formatCurrency(selectedInvoice.amountPaid)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-semibold border-t border-zinc-700 pt-2">
                      <span className="text-amber-400">Amount Due</span>
                      <span className="text-amber-400">{formatCurrency(selectedInvoice.amountDue)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* Notes */}
            {selectedInvoice.notes && (
              <div className="p-6 border-t border-zinc-800">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-2">Notes</h3>
                <p className="text-sm text-zinc-300 whitespace-pre-line">{selectedInvoice.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Related Payments */}
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">Payment History for this Invoice</h3>
          <div className="space-y-3">
            {payments
              .filter((p) => p.orderId === selectedInvoice.orderId)
              .map((payment) => {
                const paymentStatus = getStatusConfig(payment.status);
                const PaymentIcon = paymentStatus.icon;
                return (
                  <div key={payment.id} className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", paymentStatus.color)}>
                        <PaymentIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        <p className="text-xs text-zinc-500">{getMethodLabel(payment.method)} - {formatDate(payment.date)}</p>
                      </div>
                    </div>
                    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border", paymentStatus.color)}>
                      {paymentStatus.label}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
            </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        bookingId={selectedInvoice.orderId}
        bookingNumber={selectedInvoice.orderNumber}
        amount={selectedInvoice.amountDue || selectedInvoice.total}
      />
    </>
  );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your payments and invoices</p>
        </div>
      </div>

      {focusedEntityId && (focusedEntityType === "payment" || focusedEntityType === "invoice") && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Opened from notification: focusing {focusedEntityType} #{focusedEntityId}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Total Paid</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Pending</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{formatCurrency(totalPending)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          {totalPending > 0 && (
            <button
              onClick={() => {
                setActiveTab("invoices");
              }}
              className="w-full mt-4 py-2 bg-amber-500 hover:bg-amber-600 text-black text-sm font-bold rounded-xl transition-colors"
            >
              Pay Now
            </button>
          )}
        </div>
        

        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Refunded</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{formatCurrency(totalRefunded)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-zinc-900/50 rounded-xl p-1 border border-zinc-800 w-fit">
        {[
          { id: "overview", label: "Overview" },
          { id: "transactions", label: "Transactions" },
          { id: "invoices", label: "Invoices" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as typeof activeTab); setFilterStatus("all"); }}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-amber-500 text-black"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters - for transactions and invoices */}
      {(activeTab === "transactions" || activeTab === "invoices") && (
        <div className="flex items-center justify-between gap-4 bg-zinc-900/50 rounded-xl border border-zinc-800 p-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              {activeTab === "transactions" && <option value="pending">Pending</option>}
              {activeTab === "transactions" && <option value="failed">Failed</option>}
              {activeTab === "invoices" && <option value="sent">Pending</option>}
              {activeTab === "invoices" && <option value="partially_paid">Partial</option>}
              {activeTab === "invoices" && <option value="overdue">Overdue</option>}
              {activeTab === "invoices" && <option value="cancelled">Cancelled</option>}
            </select>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 w-48"
            />
          </div>
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Recent Transactions */}
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-semibold">Recent Transactions</h3>
              <button
                onClick={() => setActiveTab("transactions")}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
              >
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {loading ? (
                <div className="p-8 text-center text-zinc-500">Loading payments...</div>
              ) : payments.slice(0, 3).map((payment) => {
                const statusConfig = getStatusConfig(payment.status);
                const StatusIcon = statusConfig.icon;
                return (
                  <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", statusConfig.color)}>
                        <StatusIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">{payment.serviceName}</p>
                        <p className="text-xs text-zinc-500">{payment.orderNumber} - {formatDate(payment.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("font-bold", payment.status === "refunded" ? "text-purple-400" : "")}>
                        {payment.status === "refunded" ? "-" : ""}{formatCurrency(payment.amount)}
                      </p>
                      <span className={cn("text-[10px] uppercase font-bold", statusConfig.color.split(" ")[2])}>
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                );
              })}
              {!loading && payments.length === 0 && (
                <div className="p-8 text-center text-zinc-500">
                  No payment history yet
                </div>
              )}
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-semibold">Recent Invoices</h3>
              <button
                onClick={() => setActiveTab("invoices")}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
              >
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {loading ? (
                <div className="p-8 text-center text-zinc-500">Loading invoices...</div>
              ) : invoices.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">No invoices yet</div>
              ) : (
                invoices.slice(0, 3).map((invoice) => {
                  const statusConfig = getStatusConfig(invoice.status);
                  return (
                    <button
                      key={invoice.id}
                      onClick={() => setSelectedInvoice(invoice)}
                      className="p-4 w-full flex items-center justify-between hover:bg-zinc-800/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-zinc-400" />
                        </div>
                        <div>
                          <p className="font-medium">{invoice.invoiceNumber}</p>
                          <p className="text-xs text-zinc-500">{invoice.serviceName}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="font-bold">{formatCurrency(invoice.total)}</p>
                          <span className={cn("text-[10px] uppercase font-bold", statusConfig.color.split(" ")[2])}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-600" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === "transactions" && (
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden">
          {filteredPayments.length === 0 ? (
            <div className="p-12 text-center">
              <Wallet className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-zinc-400">No transactions found</h3>
              <p className="text-sm text-zinc-500 mt-1">Your payment transactions will appear here</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Transaction</th>
                  <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Order</th>
                  <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Method</th>
                  <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => {
                  const statusConfig = getStatusConfig(payment.status);
                  return (
                    <tr
                      key={payment.id}
                      className={cn(
                        "border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors",
                        focusedEntityType === "payment" && focusedEntityId && String(payment.id) === String(focusedEntityId) && "bg-amber-500/10"
                      )}
                    >
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium">{payment.serviceName}</p>
                          {payment.transactionId && (
                            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{payment.transactionId}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-zinc-400">{payment.orderNumber}</td>
                      <td className="px-4 py-4 text-sm text-zinc-400">{getMethodLabel(payment.method)}</td>
                      <td className="px-4 py-4 text-sm text-zinc-400">{formatDate(payment.date)}</td>
                      <td className="px-4 py-4">
                        <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border", statusConfig.color)}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className={cn("font-bold", payment.status === "refunded" ? "text-blue-400" : "")}>
                          {payment.status === "refunded" ? "-" : ""}{formatCurrency(payment.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === "invoices" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInvoices.length === 0 ? (
            <div className="col-span-2 bg-zinc-900/50 rounded-2xl border border-zinc-800 p-12 text-center">
              <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-zinc-400">No invoices found</h3>
              <p className="text-sm text-zinc-500 mt-1">Your invoices will appear here after booking</p>
            </div>
          ) : (
            filteredInvoices.map((invoice) => {
              const statusConfig = getStatusConfig(invoice.status);
              const StatusIcon = statusConfig.icon;
              return (
                <button
                  key={invoice.id}
                  onClick={() => setSelectedInvoice(invoice)}
                  className={cn(
                    "bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5 text-left hover:border-zinc-700 hover:bg-zinc-900 transition-all group",
                    focusedEntityType === "invoice" && focusedEntityId && String(invoice.id) === String(focusedEntityId) && "border-amber-500/60 shadow-[0_0_0_1px_rgba(245,158,11,0.35)]"
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
                        <FileText className="w-5 h-5 text-zinc-400 group-hover:text-amber-400 transition-colors" />
                      </div>
                      <div>
                        <p className="font-bold">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-zinc-500">{invoice.orderNumber}</p>
                      </div>
                    </div>
                    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border flex items-center gap-1", statusConfig.color)}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                  </div>

                  <p className="text-sm text-zinc-400 mb-3">{invoice.serviceName}</p>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                    <div className="flex items-center gap-1 text-zinc-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs">Due: {formatDate(invoice.dueDate)}</span>
                    </div>
                    <p className="font-bold text-amber-400">{formatCurrency(invoice.total)}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* No Payments State */}
      {!loading && payments.length === 0 && activeTab === "transactions" && (
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-12 text-center">
          <Wallet className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-400">No payments yet</h3>
          <p className="text-sm text-zinc-500 mt-2 max-w-md mx-auto">
            Your payment history will appear here after you book a session.
          </p>
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            Book a Session
          </Link>
        </div>
      )}
    </div>
  );
}
