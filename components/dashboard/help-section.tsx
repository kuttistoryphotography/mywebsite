"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  HelpCircle, Plus, Send, ChevronRight, ChevronLeft,
  MessageCircle, Clock, CheckCircle2, XCircle, AlertCircle,
  Loader2, X, FileText, Zap, Phone, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SupportMessage {
  id: string;
  role: "user" | "admin";
  content: string;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: string;
  messages: SupportMessage[];
  adminUnread: number;
  userUnread: number;
  createdAt: string;
  updatedAt: string;
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
const CATEGORY_OPTIONS = [
  { value: "general",   label: "General Question" },
  { value: "booking",   label: "Booking Issue" },
  { value: "payment",   label: "Payment Issue" },
  { value: "files",     label: "Files / Gallery" },
  { value: "technical", label: "Technical Problem" },
  { value: "other",     label: "Other" },
];

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const fmtShort = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

export default function HelpSection() {
  const [tickets, setTickets]         = useState<SupportTicket[]>([]);
  const [selected, setSelected]       = useState<SupportTicket | null>(null);
  const [loading, setLoading]         = useState(true);
  const [showNew, setShowNew]         = useState(false);
  const [reply, setReply]             = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const messagesEndRef                = useRef<HTMLDivElement>(null);

  // New ticket form
  const [form, setForm] = useState({ subject: "", category: "general", message: "", priority: "normal" });
  const [creating, setCreating] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/support");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTickets(data.tickets || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const openTicket = async (ticket: SupportTicket) => {
    const res = await fetch(`/api/support?id=${ticket.id}`);
    const data = await res.json();
    if (res.ok) {
      setSelected(data.ticket);
      setTickets((prev) => prev.map((t) => t.id === ticket.id ? { ...t, userUnread: 0 } : t));
    }
  };

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTickets((prev) => [data.ticket, ...prev]);
      setShowNew(false);
      setForm({ subject: "", category: "general", message: "", priority: "normal" });
      setSelected(data.ticket);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    setSendingReply(true);
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

  // ── New Ticket Form ─────────────────────────────────────────────────────────
  if (showNew) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl">
        <div className="flex items-center gap-4">
          <button onClick={() => setShowNew(false)} className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">New Support Ticket</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Describe your issue and we'll get back to you soon</p>
          </div>
        </div>

        {error && <p className="text-sm text-red-400 p-3 bg-red-500/10 rounded-xl">{error}</p>}

        <form onSubmit={handleCreate} className="space-y-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Subject *</label>
            <input required value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              placeholder="Brief description of your issue"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Category</label>
              <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm">
                {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Priority</label>
              <select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Message *</label>
            <textarea required rows={6} value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
              placeholder="Describe your issue in detail..."
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm resize-none" />
          </div>
          <button type="submit" disabled={creating || !form.subject.trim() || !form.message.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl disabled:opacity-50 transition-colors">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit Ticket
          </button>
        </form>
      </div>
    );
  }

  // ── Ticket Detail ───────────────────────────────────────────────────────────
  if (selected) {
    const isClosed = selected.status === "resolved" || selected.status === "closed";
    return (
      <div className="space-y-5 animate-in fade-in duration-300">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelected(null)} className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-lg">{selected.subject}</h2>
                <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", STATUS_COLORS[selected.status])}>
                  {STATUS_LABELS[selected.status]}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">{selected.ticketNumber} · {fmtDate(selected.createdAt)}</p>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-400 p-3 bg-red-500/10 rounded-xl">{error}</p>}

        {/* Messages */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col" style={{ minHeight: 400, maxHeight: 520 }}>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {selected.messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                  msg.role === "user"
                    ? "bg-amber-500 text-black rounded-tr-sm"
                    : "bg-zinc-800 text-zinc-100 rounded-tl-sm")}>
                  <p>{msg.content}</p>
                  <p className={cn("text-[10px] mt-1", msg.role === "user" ? "text-black/60 text-right" : "text-zinc-500")}>
                    {msg.role === "admin" ? "Support Team · " : ""}{fmtDate(msg.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply box */}
          <div className="border-t border-zinc-800 p-4">
            {isClosed ? (
              <p className="text-sm text-zinc-500 text-center">This ticket is {selected.status}. Sending a new message will reopen it.</p>
            ) : null}
            <div className="flex gap-3 mt-2">
              <textarea value={reply} onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleReply(); }}
                placeholder={isClosed ? "Send a message to reopen this ticket..." : "Type your message… (Ctrl+Enter to send)"}
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

  // ── Tickets List ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Help & Support</h1>
          <p className="text-sm text-zinc-500 mt-1">Submit tickets and track your support requests</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition-colors text-sm">
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      {error && <p className="text-sm text-red-400 p-3 bg-red-500/10 rounded-xl">{error}</p>}

      {/* Quick contact cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Phone, label: "Call Us", value: "+91 93420 13600", href: "tel:+919342013600" },
          { icon: MessageCircle, label: "WhatsApp", value: "Chat instantly", href: "https://wa.me/919342013600" },
          { icon: FileText, label: "Email Us", value: "kuttistoryphotography@gmail.com", href: "mailto:kuttistoryphotography@gmail.com" },
        ].map(({ icon: Icon, label, value, href }) => (
          <a key={label} href={href} target="_blank" rel="noreferrer"
            className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-zinc-600 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
              <p className="text-sm font-medium truncate group-hover:text-amber-400 transition-colors">{value}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-zinc-600 ml-auto shrink-0" />
          </a>
        ))}
      </div>

      {/* Tickets */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-amber-500 animate-spin" /></div>
      ) : tickets.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center">
          <HelpCircle className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="font-semibold text-zinc-400 text-lg">No support tickets yet</h3>
          <p className="text-sm text-zinc-500 mt-2">Need help? Click "New Ticket" and our team will get back to you.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Your Tickets</h3>
          {tickets.map((ticket) => (
            <button key={ticket.id} onClick={() => openTicket(ticket)}
              className="w-full text-left bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-600 transition-all group">
              <div className="flex items-start gap-4">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",
                  ticket.status === "open" ? "bg-blue-500/10 border-blue-500/20" :
                  ticket.status === "in_progress" ? "bg-amber-500/10 border-amber-500/20" :
                  ticket.status === "resolved" ? "bg-emerald-500/10 border-emerald-500/20" :
                  "bg-zinc-800 border-zinc-700")}>
                  {ticket.status === "resolved" || ticket.status === "closed"
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    : ticket.status === "in_progress"
                    ? <Clock className="w-4 h-4 text-amber-400" />
                    : <AlertCircle className="w-4 h-4 text-blue-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm truncate">{ticket.subject}</p>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", STATUS_COLORS[ticket.status])}>
                      {STATUS_LABELS[ticket.status]}
                    </span>
                    {ticket.userUnread > 0 && (
                      <span className="px-2 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded-full">
                        {ticket.userUnread} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                    <span>{ticket.ticketNumber}</span>
                    <span>·</span>
                    <span>{CATEGORY_OPTIONS.find((c) => c.value === ticket.category)?.label || ticket.category}</span>
                    <span>·</span>
                    <span>{fmtShort(ticket.updatedAt)}</span>
                    <span>·</span>
                    <span>{ticket.messages.length} messages</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white shrink-0 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
