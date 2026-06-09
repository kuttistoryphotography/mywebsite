"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, X, Loader2, Send } from "lucide-react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

interface MonthlyQuote { _id: string; text: string; author?: string; month: number; year: number; isActive: boolean; }

export default function MonthlyQuotesSection() {
  const [quotes, setQuotes] = useState<MonthlyQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<MonthlyQuote | null>(null);
  const [saving, setSaving] = useState(false);
  const now = new Date();
  const [form, setForm] = useState({ text: "", author: "", month: now.getMonth() + 1, year: now.getFullYear(), isActive: true });

  const fetchQuotes = async () => {
    setLoading(true);
    const res = await fetch("/api/monthly-quotes?admin=true");
    const data = await res.json();
    setQuotes(data.quotes || []);
    setLoading(false);
  };

  useEffect(() => { fetchQuotes(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ text: "", author: "", month: now.getMonth() + 1, year: now.getFullYear(), isActive: true });
    setShowModal(true);
  };

  const openEdit = (q: MonthlyQuote) => {
    setEditing(q);
    setForm({ text: q.text, author: q.author || "", month: q.month, year: q.year, isActive: q.isActive });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.text.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await fetch("/api/monthly-quotes", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing._id, ...form }) });
      } else {
        await fetch("/api/monthly-quotes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      }
      setShowModal(false);
      await fetchQuotes();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (q: MonthlyQuote) => {
    if (!confirm("Delete this quote?")) return;
    await fetch(`/api/monthly-quotes?id=${q._id}`, { method: "DELETE" });
    await fetchQuotes();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Monthly Quotes</h2>
          <p className="text-zinc-500 text-sm mt-1">These are sent to users via WhatsApp when they receive their quote PDF.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-semibold text-sm transition-colors">
          <Plus className="w-4 h-4" /> Add Quote
        </button>
      </div>

      {loading ? <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-white animate-spin" /></div> : (
        <div className="space-y-3">
          {quotes.length === 0 && <p className="text-zinc-500">No monthly quotes yet.</p>}
          {quotes.map((q) => (
            <div key={q._id} className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 flex items-start gap-4">
              <div className="flex-shrink-0 text-center bg-zinc-800 rounded-xl px-3 py-2 min-w-[70px]">
                <div className="text-zinc-400 text-xs">{q.year}</div>
                <div className="text-white font-bold text-sm">{MONTHS[q.month - 1]?.slice(0, 3)}</div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full mt-1 inline-block ${q.isActive ? "bg-green-500/20 text-green-400" : "bg-zinc-700 text-zinc-500"}`}>{q.isActive ? "Active" : "Off"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white italic leading-relaxed">"{q.text}"</p>
                {q.author && <p className="text-zinc-500 text-sm mt-1">— {q.author}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(q)} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(q)} className="p-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-xl"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-lg border border-zinc-700 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <h3 className="text-white font-bold text-lg">{editing ? "Edit Quote" : "Add Monthly Quote"}</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-zinc-400 hover:text-white" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-zinc-400 text-sm mb-1.5">Quote Text *</label>
                <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={4}
                  placeholder="Enter an inspiring photography quote..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none resize-none" />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1.5">Author (optional)</label>
                <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="e.g. Ansel Adams"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-sm mb-1.5">Month</label>
                  <select value={form.month} onChange={(e) => setForm({ ...form, month: parseInt(e.target.value) })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none">
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 text-sm mb-1.5">Year</label>
                  <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded" />
                <span className="text-zinc-400 text-sm">Active (will be sent with quotes this month)</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-zinc-800">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm text-zinc-400 hover:text-white bg-zinc-800 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.text.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editing ? "Update" : "Add Quote"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
