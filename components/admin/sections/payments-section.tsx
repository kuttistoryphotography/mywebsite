"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Download,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  CreditCard,
  Banknote,
  Eye,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../../ui/chart";
import { cn } from "@/lib/utils";
import InvoicesPanel from "./invoices-panel";

interface Payment {
  id: number;
  booking_id: number;
  user_id: number;
  amount: number;
  upi_id?: string;
  utr_number?: string;
  payment_status: "pending" | "verifying" | "verified" | "rejected" | "failed";
  payment_type: string;
  payment_date?: string;
  verified_by?: number;
  verified_at?: string;
  rejection_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  booking_number?: string;
  event_type?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  verified_by_name?: string;
  verified_by_lastname?: string;
}

export default function PaymentsSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [openInvoiceModalSignal, setOpenInvoiceModalSignal] = useState(0);

  useEffect(() => {
    fetchPayments(statusFilter);
  }, [statusFilter]);

  const fetchPayments = async (status = statusFilter) => {
    try {
      setLoading(true);
      const param = status === 'all' ? '' : `?status=${status}`;
      const response = await fetch(`/api/payments/admin${param}`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (paymentId: number | string) => {
    if (!confirm('Are you sure you want to verify this payment?')) return;
    
    try {
      setActionLoading(true);
      const response = await fetch('/api/payments/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: String(paymentId), action: 'verify' })
      });
      
      if (response.ok) {
        await fetchPayments(statusFilter);
        // Update selected payment in place
        setSelectedPayment((prev) => prev ? { ...prev, payment_status: 'verified' } : prev);
        setShowDetailsModal(false);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to verify payment');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('Error verifying payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedPayment) return;
    
    try {
      setActionLoading(true);
      const response = await fetch('/api/payments/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paymentId: selectedPayment.id, 
          action: 'reject',
          rejectionReason 
        })
      });
      
      if (response.ok) {
        await fetchPayments(statusFilter);
        setShowRejectModal(false);
        setShowDetailsModal(false);
        setRejectionReason('');
        setSelectedPayment(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to reject payment');
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      alert('Error rejecting payment');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const clientName = `${payment.first_name || ''} ${payment.last_name || ''}`.trim();
    const matchesSearch =
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.utr_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const statusColors = {
    verified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    verifying: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    failed: "bg-red-500/10 text-red-400 border-red-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const methodIcons: Record<string, typeof CreditCard> = {
    "bank_transfer": Banknote,
    "upi": IndianRupee,
    "credit_card": CreditCard,
    "cash": IndianRupee,
  };

  const totalReceived = payments
    .filter((p) => p.payment_status === "verified")
    .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

  const totalPending = payments
    .filter((p) => p.payment_status === "pending")
    .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

  // Group payments by date for chart
  const paymentsByDate = payments.reduce((acc, payment) => {
    // Use payment_date if available, otherwise use created_at
    const dateStr = payment.payment_date || payment.created_at;
    if (!dateStr) return acc;
    
    const date = new Date(dateStr);
    const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    if (!acc[dateKey]) {
      acc[dateKey] = { date: dateKey, amount: 0, timestamp: date.getTime() };
    }
    
    // Only count verified payments in the chart
    if (payment.payment_status === 'verified') {
      acc[dateKey].amount += parseFloat(payment.amount.toString());
    }
    
    return acc;
  }, {} as Record<string, { date: string; amount: number; timestamp: number }>);

  // Sort by date and get last 7 days or available dates
  const chartData = Object.values(paymentsByDate)
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-7)
    .map(({ date, amount }) => ({
      date,
      amount: Math.round(amount),
    }));

  const handleExport = () => {
    if (filteredPayments.length === 0) {
      alert('No payments to export');
      return;
    }
    const headers = ['ID', 'Client', 'Email', 'Phone', 'Amount (₹)', 'Method', 'UTR/Transaction', 'Status', 'Booking #', 'Event', 'Date'];
    const rows = filteredPayments.map((p) => [
      p.id,
      `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown',
      p.email || '',
      p.phone || '',
      p.amount,
      p.payment_type || '',
      p.utr_number || '',
      p.payment_status,
      p.booking_number || '',
      p.event_type || '',
      p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN') : '',
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Payment Tracking</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Track all payments and invoices
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-700 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setOpenInvoiceModalSignal((current) => current + 1)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-black rounded-xl font-medium hover:bg-amber-400 transition-colors"
          >
            <Receipt className="w-4 h-4" />
            New Invoice
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-400">
              <ArrowUpRight className="w-3 h-3" />
              +18.5%
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold">
              ₹{totalReceived.toLocaleString()}
            </p>
            <p className="text-sm text-zinc-500 mt-1">Total Received</p>
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-amber-400">
              <ArrowDownRight className="w-3 h-3" />
              -5.2%
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold">
              ₹{totalPending.toLocaleString()}
            </p>
            <p className="text-sm text-zinc-500 mt-1">Pending Payments</p>
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Receipt className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold">
              {payments.filter((p) => p.payment_status === "verified").length}
            </p>
            <p className="text-sm text-zinc-500 mt-1">Successful Transactions</p>
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <IndianRupee className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold">
              ₹{payments.length > 0 ? Math.round((totalReceived + totalPending) / payments.length).toLocaleString() : 0}
            </p>
            <p className="text-sm text-zinc-500 mt-1">Avg. Transaction</p>
          </div>
        </div>
      </div>

      {/* Payment Chart */}
      <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold">Payment Overview</h3>
          <p className="text-sm text-zinc-500">Verified payments by date (last 7 days)</p>
        </div>
        {loading ? (
          <div className="h-62.5 flex items-center justify-center">
            <p className="text-zinc-500">Loading payment data...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-62.5 flex items-center justify-center">
            <p className="text-zinc-500">No payment data available</p>
          </div>
        ) : (
          <ChartContainer
            config={{
              amount: {
                label: "Amount",
                color: "#10b981",
              },
            }}
            className="h-62.5"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="date"
                  stroke="#71717a"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
                />
                <ChartTooltip 
                  cursor={false}
                  content={<ChartTooltipContent 
                    className="bg-zinc-900 border-zinc-700 text-white"
                    labelClassName="text-white"
                    formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Amount']}
                  />} 
                />
                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by client or UTR number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "verifying", "verified", "rejected", "failed"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize",
                statusFilter === status
                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  : "bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:bg-zinc-800"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-4">
                  Transaction
                </th>
                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-4">
                  Client
                </th>
                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-4">
                  Amount
                </th>
                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-4">
                  Method
                </th>
                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-4">
                  Date
                </th>
                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-4">
                  Status
                </th>
                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-4">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    Loading payments...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const MethodIcon = methodIcons[payment.payment_type] || CreditCard;
                  const clientName = `${payment.first_name || ''} ${payment.last_name || ''}`.trim() || 'Unknown';
                  const formattedDate = payment.created_at 
                    ? new Date(payment.created_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : 'N/A';

                  return (
                    <tr
                      key={payment.id}
                      className="hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-mono text-sm">
                            {payment.utr_number || `PAY-${payment.id}`}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {payment.event_type || payment.booking_number || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{clientName}</p>
                          {payment.email && (
                            <p className="text-xs text-zinc-500">{payment.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold">₹{parseFloat(payment.amount.toString()).toLocaleString('en-IN')}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MethodIcon className="w-4 h-4 text-zinc-500" />
                          <span className="text-sm capitalize">
                            {payment.payment_type?.replace('_', ' ') || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-zinc-400">{formattedDate}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium border capitalize",
                            statusColors[payment.payment_status as keyof typeof statusColors]
                          )}
                        >
                          {payment.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InvoicesPanel openModalSignal={openInvoiceModalSignal} />

      {/* Payment Details Modal */}
      {showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-bold">Payment Details</h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedPayment(null);
                }}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Payment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">UTR Number</p>
                  <p className="font-mono font-medium">{selectedPayment.utr_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Amount</p>
                  <p className="font-bold text-lg">₹{parseFloat(selectedPayment.amount.toString()).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Payment Type</p>
                  <p className="capitalize">{selectedPayment.payment_type?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Status</p>
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border capitalize inline-block",
                      statusColors[selectedPayment.payment_status as keyof typeof statusColors]
                    )}
                  >
                    {selectedPayment.payment_status}
                  </span>
                </div>
                {selectedPayment.upi_id && (
                  <div>
                    <p className="text-sm text-zinc-500 mb-1">UPI ID</p>
                    <p className="font-mono text-sm">{selectedPayment.upi_id}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Payment Date</p>
                  <p className="text-sm">
                    {selectedPayment.payment_date 
                      ? new Date(selectedPayment.payment_date).toLocaleString('en-IN')
                      : new Date(selectedPayment.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Client Info */}
              <div className="bg-zinc-800/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                  Client Information
                </h3>
                <div className="space-y-2">
                  <p className="font-medium">{`${selectedPayment.first_name || ''} ${selectedPayment.last_name || ''}`.trim() || 'Unknown'}</p>
                  {selectedPayment.email && (
                    <p className="text-sm text-zinc-400">{selectedPayment.email}</p>
                  )}
                  {selectedPayment.phone && (
                    <p className="text-sm text-zinc-400">{selectedPayment.phone}</p>
                  )}
                </div>
              </div>

              {/* Booking Info */}
              {selectedPayment.booking_number && (
                <div className="bg-zinc-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                    Booking Information
                  </h3>
                  <div className="space-y-2">
                    <p><span className="text-zinc-500">Booking #:</span> {selectedPayment.booking_number}</p>
                    {selectedPayment.event_type && (
                      <p><span className="text-zinc-500">Event:</span> {selectedPayment.event_type}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedPayment.notes && (
                <div className="bg-zinc-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                    Notes
                  </h3>
                  <p className="text-sm text-zinc-400">{selectedPayment.notes}</p>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedPayment.rejection_reason && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">
                    Rejection Reason
                  </h3>
                  <p className="text-sm text-red-400">{selectedPayment.rejection_reason}</p>
                </div>
              )}

              {/* Verification Info */}
              {selectedPayment.verified_at && (
                <div className="bg-zinc-800/50 rounded-xl p-4">
                  <p className="text-sm text-zinc-500">
                    {selectedPayment.payment_status === 'verified' ? 'Verified' : 'Rejected'} by{' '}
                    {selectedPayment.verified_by_name} {selectedPayment.verified_by_lastname} on{' '}
                    {new Date(selectedPayment.verified_at).toLocaleString('en-IN')}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-zinc-800">
                {(selectedPayment.payment_status === 'pending' || selectedPayment.payment_status === 'verifying') ? (
                  <>
                    <button
                      onClick={() => handleVerifyPayment(selectedPayment.id)}
                      disabled={actionLoading}
                      className="flex-1 py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? 'Processing...' : 'Verify Payment'}
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionLoading}
                      className="flex-1 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      Reject Payment
                    </button>
                  </>
                ) : selectedPayment.payment_status === 'verified' ? (
                  <div className="w-full py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-center font-medium">
                    ✓ Payment Verified
                  </div>
                ) : selectedPayment.payment_status === 'rejected' ? (
                  <div className="w-full py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-center font-medium">
                    ✗ Payment Rejected
                  </div>
                ) : (
                  <div className="w-full py-3 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-xl text-center font-medium">
                    Status: {selectedPayment.payment_status}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Modal */}
      {showRejectModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-zinc-800">
              <h3 className="text-lg font-bold">Reject Payment</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-zinc-400">
                Please provide a reason for rejecting this payment.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={4}
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectPayment}
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="flex-1 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Reject Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}