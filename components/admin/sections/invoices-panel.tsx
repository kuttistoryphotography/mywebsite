"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, FileText, Pencil, Plus, Receipt, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingOption {
  id: string;
  bookingNumber: string;
  userId?: number;
  client: string;
  email: string;
  service: string;
  amount: number;
  paid: number;
  status: string;
  date: string;
}

interface InvoiceItemForm {
  itemName: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceItem {
  id?: number;
  item_name: string;
  description?: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  sort_order?: number;
}

interface InvoiceRecord {
  id: number;
  invoice_number: string;
  booking_id: number;
  user_id: number;
  booking_number?: string;
  event_type?: string;
  client_name?: string;
  client_email?: string;
  status: "draft" | "sent" | "paid" | "partially_paid" | "overdue" | "cancelled";
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  notes?: string | null;
  items?: InvoiceItem[];
}

interface InvoicesPanelProps {
  openModalSignal: number;
}

const createEmptyItem = (): InvoiceItemForm => ({
  itemName: "",
  description: "",
  quantity: 1,
  unitPrice: 0,
});

const todayString = () => new Date().toISOString().slice(0, 10);
const nextWeekString = () => {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  return nextWeek.toISOString().slice(0, 10);
};

export default function InvoicesPanel({ openModalSignal }: InvoicesPanelProps) {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [bookings, setBookings] = useState<BookingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceRecord | null>(null);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState({
    issueDate: todayString(),
    dueDate: nextWeekString(),
    status: "sent",
    taxRate: 18,
    discountAmount: 0,
    notes: "",
    items: [createEmptyItem()],
  });
  const [form, setForm] = useState({
    bookingId: "",
    issueDate: todayString(),
    dueDate: nextWeekString(),
    status: "sent",
    taxRate: 18,
    discountAmount: 0,
    notes: "",
    items: [createEmptyItem()],
  });

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/invoices/admin");
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setBookingsLoading(true);
      const response = await fetch("/api/bookings/admin");
      if (response.ok) {
        const data = await response.json();
        const bookingOptions: BookingOption[] = (data.bookings || [])
          .filter((b: any) => b.userId || b._id)
          .map((b: any) => ({
            id:            String(b._id || b.id),
            bookingNumber: b.bookingNumber || '',
            userId:        b.userId ? String(b.userId) : undefined,
            client:        b.clientName || b.client || '',
            email:         b.clientEmail || b.email || '',
            service:       b.serviceName || b.eventType || b.service || 'Photography Service',
            amount:        Number(b.estimatedPrice ?? b.amount ?? 0),
            paid:          Number(b.totalPaid ?? b.paid ?? 0),
            status:        b.status || 'pending',
            date:          b.eventDate || b.createdAt || '',
          }));
        setBookings(bookingOptions);
      }
    } catch (error) {
      console.error("Error fetching invoice bookings:", error);
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (openModalSignal > 0) {
      handleOpenCreateModal();
    }
  }, [openModalSignal]);

  const resetForm = () => {
    setForm({
      bookingId: "",
      issueDate: todayString(),
      dueDate: nextWeekString(),
      status: "sent",
      taxRate: 18,
      discountAmount: 0,
      notes: "",
      items: [createEmptyItem()],
    });
    setCreateError("");
  };

  const handleOpenCreateModal = async () => {
    resetForm();
    if (!bookings.length) {
      await fetchBookings();
    }
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (invoice: InvoiceRecord) => {
    setEditingInvoice(invoice);
    setEditError("");
    setEditForm({
      issueDate: invoice.issue_date?.slice(0, 10) ?? todayString(),
      dueDate: invoice.due_date?.slice(0, 10) ?? nextWeekString(),
      status: invoice.status,
      taxRate: invoice.tax_rate ?? 18,
      discountAmount: invoice.discount_amount ?? 0,
      notes: invoice.notes ?? "",
      items: (invoice.items ?? []).length > 0
        ? (invoice.items ?? []).map((item) => ({
            itemName: item.item_name,
            description: item.description ?? "",
            quantity: item.quantity,
            unitPrice: item.unit_price,
          }))
        : [createEmptyItem()],
    });
    setShowEditModal(true);
    // close details panel if open
    setShowDetailsModal(false);
  };

  const selectedBooking = useMemo(
    () => bookings.find((booking) => booking.id === form.bookingId),
    [bookings, form.bookingId]
  );

  const invoicePreview = useMemo(() => {
    const subtotal = form.items.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
      0
    );
    const taxAmount = subtotal * (Number(form.taxRate || 0) / 100);
    const discountAmount = Number(form.discountAmount || 0);
    const total = Math.max(subtotal + taxAmount - discountAmount, 0);
    const amountPaid = Number(selectedBooking?.paid || 0);
    const due = Math.max(total - amountPaid, 0);

    return {
      subtotal,
      taxAmount,
      total,
      amountPaid,
      due,
    };
  }, [form.discountAmount, form.items, form.taxRate, selectedBooking]);

  const editInvoicePreview = useMemo(() => {
    const subtotal = editForm.items.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
      0
    );
    const taxAmount = subtotal * (Number(editForm.taxRate || 0) / 100);
    const discountAmount = Number(editForm.discountAmount || 0);
    const total = Math.max(subtotal + taxAmount - discountAmount, 0);
    const amountPaid = Number(editingInvoice?.amount_paid || 0);
    const due = Math.max(total - amountPaid, 0);
    return { subtotal, taxAmount, total, amountPaid, due };
  }, [editForm.discountAmount, editForm.items, editForm.taxRate, editingInvoice]);

  const handleBookingChange = (bookingId: string) => {
    const booking = bookings.find((item) => item.id === bookingId);
    setForm((current) => ({
      ...current,
      bookingId,
      items: current.items.map((item, index) =>
        index === 0
          ? {
              ...item,
              itemName: booking?.service || item.itemName,
              description: booking
                ? `Invoice for ${booking.bookingNumber}`
                : item.description,
              unitPrice: booking?.amount || item.unitPrice,
            }
          : item
      ),
    }));
  };

  const updateItem = (
    index: number,
    field: keyof InvoiceItemForm,
    value: string | number
  ) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const updateEditItem = (
    index: number,
    field: keyof InvoiceItemForm,
    value: string | number
  ) => {
    setEditForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addEditItem = () => {
    setEditForm((current) => ({
      ...current,
      items: [...current.items, createEmptyItem()],
    }));
  };

  const removeEditItem = (index: number) => {
    setEditForm((current) => ({
      ...current,
      items: current.items.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateInvoice = async () => {
    setEditError("");
    if (!editingInvoice) return;

    if (!editForm.items.some((item) => item.itemName.trim() && item.quantity > 0)) {
      setEditError("Add at least one valid invoice item.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/invoices/admin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: editingInvoice.id,
          issueDate: editForm.issueDate,
          dueDate: editForm.dueDate,
          status: editForm.status,
          taxRate: Number(editForm.taxRate),
          discountAmount: Number(editForm.discountAmount),
          notes: editForm.notes,
          items: editForm.items,
          amount: editInvoicePreview.total,

        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setEditError(data.error || "Failed to update invoice.");
        return;
      }

      setShowEditModal(false);
      setEditingInvoice(null);
      await fetchInvoices();
    } catch (error) {
      console.error("Error updating invoice:", error);
      setEditError("Something went wrong while updating the invoice.");
    } finally {
      setSubmitting(false);
    }
  };

  const addItem = () => {
    setForm((current) => ({
      ...current,
      items: [...current.items, createEmptyItem()],
    }));
  };

  const removeItem = (index: number) => {
    setForm((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleCreateInvoice = async () => {
    setCreateError("");

    if (!form.bookingId) {
      setCreateError("Please choose an order first.");
      return;
    }

    if (!form.items.some((item) => item.itemName.trim() && item.quantity > 0)) {
      setCreateError("Add at least one valid invoice item.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/invoices/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: form.bookingId,
          issueDate: form.issueDate,
          dueDate: form.dueDate,
          status: form.status,
          taxRate: Number(form.taxRate),
          discountAmount: Number(form.discountAmount),
          notes: form.notes,
          items: form.items,
          amount: invoicePreview.total,

        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCreateError(data.error || "Failed to create invoice.");
        return;
      }

      setShowCreateModal(false);
      resetForm();
      await fetchInvoices();
    } catch (error) {
      console.error("Error creating invoice:", error);
      setCreateError("Something went wrong while creating the invoice.");
    } finally {
      setSubmitting(false);
    }
  };

  const statusStyles = {
    draft: "bg-zinc-800 text-zinc-300 border-zinc-700",
    sent: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    partially_paid: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    overdue: "bg-red-500/10 text-red-400 border-red-500/20",
    cancelled: "bg-zinc-700/50 text-zinc-300 border-zinc-600",
  } as const;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const invoiceCount = invoices.length;
  const pendingCount = invoices.filter((invoice) =>
    ["sent", "partially_paid", "overdue"].includes(invoice.status)
  ).length;
  const paidCount = invoices.filter((invoice) => invoice.status === "paid").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Invoice Management</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Create invoices from existing orders and expose them to each client.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-black rounded-xl font-medium hover:bg-amber-400 transition-colors"
        >
          <Receipt className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
          <p className="text-2xl font-bold">{invoiceCount}</p>
          <p className="text-sm text-zinc-500 mt-1">Total invoices</p>
        </div>
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
          <p className="text-2xl font-bold">{pendingCount}</p>
          <p className="text-sm text-zinc-500 mt-1">Open invoices</p>
        </div>
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
          <p className="text-2xl font-bold">{paidCount}</p>
          <p className="text-sm text-zinc-500 mt-1">Paid invoices</p>
        </div>
      </div>

      <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center text-zinc-500">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="px-6 py-12 text-center text-zinc-500">
            No invoices created yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-4">
                    Invoice
                  </th>
                  <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-4">
                    Order
                  </th>
                  <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-4">
                    Client
                  </th>
                  <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-4">
                    Total
                  </th>
                  <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-4">
                    Due Date
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
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold">{invoice.invoice_number}</p>
                        <p className="text-xs text-zinc-500">Issued {formatDate(invoice.issue_date)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{invoice.booking_number || `Order #${invoice.booking_id}`}</p>
                        <p className="text-xs text-zinc-500">{invoice.event_type || "Photography Service"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{invoice.client_name || "Unknown client"}</p>
                        <p className="text-xs text-zinc-500">{invoice.client_email || "No email"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold">{formatCurrency(invoice.total_amount)}</p>
                        <p className="text-xs text-zinc-500">Due {formatCurrency(invoice.amount_due)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">{formatDate(invoice.due_date)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium border capitalize",
                          statusStyles[invoice.status]
                        )}
                      >
                        {invoice.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(invoice)}
                          className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
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

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Create Invoice</h3>
                <p className="text-sm text-zinc-500 mt-1">
                  Pick an order to automatically link the invoice with the client id and order id.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {createError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {createError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-zinc-400 block mb-2">Select Order</label>
                  <select
                    value={form.bookingId}
                    onChange={(event) => handleBookingChange(event.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    disabled={bookingsLoading}
                  >
                    <option value="">{bookingsLoading ? "Loading orders..." : "Choose an order"}</option>
                    {bookings.map((booking) => (
                      <option key={booking.id} value={booking.id}>
                        {booking.bookingNumber} — {booking.client}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-zinc-400 block mb-2">Initial Status</label>
                  <select
                    value={form.status}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value="sent">Sent</option>
                    <option value="draft">Draft</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-zinc-400 block mb-2">Issue Date</label>
                  <input
                    type="date"
                    value={form.issueDate}
                    onChange={(event) => setForm((current) => ({ ...current, issueDate: event.target.value }))}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-400 block mb-2">Due Date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              {selectedBooking && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-zinc-800/40 border border-zinc-800 rounded-2xl p-4">
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Client ID</p>
                    <p className="font-semibold mt-1">{selectedBooking.userId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Order ID</p>
                    <p className="font-semibold mt-1">{selectedBooking.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Order Value</p>
                    <p className="font-semibold mt-1">{formatCurrency(selectedBooking.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Paid on Order</p>
                    <p className="font-semibold mt-1">{formatCurrency(selectedBooking.paid)}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-zinc-400 block mb-2">Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.taxRate}
                    onChange={(event) => setForm((current) => ({ ...current, taxRate: Number(event.target.value) }))}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-400 block mb-2">Discount Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discountAmount}
                    onChange={(event) => setForm((current) => ({ ...current, discountAmount: Number(event.target.value) }))}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Invoice Items</h4>
                    <p className="text-sm text-zinc-500">Add the services included in this invoice.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm hover:bg-zinc-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>

                {form.items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-zinc-800/40 border border-zinc-800 rounded-2xl p-4"
                  >
                    <div className="md:col-span-3">
                      <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Item</label>
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={(event) => updateItem(index, "itemName", event.target.value)}
                        className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Description</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(event) => updateItem(index, "description", event.target.value)}
                        className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Qty</label>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={item.quantity}
                        onChange={(event) => updateItem(index, "quantity", Number(event.target.value))}
                        className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Rate</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(event) => updateItem(index, "unitPrice", Number(event.target.value))}
                        className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                    </div>
                    <div className="md:col-span-2 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Line Total</p>
                        <p className="font-semibold">
                          {formatCurrency(Number(item.quantity || 0) * Number(item.unitPrice || 0))}
                        </p>
                      </div>
                      {form.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-sm text-zinc-400 block mb-2">Internal Notes</label>
                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  placeholder="Any notes to store with this invoice"
                />
              </div>

              <div className="bg-zinc-800/40 border border-zinc-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Subtotal</span>
                  <span>{formatCurrency(invoicePreview.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Tax</span>
                  <span>{formatCurrency(invoicePreview.taxAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Discount</span>
                  <span>- {formatCurrency(form.discountAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Already Paid on Order</span>
                  <span>{formatCurrency(invoicePreview.amountPaid)}</span>
                </div>
                <div className="pt-3 border-t border-zinc-700 flex items-center justify-between font-semibold">
                  <span>Total Due</span>
                  <span>{formatCurrency(invoicePreview.due)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-zinc-800 border border-zinc-700 rounded-xl font-medium hover:bg-zinc-700 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateInvoice}
                  className="flex-1 py-3 bg-amber-500 text-black rounded-xl font-medium hover:bg-amber-400 transition-colors disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : "Create Invoice"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{selectedInvoice.invoice_number}</h3>
                <p className="text-sm text-zinc-500 mt-1">
                  Linked to {selectedInvoice.booking_number || `Order #${selectedInvoice.booking_id}`}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedInvoice(null);
                }}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Client ID</p>
                  <p className="font-semibold mt-1">{selectedInvoice.user_id}</p>
                </div>
                <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Order ID</p>
                  <p className="font-semibold mt-1">{selectedInvoice.booking_id}</p>
                </div>
                <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Issue Date</p>
                  <p className="font-semibold mt-1">{formatDate(selectedInvoice.issue_date)}</p>
                </div>
                <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Due Date</p>
                  <p className="font-semibold mt-1">{formatDate(selectedInvoice.due_date)}</p>
                </div>
              </div>

              <div className="bg-zinc-800/40 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{selectedInvoice.client_name || "Unknown client"}</p>
                    <p className="text-sm text-zinc-500 mt-1">{selectedInvoice.client_email || "No email available"}</p>
                  </div>
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border capitalize",
                      statusStyles[selectedInvoice.status]
                    )}
                  >
                    {selectedInvoice.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="bg-zinc-800/40 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-zinc-400" />
                  <h4 className="font-semibold">Line Items</h4>
                </div>
                <div className="divide-y divide-zinc-800">
                  {(selectedInvoice.items || []).map((item) => (
                    <div key={item.id || `${item.item_name}-${item.sort_order}`} className="px-5 py-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{item.item_name}</p>
                        {item.description && (
                          <p className="text-sm text-zinc-500 mt-1">{item.description}</p>
                        )}
                        <p className="text-xs text-zinc-500 mt-2">
                          {item.quantity} × {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <p className="font-semibold">{formatCurrency(item.line_total)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-800/40 border border-zinc-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Subtotal</span>
                  <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Tax</span>
                  <span>{formatCurrency(selectedInvoice.tax_amount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Discount</span>
                  <span>- {formatCurrency(selectedInvoice.discount_amount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Paid</span>
                  <span>{formatCurrency(selectedInvoice.amount_paid)}</span>
                </div>
                <div className="pt-3 border-t border-zinc-700 flex items-center justify-between font-semibold">
                  <span>Amount Due</span>
                  <span>{formatCurrency(selectedInvoice.amount_due)}</span>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="bg-zinc-800/40 border border-zinc-800 rounded-2xl p-5">
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-sm text-zinc-400">{selectedInvoice.notes}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-zinc-800">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedInvoice(null);
                  }}
                  className="flex-1 py-3 bg-zinc-800 border border-zinc-700 rounded-xl font-medium hover:bg-zinc-700 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleOpenEditModal(selectedInvoice)}
                  className="flex-1 py-3 bg-amber-500 text-black rounded-xl font-medium hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Edit Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Invoice Modal ── */}
      {showEditModal && editingInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Edit Invoice</h3>
                <p className="text-sm text-zinc-500 mt-1">{editingInvoice.invoice_number} · {editingInvoice.booking_number || `Order #${editingInvoice.booking_id}`}</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {editError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {editError}
                </div>
              )}

              {/* Linked order info (read-only) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-800/40 border border-zinc-800 rounded-2xl p-4">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Client ID</p>
                  <p className="font-semibold mt-1">{editingInvoice.user_id}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Order ID</p>
                  <p className="font-semibold mt-1">{editingInvoice.booking_id}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Client</p>
                  <p className="font-semibold mt-1 truncate">{editingInvoice.client_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Paid on Order</p>
                  <p className="font-semibold mt-1">{formatCurrency(editingInvoice.amount_paid)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-zinc-400 block mb-2">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((c) => ({ ...c, status: e.target.value }))}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-zinc-400 block mb-2">Issue Date</label>
                  <input
                    type="date"
                    value={editForm.issueDate}
                    onChange={(e) => setEditForm((c) => ({ ...c, issueDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-400 block mb-2">Due Date</label>
                  <input
                    type="date"
                    value={editForm.dueDate}
                    onChange={(e) => setEditForm((c) => ({ ...c, dueDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-zinc-400 block mb-2">Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.taxRate}
                    onChange={(e) => setEditForm((c) => ({ ...c, taxRate: Number(e.target.value) }))}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-400 block mb-2">Discount Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.discountAmount}
                    onChange={(e) => setEditForm((c) => ({ ...c, discountAmount: Number(e.target.value) }))}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              {/* Line items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Invoice Items</h4>
                    <p className="text-sm text-zinc-500">Edit the services included in this invoice.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addEditItem}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm hover:bg-zinc-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>

                {editForm.items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-zinc-800/40 border border-zinc-800 rounded-2xl p-4"
                  >
                    <div className="md:col-span-3">
                      <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Item</label>
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={(e) => updateEditItem(index, "itemName", e.target.value)}
                        className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Description</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateEditItem(index, "description", e.target.value)}
                        className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Qty</label>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateEditItem(index, "quantity", Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Rate</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateEditItem(index, "unitPrice", Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                    </div>
                    <div className="md:col-span-2 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Line Total</p>
                        <p className="font-semibold">
                          {formatCurrency(Number(item.quantity || 0) * Number(item.unitPrice || 0))}
                        </p>
                      </div>
                      {editForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEditItem(index)}
                          className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-sm text-zinc-400 block mb-2">Internal Notes</label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) => setEditForm((c) => ({ ...c, notes: e.target.value }))}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  placeholder="Any notes to store with this invoice"
                />
              </div>

              {/* Totals preview */}
              <div className="bg-zinc-800/40 border border-zinc-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Subtotal</span>
                  <span>{formatCurrency(editInvoicePreview.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Tax</span>
                  <span>{formatCurrency(editInvoicePreview.taxAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Discount</span>
                  <span>- {formatCurrency(editForm.discountAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Already Paid on Order</span>
                  <span>{formatCurrency(editInvoicePreview.amountPaid)}</span>
                </div>
                <div className="pt-3 border-t border-zinc-700 flex items-center justify-between font-semibold">
                  <span>Total Due</span>
                  <span>{formatCurrency(editInvoicePreview.due)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 bg-zinc-800 border border-zinc-700 rounded-xl font-medium hover:bg-zinc-700 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateInvoice}
                  className="flex-1 py-3 bg-amber-500 text-black rounded-xl font-medium hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}