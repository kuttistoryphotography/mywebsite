"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, Plus, Edit2, Trash2, Loader2, CheckCircle2, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "wedding",      label: "Wedding"      },
  { value: "pre-wedding",  label: "Pre Wedding"  },
  { value: "outdoor",      label: "Outdoor"      },
  { value: "baby-shoot",   label: "Baby Shoot"   },
  { value: "product",      label: "Product"      },
  { value: "corporate",    label: "Corporate"    },
  { value: "ads",          label: "Ads"          },
  { value: "food-shoot",   label: "Food Shoot"   },
  { value: "other",        label: "Other"        },
];

interface Review {
  id: string;
  rating: number;
  category: string;
  title: string;
  body: string;
  approved: boolean;
  serviceDate?: string | null;
  createdAt: string;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="focus:outline-none"
        >
          <Star
            className={cn(
              "w-7 h-7 transition-colors",
              (hovered || value) >= n ? "text-amber-400 fill-amber-400" : "text-zinc-600"
            )}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review, onEdit, onDelete }: { review: Review; onEdit: () => void; onDelete: () => void }) {
  const catLabel = CATEGORIES.find((c) => c.value === review.category)?.label ?? review.category;
  return (
    <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800 p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {catLabel}
            </span>
            {review.approved ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Approved
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-zinc-500">
                <Clock className="w-3 h-3" /> Pending review
              </span>
            )}
          </div>
          <h3 className="font-semibold text-white mt-2 leading-snug">{review.title}</h3>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></button>
          <button onClick={onDelete} className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} className={cn("w-4 h-4", n <= review.rating ? "text-amber-400 fill-amber-400" : "text-zinc-700")} />
        ))}
      </div>

      <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3">{review.body}</p>
      <p className="text-zinc-600 text-xs">{new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
    </div>
  );
}

function ReviewForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<Review>;
  onSave: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    rating:      initial?.rating      ?? 5,
    category:    initial?.category    ?? "",
    title:       initial?.title       ?? "",
    body:        initial?.body        ?? "",
    serviceDate: initial?.serviceDate ?? "",
  });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const handle = async () => {
    if (!form.category || !form.title.trim() || !form.body.trim()) {
      setError("Please fill in all required fields."); return;
    }
    setSaving(true);
    setError("");
    try {
      const res = initial?.id
        ? await fetch("/api/reviews", { method: "PUT",  headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: initial.id, ...form }) })
        : await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      onSave();
    } catch (e: any) {
      setError(e.message);
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h3 className="font-bold text-lg">{initial?.id ? "Edit Review" : "Write a Review"}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"><X className="w-5 h-5 text-zinc-400" /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</p>}

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Service Category *</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none">
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Your Rating *</label>
            <StarPicker value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Review Title *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Absolutely stunning photos!"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none placeholder:text-zinc-600" />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Your Experience *</label>
            <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4}
              placeholder="Share your experience with others…"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none resize-none placeholder:text-zinc-600" />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Service Date (optional)</label>
            <input type="date" value={form.serviceDate ?? ""} onChange={(e) => setForm({ ...form, serviceDate: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none" />
          </div>

          <p className="text-xs text-zinc-600">Your review will be visible once approved by our team.</p>
        </div>
        <div className="flex gap-3 p-6 border-t border-zinc-800">
          <button onClick={onClose} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium transition-colors">Cancel</button>
          <button onClick={handle} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black rounded-xl text-sm font-semibold transition-colors">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReviewsSection() {
  const [reviews, setReviews]       = useState<Review[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editReview, setEditReview] = useState<Review | null>(null);
  const [deleting, setDeleting]     = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/reviews?my=true");
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch { setReviews([]); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const del = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/reviews?id=${id}`, { method: "DELETE" });
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } finally { setDeleting(null); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Reviews</h1>
          <p className="text-sm text-zinc-500 mt-1">Share your experience with our photography services</p>
        </div>
        <button onClick={() => { setEditReview(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-semibold text-sm transition-colors">
          <Plus className="w-4 h-4" /> Write a Review
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-amber-500 animate-spin" /></div>
      ) : reviews.length === 0 ? (
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-300">No reviews yet</h3>
          <p className="text-sm text-zinc-500 mt-2">Tell others about your experience — it helps them choose the right service.</p>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> Write Your First Review
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r}
              onEdit={() => { setEditReview(r); setShowForm(true); }}
              onDelete={() => del(r.id)} />
          ))}
        </div>
      )}

      {showForm && (
        <ReviewForm
          initial={editReview ?? undefined}
          onSave={() => { setShowForm(false); setEditReview(null); fetch_(); }}
          onClose={() => { setShowForm(false); setEditReview(null); }}
        />
      )}
    </div>
  );
}
