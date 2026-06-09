"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  HelpCircle, Send, ChevronLeft, CheckCircle2, XCircle,
  Clock, AlertCircle, Loader2, Search, Filter, Trash2,
  User, MessageCircle, X, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SupportMessage { id: string; role: "user" | "admin"; content: string; createdAt: string; }
interface SupportTicket {
  id: string; ticketNumber: string; subject: string; category: string;
  status: "open" | "in_progress" | "resolved" | "closed"; priority: string;
  messages: SupportMessage[]; adminUnread: number; userUnread: number;
  createdAt: string; updatedAt: string; resolvedAt?: string;
  user?: { id: string; name: string; email: string };
}

const STATUS_COLORS: Record<string, string> = {
  open:        "bg-blue-500/10 text-blue-400 border-blue-500/20",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  resolved:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  closed:      "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};
const STATUS_LABELS: Record<string, string> = {
  open: "Open", in_progress: "In Progress", resolved: "Resolved", closed: "Closed",
};
const PRIORITY_COLORS: Record<string, string> = {
  low: "text-zinc-400", normal: "text-blue-400", high: "text-amber-400", urgent: "text-red-400",
};
const CATEGORY_OPTIONS: Record<string, string> = {
  general: "General", booking: "Booking", payment: "Payment",
  files: "Files/Gallery", technical: "Technical", other: "Other",
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function SupportSection() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/support${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTickets(data.tickets || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages]);

  const openTicket = async (ticket: SupportTicket) => {
    const res = await fetch(`/api/support?id=${ticket.id}`);
    const data = await res.json();
    if (res.ok) {
      setSelected(data.ticket);
      setTickets((prev) => prev.map((t) => t.id === ticket.id ? { ...t, adminUnread: 0 } : t));
    }
  };

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    setSendingReply(true);
    setError(null);
    try {
      const res = await fetch("/api/support", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, message: reply }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSelected(data.ticket);
      setTickets((prev) => prev.map((t) => t.id === selected.id ? data.ticket : t));
      setReply("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSendingReply(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/support", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSelected(data.ticket);
      setTickets((prev) => prev.map((t) => t.id === id ? data.ticket : t));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handlePriorityChange = async (id: string, priority: string) => {
    try {
      const res = await fetch("/api/support", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, priority }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSelected(data.ticket);
      setTickets((prev) => prev.map((t) => t.id === id ? data.ticket : t));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ticket? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/support?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setTickets((prev) => prev.filter((t) => t.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const filtered = tickets.filter((t) => {
    const q = search.toLowerCase();
    return !q || t.subject.toLowerCase().includes(q) ||
      t.ticketNumber.toLowerCase().includes(q) ||
      (t.user?.name || "").toLowerCase().includes(q) ||
      (t.user?.email || "").toLowerCase().includes(q);
  });

  const counts = {
    open:        tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved:    tickets.filter((t) => t.status === "resolved").length,
    totalUnread: tickets.reduce((s, t) => s + t.adminUnread, 0),
  };

  // ── Ticket detail ────────────────────────────────────────────────────────────
  if (selected) {
    return (
      <div className="space-y-5 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelected(null)} className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-lg">{selected.subject}</h2>
                <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border", STATUS_COLORS[selected.status])}>
                  {STATUS_LABELS[selected.status]}
                </span>
                <span className={cn("text-xs font-semibold uppercase", PRIORITY_COLORS[selected.priority])}>
                  {selected.priority} priority
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {selected.ticketNumber} · {CATEGORY_OPTIONS[selected.category] || selected.category} · {selected.user?.name} ({selected.user?.email})
              </p>
            </div>
          </div>
          {/* Status actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status dropdown */}
            <select
              value={selected.status}
              onChange={(e) => handleStatusChange(selected.id, e.target.value)}
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-white cursor-pointer"
            >
              <option value="open">🔵 Open</option>
              <option value="in_progress">🟡 In Progress</option>
              <option value="resolved">🟢 Resolved</option>
              <option value="closed">⚫ Closed</option>
            </select>
            {/* Priority dropdown — admin only */}
            <select
              value={selected.priority}
              onChange={(e) => handlePriorityChange(selected.id, e.target.value)}
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-white cursor-pointer"
            >
              <option value="low">⬇ Low</option>
              <option value="normal">➡ Normal</option>
              <option value="high">⬆ High</option>
              <option value="urgent">🚨 Urgent</option>
            </select>
            <button onClick={() => handleDelete(selected.id)}
              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-400 p-3 bg-red-500/10 rounded-xl">{error}</p>}

        {/* Messages */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col" style={{ minHeight: 420, maxHeight: 540 }}>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {selected.messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-3", msg.role === "admin" ? "flex-row-reverse" : "")}>
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  msg.role === "admin" ? "bg-amber-500/20 border border-amber-500/30" : "bg-zinc-800")}>
                  {msg.role === "admin"
                    ? <span className="text-amber-400 text-xs font-bold">A</span>
                    : <User className="w-4 h-4 text-zinc-400" />}
                </div>
                <div className={cn("max-w-[75%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed",
                  msg.role === "admin" ? "bg-amber-500/10 border border-amber-500/20 text-zinc-100 rounded-tr-sm"
                    : "bg-zinc-800 text-zinc-100 rounded-tl-sm")}>
                  <p>{msg.content}</p>
                  <p className="text-[10px] text-zinc-500 mt-1">{fmtDate(msg.createdAt)}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply */}
          <div className="border-t border-zinc-800 p-4">
            <div className="flex gap-3">
              <textarea value={reply} onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleReply(); }}
                placeholder="Type your reply… (Ctrl+Enter to send)"
                rows={2}
                className="flex-1 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none" />
              <button onClick={handleReply} disabled={!reply.trim() || sendingReply}
                className="self-end px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl disabled:opacity-40 transition-colors">
                {sendingReply ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Ticket list ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Help & Support</h1>
          <p className="text-sm text-zinc-500 mt-1">View and respond to client support tickets</p>
        </div>
        <button onClick={fetchTickets}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm hover:bg-zinc-700 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Open",        value: counts.open,        color: "blue",    icon: AlertCircle },
          { label: "In Progress", value: counts.in_progress, color: "amber",   icon: Clock },
          { label: "Resolved",    value: counts.resolved,    color: "emerald", icon: CheckCircle2 },
          { label: "Unread",      value: counts.totalUnread, color: "red",     icon: MessageCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className={cn("p-4 rounded-xl border", `bg-${color}-500/5 border-${color}-500/20`)}>
            <Icon className={`w-4 h-4 text-${color}-400 mb-2`} />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject, ticket number, client name..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50">
            <option value="all">All Tickets ({tickets.length})</option>
            <option value="open">Open ({counts.open})</option>
            <option value="in_progress">In Progress ({counts.in_progress})</option>
            <option value="resolved">Resolved ({counts.resolved})</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-400 p-3 bg-red-500/10 rounded-xl">{error}</p>}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-amber-500 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center">
          <HelpCircle className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500">No support tickets found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => (
            <div key={ticket.id} className={cn("bg-zinc-900/50 border rounded-2xl transition-all",
              ticket.adminUnread > 0 ? "border-amber-500/30 shadow-amber-500/5 shadow-lg" : "border-zinc-800 hover:border-zinc-700")}>
              <button className="w-full text-left p-5" onClick={() => openTicket(ticket)}>
                <div className="flex items-start gap-4">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",
                    ticket.status === "open" ? "bg-blue-500/10 border-blue-500/20" :
                    ticket.status === "in_progress" ? "bg-amber-500/10 border-amber-500/20" :
                    ticket.status === "resolved" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-zinc-800 border-zinc-700")}>
                    {ticket.status === "resolved" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      : ticket.status === "in_progress" ? <Clock className="w-4 h-4 text-amber-400" />
                      : ticket.status === "open" ? <AlertCircle className="w-4 h-4 text-blue-400" />
                      : <XCircle className="w-4 h-4 text-zinc-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{ticket.subject}</p>
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", STATUS_COLORS[ticket.status])}>
                        {STATUS_LABELS[ticket.status]}
                      </span>
                      <span className={cn("text-[10px] font-bold uppercase", PRIORITY_COLORS[ticket.priority])}>
                        {ticket.priority}
                      </span>
                      {ticket.adminUnread > 0 && (
                        <span className="px-2 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded-full">
                          {ticket.adminUnread} new
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-zinc-500">
                      <span>{ticket.ticketNumber}</span>
                      <span>·</span>
                      <span className="text-zinc-400">{ticket.user?.name}</span>
                      <span>·</span>
                      <span>{ticket.user?.email}</span>
                      <span>·</span>
                      <span>{CATEGORY_OPTIONS[ticket.category] || ticket.category}</span>
                      <span>·</span>
                      <span>{ticket.messages.length} msgs</span>
                      <span>·</span>
                      <span>{new Date(ticket.updatedAt).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              </button>
              <div className="flex gap-2 px-5 pb-4">
                <button onClick={() => openTicket(ticket)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs transition-colors">
                  <MessageCircle className="w-3 h-3" /> Reply
                </button>
                {ticket.status !== "resolved" && (
                  <button onClick={() => handleStatusChange(ticket.id, "resolved")}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs transition-colors">
                    <CheckCircle2 className="w-3 h-3" /> Resolve
                  </button>
                )}
                <button onClick={() => handleDelete(ticket.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded-lg text-xs transition-colors">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
