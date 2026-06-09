"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Star, CheckCircle2, XCircle, Clock, Trash2, Search,
  Filter, RefreshCw, Eye, EyeOff, MessageSquare, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  wedding: "Wedding", "pre-wedding": "Pre Wedding", outdoor: "Outdoor",
  "baby-shoot": "Baby Shoot", product: "Product", corporate: "Corporate",
  ads: "Ads", "food-shoot": "Food Shoot", other: "Other",
};

interface Review {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string | null;
  rating: number;
  category: string;
  title: string;
  body: string;
  approved: boolean;
  featured: boolean;
  serviceDate?: string | null;
  createdAt: string;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn("w-3.5 h-3.5", n <= rating ? "text-amber-400 fill-amber-400" : "text-zinc-700")} />
      ))}
    </div>
  );
}

export default function ReviewsSection() {
  const [reviews, setReviews]       = useState<Review[]>([]);
  const [loading, setLoading]       = useState(true);
  const [updating, setUpdating]     = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved">("all");
  const [catFilter, setCatFilter]   = useState("all");

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/reviews?admin=true");
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch { setReviews([]); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  /* ── Approve / Unapprove ── */
  const toggleApprove = async (r: Review) => {
    setUpdating(r.id);
    try {
      await fetch("/api/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id, approved: !r.approved }),
      });
      setReviews((prev) => prev.map((x) => x.id === r.id ? { ...x, approved: !r.approved } : x));
    } finally { setUpdating(null); }
  };

  /* ── Featured toggle ── */
  const toggleFeatured = async (r: Review) => {
    setUpdating(r.id);
    try {
      await fetch("/api/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id, featured: !r.featured }),
      });
      setReviews((prev) => prev.map((x) => x.id === r.id ? { ...x, featured: !r.featured } : x));
    } finally { setUpdating(null); }
  };

  /* ── Delete ── */
  const del = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    setUpdating(id);
    try {
      await fetch(`/api/reviews?id=${id}`, { method: "DELETE" });
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } finally { setUpdating(null); }
  };

  /* ── Filters ── */
  const categories = Array.from(new Set(reviews.map((r) => r.category)));

  const filtered = reviews.filter((r) => {
    const s = search.toLowerCase();
    const matchSearch = !s
      || r.userName.toLowerCase().includes(s)
      || r.title.toLowerCase().includes(s)
      || r.body.toLowerCase().includes(s)
      || r.userEmail.toLowerCase().includes(s);
    const matchStatus =
      statusFilter === "all" ? true
      : statusFilter === "approved" ? r.approved
      : !r.approved;
    const matchCat = catFilter === "all" || r.category === catFilter;
    return matchSearch && matchStatus && matchCat;
  });

  const pendingCount  = reviews.filter((r) => !r.approved).length;
  const approvedCount = reviews.filter((r) => r.approved).length;
  const featuredCount = reviews.filter((r) => r.featured).length;

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reviews Management</h1>
          <p className="text-sm text-zinc-500 mt-1">Approve client reviews before they appear on the testimonials page</p>
        </div>
        <button onClick={() => fetch_()} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total",    value: reviews.length,  color: "zinc",    icon: MessageSquare },
          { label: "Pending",  value: pendingCount,    color: "amber",   icon: Clock         },
          { label: "Approved", value: approvedCount,   color: "emerald", icon: CheckCircle2  },
          { label: "Featured", value: featuredCount,   color: "blue",    icon: Star          },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className={cn("bg-zinc-900/50 rounded-xl border p-4",
            color === "amber"   ? "border-amber-500/20"   :
            color === "emerald" ? "border-emerald-500/20" :
            color === "blue"    ? "border-blue-500/20"    : "border-zinc-800")}>
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg",
                color === "amber"   ? "bg-amber-500/10"   :
                color === "emerald" ? "bg-emerald-500/10" :
                color === "blue"    ? "bg-blue-500/10"    : "bg-zinc-800")}>
                <Icon className={cn("w-4 h-4",
                  color === "amber"   ? "text-amber-400"   :
                  color === "emerald" ? "text-emerald-400" :
                  color === "blue"    ? "text-blue-400"    : "text-zinc-400")} />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-zinc-500">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name, email, or content…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "pending", "approved"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn("px-3 py-2 rounded-xl text-xs font-semibold border capitalize transition-colors",
                statusFilter === s
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:bg-zinc-800")}>
              {s === "all" ? `All (${reviews.length})` : s === "pending" ? `Pending (${pendingCount})` : `Approved (${approvedCount})`}
            </button>
          ))}
        </div>
        {categories.length > 0 && (
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50">
            <option value="all">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-amber-500 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-16 text-center">
          <MessageSquare className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-400">No reviews found</h3>
          <p className="text-sm text-zinc-500 mt-1">{search || statusFilter !== "all" ? "Try adjusting your filters" : "No reviews submitted yet"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id}
              className={cn("bg-zinc-900/50 rounded-2xl border p-5 transition-all",
                !r.approved ? "border-amber-500/20 bg-amber-500/5" : "border-zinc-800")}>
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">

                {/* Avatar + user */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-zinc-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {r.userAvatar
                      ? <img src={r.userAvatar} alt={r.userName} className="w-full h-full object-cover" />
                      : r.userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-[140px]">
                    <p className="font-semibold text-white text-sm">{r.userName}</p>
                    <p className="text-zinc-500 text-xs truncate max-w-[160px]">{r.userEmail}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">{fmtDate(r.createdAt)}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {CATEGORY_LABELS[r.category] ?? r.category}
                    </span>
                    {r.approved ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> Approved
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 animate-pulse">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                    {r.featured && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400">
                        <Star className="w-3 h-3 fill-blue-400" /> Featured
                      </span>
                    )}
                  </div>
                  <StarRow rating={r.rating} />
                  <p className="font-semibold text-white text-sm mt-1.5">{r.title}</p>
                  <p className="text-zinc-400 text-sm mt-1 leading-relaxed line-clamp-2">{r.body}</p>
                  {r.serviceDate && (
                    <p className="text-zinc-600 text-xs mt-1">Service date: {fmtDate(r.serviceDate)}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {updating === r.id ? (
                    <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                  ) : (
                    <>
                      {/* Approve / Unapprove */}
                      <button
                        onClick={() => toggleApprove(r)}
                        title={r.approved ? "Unapprove" : "Approve & publish"}
                        className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors",
                          r.approved
                            ? "bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20")}>
                        {r.approved
                          ? <><XCircle className="w-3.5 h-3.5" /> Unapprove</>
                          : <><CheckCircle2 className="w-3.5 h-3.5" /> Approve</>}
                      </button>

                      {/* Feature / Unfeature (only if approved) */}
                      {r.approved && (
                        <button
                          onClick={() => toggleFeatured(r)}
                          title={r.featured ? "Remove from featured" : "Feature this review"}
                          className={cn("p-2 rounded-xl border transition-colors",
                            r.featured
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-zinc-800 hover:text-zinc-400 hover:border-zinc-700"
                              : "bg-zinc-800 text-zinc-500 border-zinc-700 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/20")}>
                          <Star className={cn("w-4 h-4", r.featured && "fill-blue-400")} />
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => del(r.id)}
                        className="p-2 rounded-xl bg-zinc-800 text-zinc-500 border border-zinc-700 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-colors"
                        title="Delete review">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
