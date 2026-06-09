"use client";

import React, { useState, useEffect } from "react";
import { Save, Loader2, Plus, Trash2, ChevronDown, ChevronUp, GripVertical } from "lucide-react";

interface FaqItem     { question: string; answer: string }
interface FaqCategory { category: string; items: FaqItem[] }

interface HeaderForm {
  heading: string;
  subheading: string;
  description: string;
}

const TABS = [
  { id: "header",     label: "Header Text" },
  { id: "categories", label: "Categories & FAQs" },
] as const;
type TabId = typeof TABS[number]["id"];

export default function FaqSection() {
  const [activeTab,   setActiveTab]   = useState<TabId>("header");
  const [header,      setHeader]      = useState<HeaderForm>({ heading: "", subheading: "", description: "" });
  const [categories,  setCategories]  = useState<FaqCategory[]>([]);
  const [expandedCat, setExpandedCat] = useState<number | null>(0);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/faq")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setHeader({
            heading:     data.settings.heading     || "",
            subheading:  data.settings.subheading  || "",
            description: data.settings.description || "",
          });
          if (Array.isArray(data.settings.categories)) {
            setCategories(data.settings.categories);
          }
        }
      })
      .catch(() => setError("Failed to load FAQ settings"))
      .finally(() => setLoading(false));
  }, []);

  const save = async (section: string, data: unknown) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/faq", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // ── Category helpers ──
  const addCategory = () => {
    const updated = [...categories, { category: "New Category", items: [] }];
    setCategories(updated);
    setExpandedCat(updated.length - 1);
  };
  const removeCategory = (i: number) => setCategories(categories.filter((_, idx) => idx !== i));
  const updateCategoryName = (i: number, name: string) => {
    const c = [...categories]; c[i] = { ...c[i], category: name }; setCategories(c);
  };

  // ── Item helpers ──
  const addItem = (catIdx: number) => {
    const c = [...categories];
    c[catIdx] = { ...c[catIdx], items: [...c[catIdx].items, { question: "", answer: "" }] };
    setCategories(c);
  };
  const removeItem = (catIdx: number, itemIdx: number) => {
    const c = [...categories];
    c[catIdx] = { ...c[catIdx], items: c[catIdx].items.filter((_, i) => i !== itemIdx) };
    setCategories(c);
  };
  const updateItem = (catIdx: number, itemIdx: number, field: keyof FaqItem, val: string) => {
    const c = [...categories];
    const items = [...c[catIdx].items];
    items[itemIdx] = { ...items[itemIdx], [field]: val };
    c[catIdx] = { ...c[catIdx], items };
    setCategories(c);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-white">FAQ Manager</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Control all questions, answers, categories, and the section header shown on the FAQ page.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === t.id
                ? "bg-amber-500 text-black"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── HEADER TAB ── */}
      {activeTab === "header" && (
        <div className="bg-zinc-900 rounded-2xl p-6 space-y-5 border border-zinc-800">
          <h3 className="text-white font-semibold text-lg">Section Header</h3>
          <p className="text-zinc-500 text-sm -mt-2">
            The label, main heading, and description shown at the top of the FAQ section.
          </p>

          <div>
            <label className="block text-zinc-400 text-sm mb-1.5">Label (small text above heading)</label>
            <input
              value={header.subheading}
              placeholder="FAQs"
              onChange={(e) => setHeader({ ...header, subheading: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-1.5">Main Heading</label>
            <input
              value={header.heading}
              placeholder="Frequently Asked Questions"
              onChange={(e) => setHeader({ ...header, heading: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-1.5">Description</label>
            <textarea
              value={header.description}
              rows={3}
              placeholder="Everything you need to know about our photography services."
              onChange={(e) => setHeader({ ...header, description: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none resize-none"
            />
          </div>

          {/* Live preview */}
          <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50">
            <p className="text-blue-400 text-xs font-medium mb-1">{header.subheading || "FAQs"}</p>
            <p className="text-white text-xl font-bold mb-1">{header.heading || "Frequently Asked Questions"}</p>
            <p className="text-zinc-500 text-sm">{header.description || "—"}</p>
          </div>

          <button
            onClick={() => save("header", header)}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-semibold text-sm disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : saved ? "Saved!" : "Save Header"}
          </button>
        </div>
      )}

      {/* ── CATEGORIES TAB ── */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-zinc-400 text-sm">
              {categories.length} {categories.length === 1 ? "category" : "categories"} ·{" "}
              {categories.reduce((n, c) => n + c.items.length, 0)} total questions
            </p>
            <button
              onClick={addCategory}
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </div>

          {categories.length === 0 && (
            <div className="text-center py-16 border border-dashed border-zinc-700 rounded-2xl text-zinc-600 text-sm">
              No categories yet. Click "Add Category" to get started.
            </div>
          )}

          {categories.map((cat, catIdx) => (
            <div key={catIdx} className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
              {/* Category header row */}
              <div className="flex items-center gap-3 px-5 py-4">
                <GripVertical className="w-4 h-4 text-zinc-600 shrink-0" />
                <input
                  value={cat.category}
                  onChange={(e) => updateCategoryName(catIdx, e.target.value)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm font-semibold focus:border-amber-500 focus:outline-none"
                  placeholder="Category name"
                />
                <span className="text-xs text-zinc-600 shrink-0">{cat.items.length} Qs</span>
                <button
                  onClick={() => setExpandedCat(expandedCat === catIdx ? null : catIdx)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  {expandedCat === catIdx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button onClick={() => removeCategory(catIdx)} className="text-red-400 hover:text-red-300 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Expanded: items */}
              {expandedCat === catIdx && (
                <div className="px-5 pb-5 space-y-3 border-t border-zinc-800 pt-4">
                  {cat.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="bg-zinc-800 rounded-xl p-4 space-y-3 border border-zinc-700">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 text-xs font-mono">Q{itemIdx + 1}</span>
                        <button onClick={() => removeItem(catIdx, itemIdx)} className="text-red-400 hover:text-red-300 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div>
                        <label className="block text-zinc-500 text-xs mb-1">Question</label>
                        <input
                          value={item.question}
                          placeholder="Type the question…"
                          onChange={(e) => updateItem(catIdx, itemIdx, "question", e.target.value)}
                          className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-500 text-xs mb-1">Answer</label>
                        <textarea
                          value={item.answer}
                          placeholder="Type the answer…"
                          rows={3}
                          onChange={(e) => updateItem(catIdx, itemIdx, "answer", e.target.value)}
                          className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none resize-none"
                        />
                      </div>
                    </div>
                  ))}

                  {cat.items.length === 0 && (
                    <p className="text-zinc-600 text-xs text-center py-4">No questions yet. Add one below.</p>
                  )}

                  <button
                    onClick={() => addItem(catIdx)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-zinc-700 hover:border-amber-500 hover:text-amber-500 text-zinc-500 rounded-xl text-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Question
                  </button>
                </div>
              )}
            </div>
          ))}

          {categories.length > 0 && (
            <button
              onClick={() => save("categories", categories)}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-semibold text-sm disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : saved ? "Saved!" : "Save All Categories"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}