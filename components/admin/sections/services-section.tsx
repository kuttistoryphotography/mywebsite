"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, X, Loader2, Eye, EyeOff } from "lucide-react";
import MediaField from "@/components/ui/MediaField";
import type { MediaType } from "@/lib/media";

/* ─────────── types ─────────── */
interface Service {
  _id?: string; id?: string; title: string; slug: string; description: string;
  shortDescription?: string; coverImage?: string; coverImageType?: string;
  images?: string[]; price?: string; features?: string[];
  isActive: boolean; sortOrder: number; icon?: string;
}
interface HeroData {
  heading: string; subheading: string; paragraph: string;
  heroImage: string; heroImageType: MediaType;
  heroVideo: string; heroVideoType: MediaType;
}
interface ShowcaseData {
  heading: string; subheading: string; description: string;
}
interface CardGridData {
  whatsappCardTitle: string;
  whatsappCardPlaceholder: string;
  storytellingCardTitle: string;
  storytellingCardDescription: string;
  storytellingCardImage: string;
  storytellingCardImageType: MediaType;
  storytellingCardLearnMoreLink: string;
  expertCardTitle: string;
  expertCount: string;
  expertCardTagline: string;
}

const HERO_DEF: HeroData = {
  heading: "", subheading: "", paragraph: "",
  heroImage: "", heroImageType: "image",
  heroVideo: "", heroVideoType: "video",
};
const SHOWCASE_DEF: ShowcaseData = {
  heading: "Our Services", subheading: "What We Offer",
  description: "Every frame tells a story. Discover our range of photography services.",
};
const CARDGRID_DEF: CardGridData = {
  whatsappCardTitle: "Guidance you can trust",
  whatsappCardPlaceholder: "Ask us anything...",
  storytellingCardTitle: "Candid Storytelling",
  storytellingCardDescription: "Starting your journey of memories today.",
  storytellingCardImage: "", storytellingCardImageType: "image",
  storytellingCardLearnMoreLink: "/works",
  expertCardTitle: "A New Dimension of Wellness",
  expertCount: "52+", expertCardTagline: "join with us",
};

type Tab = "services" | "page" | "showcase";

/* ─────────── component ─────────── */
export default function ServicesSection() {
  const [activeTab, setActiveTab] = useState<Tab>("services");

  /* service list */
  const [services,    setServices]    = useState<Service[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [editing,     setEditing]     = useState<Service | null>(null);
  const [saving,      setSaving]      = useState(false);
  const [newFeature,  setNewFeature]  = useState("");
  const [form, setForm] = useState({
    title: "", description: "", shortDescription: "", coverImage: "",
    coverImageType: "image" as MediaType,
    images: [] as string[], price: "", features: [] as string[],
    isActive: true, sortOrder: 0, icon: "",
  });

  /* page settings */
  const [hero,        setHero]        = useState<HeroData>(HERO_DEF);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageSaving,  setPageSaving]  = useState(false);
  const [pageSaved,   setPageSaved]   = useState(false);

  /* showcase */
  const [showcase,       setShowcase]       = useState<ShowcaseData>(SHOWCASE_DEF);
  const [showcaseSaving, setShowcaseSaving] = useState(false);
  const [showcaseSaved,  setShowcaseSaved]  = useState(false);

  /* card grid */
  const [cardGrid,    setCardGrid]    = useState<CardGridData>(CARDGRID_DEF);
  const [cardSaving,  setCardSaving]  = useState(false);
  const [cardSaved,   setCardSaved]   = useState(false);

  /* contact whatsapp (read-only display) */
  const [contactWhatsapp, setContactWhatsapp] = useState("");

  /* ── load ── */
  const fetchServices = async () => {
    setLoading(true);
    const res  = await fetch("/api/services?admin=true");
    const data = await res.json();
    setServices(data.services || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
    fetch("/api/services-page")
      .then((r) => r.json())
      .then((data) => {
        const s = data.settings;
        if (s?.hero)     setHero({ ...HERO_DEF,     ...s.hero });
        if (s?.showcase) setShowcase({ ...SHOWCASE_DEF, ...s.showcase });
        if (s?.cardGrid) setCardGrid({ ...CARDGRID_DEF, ...s.cardGrid });
        setPageLoading(false);
      })
      .catch(() => setPageLoading(false));

    fetch("/api/contact")
      .then((r) => r.json())
      .then((data) => setContactWhatsapp(data.settings?.whatsapp || data.settings?.phone || ""))
      .catch(() => {});
  }, []);

  /* ── service CRUD ── */
  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", description: "", shortDescription: "", coverImage: "", coverImageType: "image", images: [], price: "", features: [], isActive: true, sortOrder: services.length, icon: "" });
    setShowModal(true);
  };
  const openEdit = (svc: Service) => {
    setEditing(svc);
    setForm({
      title: svc.title, description: svc.description,
      shortDescription: svc.shortDescription || "",
      coverImage: svc.coverImage || "",
      coverImageType: (svc.coverImageType as MediaType) || "image",
      images: svc.images || [], price: svc.price || "",
      features: svc.features || [], isActive: svc.isActive,
      sortOrder: svc.sortOrder, icon: svc.icon || "",
    });
    setShowModal(true);
  };
  const handleSave = async () => {
    if (!form.title || !form.description) return;
    setSaving(true);
    try {
      const id = editing?._id || editing?.id;
      const payload = { ...form };
      if (id) {
        await fetch("/api/services", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...payload }) });
      } else {
        await fetch("/api/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      setShowModal(false);
      await fetchServices();
    } catch {}
    setSaving(false);
  };
  const handleDelete = async (svc: Service) => {
    if (!confirm(`Delete "${svc.title}"?`)) return;
    await fetch(`/api/services?id=${svc._id || svc.id}`, { method: "DELETE" });
    await fetchServices();
  };
  const toggleActive = async (svc: Service) => {
    await fetch("/api/services", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: svc._id || svc.id, isActive: !svc.isActive }) });
    await fetchServices();
  };

  /* ── save helpers ── */
  const save = async (section: string, data: object, setSaving: (v: boolean) => void, setSaved: (v: boolean) => void) => {
    setSaving(true);
    try {
      await fetch("/api/services-page", { method: "PUT", headers: { "Content-Type": "application/json" },cache: "no-store", body: JSON.stringify({ section, data }) });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch {}
    setSaving(false);
  };

  const inputCls = "w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none";
  const labelCls = "block text-zinc-400 text-sm mb-1.5";

  const tabs: { id: Tab; label: string }[] = [
    { id: "services", label: "Service Cards" },
    { id: "page",     label: "Page Settings" },
    { id: "showcase", label: "Showcase & Cards" },
  ];

  /* ════════════ render ════════════ */
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Services</h2>
        {activeTab === "services" && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-semibold text-sm transition-colors">
            <Plus className="w-4 h-4" /> Add Service
          </button>
        )}
        {activeTab === "page"     && pageSaved     && <span className="text-green-400 text-sm">✓ Saved</span>}
        {activeTab === "showcase" && (showcaseSaved || cardSaved) && <span className="text-green-400 text-sm">✓ Saved</span>}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === t.id ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ SERVICE CARDS TAB ═══ */}
      {activeTab === "services" && (
        loading
          ? <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-white animate-spin" /></div>
          : (
            <div className="space-y-3">
              {services.length === 0 && <p className="text-zinc-500">No services yet.</p>}
              {services.map((svc) => (
                <div key={svc._id || svc.id} className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 flex items-center gap-4">
                  {svc.coverImage
                    ? <img src={svc.coverImage.includes("drive.google") || svc.coverImage.includes("lh3.google") ? `https://lh3.googleusercontent.com/d/${svc.coverImage.match(/\/d\/([a-zA-Z0-9_-]{10,})/)?.[1]}=w200` : (svc.coverImage.includes("res.cloudinary.com") ? svc.coverImage.replace("/upload/", "/upload/w_200,q_auto,f_auto/") : svc.coverImage)} className="w-16 h-16 object-cover rounded-xl flex-shrink-0 border border-zinc-700" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    : <div className="w-16 h-16 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-600 flex-shrink-0 text-2xl">{svc.icon || "📷"}</div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white">{svc.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${svc.isActive ? "bg-green-500/20 text-green-400" : "bg-zinc-700 text-zinc-400"}`}>
                        {svc.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-sm mt-0.5 line-clamp-1">{svc.shortDescription || svc.description}</p>
                    <div className="flex gap-3 mt-1 text-xs text-zinc-500">
                      {svc.price && <span>₹{svc.price}</span>}
                      {svc.features?.length ? <span>{svc.features.length} features</span> : null}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => openEdit(svc)} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => toggleActive(svc)} className={`p-2 rounded-xl transition-colors ${svc.isActive ? "bg-zinc-700 hover:bg-zinc-600 text-zinc-300" : "bg-green-700 hover:bg-green-600 text-white"}`}>
                      {svc.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(svc)} className="p-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )
      )}

      {/* ═══ PAGE SETTINGS TAB ═══ */}
      {activeTab === "page" && (
        pageLoading
          ? <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-white animate-spin" /></div>
          : (
            <div className="bg-zinc-900 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-white font-semibold text-lg">Services Page Hero</h3>
                <p className="text-zinc-500 text-sm mt-1">Controls the hero section heading, subheading, paragraph, and right-side media.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: "heading",    label: "Main Heading",  ph: "Moments Over Matter — Motion in Time" },
                  { key: "subheading", label: "Subheading",    ph: "Our Services" },
                ].map(({ key, label, ph }) => (
                  <div key={key}>
                    <label className={labelCls}>{label}</label>
                    <input value={(hero as any)[key]} placeholder={ph}
                      onChange={(e) => setHero({ ...hero, [key]: e.target.value })}
                      className={inputCls} />
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className={labelCls}>Paragraph</label>
                  <textarea value={hero.paragraph} rows={3}
                    onChange={(e) => setHero({ ...hero, paragraph: e.target.value })}
                    className={`${inputCls} resize-none`} />
                </div>
              </div>

              {/* Hero Image — only images allowed */}
              <MediaField
                label="Hero Image"
                url={hero.heroImage}
                mediaType={hero.heroImageType}
                allowedTypes={["image"]}
                onChange={(url, mediaType) => setHero({ ...hero, heroImage: url, heroImageType: mediaType })}
                context="services"
                previewHeight="h-40"
              />

              {/* Hero Video — only videos allowed */}
              <MediaField
                label="Hero Video (overrides image when set)"
                url={hero.heroVideo}
                mediaType={"image"}
                allowedTypes={["image"]}
                onChange={(url, mediaType) => setHero({ ...hero, heroVideo: url, heroVideoType: mediaType })}
                context="services"
                previewHeight="h-40"
              />

              <button onClick={() => save("hero", hero, setPageSaving, setPageSaved)} disabled={pageSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
                {pageSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {pageSaved ? "Saved ✓" : "Save Page Settings"}
              </button>
            </div>
          )
      )}

      {/* ═══ SHOWCASE & CARDS TAB ═══ */}
      {activeTab === "showcase" && (
        pageLoading
          ? <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-white animate-spin" /></div>
          : (
            <div className="space-y-6">

              {/* Photography Showcase header */}
              <div className="bg-zinc-900 rounded-2xl p-6 space-y-5">
                <div>
                  <h3 className="text-white font-semibold text-lg">Photography Showcase</h3>
                  <p className="text-zinc-500 text-sm mt-1">
                    Heading, subheading and description shown above the service grid mosaic.
                    Service tile images come from the <strong className="text-zinc-300">Service Cards</strong> tab.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Heading</label>
                    <input value={showcase.heading} placeholder="Our Services"
                      onChange={(e) => setShowcase({ ...showcase, heading: e.target.value })}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Subheading (label above heading)</label>
                    <input value={showcase.subheading} placeholder="What We Offer"
                      onChange={(e) => setShowcase({ ...showcase, subheading: e.target.value })}
                      className={inputCls} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Description</label>
                    <textarea value={showcase.description} rows={2}
                      placeholder="Every frame tells a story..."
                      onChange={(e) => setShowcase({ ...showcase, description: e.target.value })}
                      className={`${inputCls} resize-none`} />
                  </div>
                </div>
                <button onClick={() => save("showcase", showcase, setShowcaseSaving, setShowcaseSaved)} disabled={showcaseSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
                  {showcaseSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {showcaseSaved ? "Saved ✓" : "Save Showcase Settings"}
                </button>
              </div>

              {/* Service Card Grid */}
              <div className="bg-zinc-900 rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="text-white font-semibold text-lg">Service Card Grid</h3>
                  <p className="text-zinc-500 text-sm mt-1">
                    Manages the three glass cards below the showcase. WhatsApp number comes from{" "}
                    <strong className="text-zinc-300">Contact Settings</strong> automatically.
                  </p>
                  {contactWhatsapp && (
                    <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-xl border border-zinc-700 text-sm">
                      <span className="text-zinc-400 text-xs">WhatsApp:</span>
                      <span className="text-green-400 font-semibold">{contactWhatsapp}</span>
                    </div>
                  )}
                </div>

                {/* Card 1 — WhatsApp */}
                <fieldset className="border border-zinc-700 rounded-xl p-4 space-y-3">
                  <legend className="text-xs text-zinc-400 px-2 uppercase tracking-widest">Card 1 — WhatsApp Contact</legend>
                  <div>
                    <label className={labelCls}>Card Title</label>
                    <input value={cardGrid.whatsappCardTitle}
                      onChange={(e) => setCardGrid({ ...cardGrid, whatsappCardTitle: e.target.value })}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Input Placeholder</label>
                    <input value={cardGrid.whatsappCardPlaceholder}
                      onChange={(e) => setCardGrid({ ...cardGrid, whatsappCardPlaceholder: e.target.value })}
                      className={inputCls} />
                  </div>
                </fieldset>

                {/* Card 2 — Featured Story */}
                <fieldset className="border border-zinc-700 rounded-xl p-4 space-y-4">
                  <legend className="text-xs text-zinc-400 px-2 uppercase tracking-widest">Card 2 — Featured Story</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Card Title</label>
                      <input value={cardGrid.storytellingCardTitle}
                        onChange={(e) => setCardGrid({ ...cardGrid, storytellingCardTitle: e.target.value })}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Learn More Link</label>
                      <input value={cardGrid.storytellingCardLearnMoreLink} placeholder="/works"
                        onChange={(e) => setCardGrid({ ...cardGrid, storytellingCardLearnMoreLink: e.target.value })}
                        className={inputCls} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Description</label>
                      <textarea value={cardGrid.storytellingCardDescription} rows={2}
                        onChange={(e) => setCardGrid({ ...cardGrid, storytellingCardDescription: e.target.value })}
                        className={`${inputCls} resize-none`} />
                    </div>
                  </div>
                  {/* allowedTypes: image or video — admin picks which */}
                  <MediaField
                    label="Card Media (image or video)"
                    url={cardGrid.storytellingCardImage}
                    mediaType={cardGrid.storytellingCardImageType}
                    allowedTypes={["image", "video"]}
                    onChange={(url, mediaType) => setCardGrid({ ...cardGrid, storytellingCardImage: url, storytellingCardImageType: mediaType })}
                    context="services"
                    previewHeight="h-32"
                  />
                </fieldset>

                {/* Card 3 — Expert Count */}
                <fieldset className="border border-zinc-700 rounded-xl p-4 space-y-3">
                  <legend className="text-xs text-zinc-400 px-2 uppercase tracking-widest">Card 3 — Expert Count</legend>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className={labelCls}>Card Title</label>
                      <input value={cardGrid.expertCardTitle}
                        onChange={(e) => setCardGrid({ ...cardGrid, expertCardTitle: e.target.value })}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Expert Count</label>
                      <input value={cardGrid.expertCount} placeholder="52+"
                        onChange={(e) => setCardGrid({ ...cardGrid, expertCount: e.target.value })}
                        className={inputCls} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Tagline</label>
                      <input value={cardGrid.expertCardTagline} placeholder="join with us"
                        onChange={(e) => setCardGrid({ ...cardGrid, expertCardTagline: e.target.value })}
                        className={inputCls} />
                    </div>
                  </div>
                </fieldset>

                <button onClick={() => save("cardGrid", cardGrid, setCardSaving, setCardSaved)} disabled={cardSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
                  {cardSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {cardSaved ? "Saved ✓" : "Save Card Grid Settings"}
                </button>
              </div>

            </div>
          )
      )}

      {/* ═══ SERVICE MODAL ═══ */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-2xl border border-zinc-700 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <h3 className="text-white font-bold text-lg">{editing ? "Edit Service" : "Add Service"}</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-zinc-400 hover:text-white" /></button>
            </div>
            <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className={labelCls}>Service Title *</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Wedding Photography" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Starting Price</label>
                  <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. 25,000" className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Short Description</label>
                <input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Full Description *</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={`${inputCls} resize-none`} />
              </div>

              {/* Cover image — only images for service tiles */}
              <MediaField
                label="Cover Image"
                url={form.coverImage}
                mediaType={form.coverImageType}
                allowedTypes={["image"]}
                onChange={(url, mediaType) => setForm({ ...form, coverImage: url, coverImageType: mediaType })}
                context="services"
                previewHeight="h-32"
              />

              {/* Gallery */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-zinc-400 text-sm font-medium">Gallery Images ({form.images.length})</label>
                  <button type="button" onClick={() => setForm({ ...form, images: [...form.images, ""] })}
                    className="text-xs px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors">+ Add Slot</button>
                </div>
                <div className="space-y-3">
                  {form.images.map((img, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <MediaField
                          label={`Image ${i + 1}`}
                          url={img}
                          mediaType="image"
                          allowedTypes={["image"]}
                          onChange={(url) => { const imgs = [...form.images]; imgs[i] = url; setForm({ ...form, images: imgs }); }}
                          context="services"
                          previewHeight="h-20"
                        />
                      </div>
                      <button type="button" onClick={() => setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) })}
                        className="mt-6 p-2 text-red-400 hover:text-red-300 shrink-0"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div>
                <label className={labelCls}>Features / Highlights</label>
                <div className="flex gap-2 mb-2">
                  <input value={newFeature} onChange={(e) => setNewFeature(e.target.value)} placeholder="e.g. Same day editing"
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none"
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (newFeature.trim()) { setForm({ ...form, features: [...form.features, newFeature.trim()] }); setNewFeature(""); } } }} />
                  <button onClick={() => { if (newFeature.trim()) { setForm({ ...form, features: [...form.features, newFeature.trim()] }); setNewFeature(""); } }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-sm font-medium">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.features.map((f, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-full border border-zinc-700">
                      {f} <button onClick={() => setForm({ ...form, features: form.features.filter((_, idx) => idx !== i) })} className="text-zinc-500 hover:text-red-400">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded" />
                <span className="text-zinc-400 text-sm">Show on website</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-zinc-800">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm text-zinc-400 hover:text-white bg-zinc-800 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.title || !form.description}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editing ? "Update Service" : "Add Service"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}