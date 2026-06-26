"use client";

import React, { useState, useEffect } from "react";
import {
  Mail, Phone, MapPin, Clock, Save, Loader2,
  Instagram, Youtube, Facebook, MessageCircle, Check, Send, Twitter,
} from "lucide-react";

interface ContactForm {
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  googleMapsEmbed: string;
  businessHours: string;
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  twitterUrl: string;
  telegramUrl: string;
}

const EMPTY: ContactForm = {
  email: "", phone: "", whatsapp: "", address: "", city: "",
  state: "", pincode: "", googleMapsEmbed: "", businessHours: "",
  instagramUrl: "", facebookUrl: "", youtubeUrl: "",
  twitterUrl: "", telegramUrl: "",
};

export default function ContactSection() {
  const [form, setForm]     = useState<ContactForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/contact")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setForm({
            email:         data.settings.email         || "",
            phone:         data.settings.phone         || "",
            whatsapp:      data.settings.whatsapp      || "",
            address:       data.settings.address       || "",
            city:          data.settings.city          || "",
            state:         data.settings.state         || "",
            pincode:       data.settings.pincode       || "",
            googleMapsEmbed: data.settings.googleMapsEmbed || "",
            businessHours: data.settings.businessHours || "",
            instagramUrl:  data.settings.instagramUrl  || "",
            facebookUrl:   data.settings.facebookUrl   || "",
            youtubeUrl:    data.settings.youtubeUrl    || "",
            twitterUrl:    data.settings.twitterUrl    || "",
            telegramUrl:   data.settings.telegramUrl   || "",
          });
        }
      })
      .catch(() => setError("Failed to load contact settings"))
      .finally(() => setLoading(false));
  }, []);

  const set = (field: keyof ContactForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save contact settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contact Details</h1>
          <p className="text-sm text-zinc-500 mt-1">
            These details appear on the contact page and power the social media sidebar across the site.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
      )}

      {/* ── Contact Info ── */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Phone className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Contact Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Email Address"   icon={<Mail           className="w-4 h-4" />} value={form.email}         onChange={set("email")}         placeholder="studio@example.com"    type="email" />
          <Field label="Phone Number"    icon={<Phone          className="w-4 h-4" />} value={form.phone}         onChange={set("phone")}         placeholder="+91 98765 43210" />
          <Field label="WhatsApp Number" icon={<MessageCircle  className="w-4 h-4" />} value={form.whatsapp}      onChange={set("whatsapp")}      placeholder="+91 98765 43210" />
          <Field label="Business Hours"  icon={<Clock          className="w-4 h-4" />} value={form.businessHours} onChange={set("businessHours")} placeholder="Mon – Sat: 9 AM – 7 PM" />
        </div>
      </div>

      {/* ── Address ── */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Studio Address</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Field label="Street Address" icon={<MapPin className="w-4 h-4" />} value={form.address} onChange={set("address")} placeholder="Street, Area" />
          </div>
          <Field label="City"     icon={<MapPin className="w-4 h-4" />} value={form.city}    onChange={set("city")}    placeholder="Madurai" />
          <Field label="State"    icon={<MapPin className="w-4 h-4" />} value={form.state}   onChange={set("state")}   placeholder="Tamil Nadu" />
          <Field label="PIN Code" icon={<MapPin className="w-4 h-4" />} value={form.pincode} onChange={set("pincode")} placeholder="625016" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">Google Maps Embed URL (optional)</label>
          <textarea
            value={form.googleMapsEmbed}
            onChange={set("googleMapsEmbed")}
            rows={2}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 resize-none"
            placeholder="https://www.google.com/maps/embed?pb=..."
          />
          <p className="text-xs text-zinc-600 mt-1">Paste the embed src URL from Google Maps → Share → Embed a map</p>
        </div>
      </div>

      {/* ── Social Links ── */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Instagram className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Social Media Links</h3>
        </div>
        <p className="text-xs text-zinc-600 -mt-2">
          These links power the floating social sidebar shown on every page of the site. Fill in only the platforms you use.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="WhatsApp"  icon={<MessageCircle className="w-4 h-4" />} value={form.whatsapp}     onChange={set("whatsapp")}     placeholder="+91 98765 43210" />
          <Field label="Instagram" icon={<Instagram     className="w-4 h-4" />} value={form.instagramUrl} onChange={set("instagramUrl")} placeholder="https://instagram.com/yourprofile" />
          <Field label="X / Twitter" icon={<Twitter    className="w-4 h-4" />} value={form.twitterUrl}   onChange={set("twitterUrl")}   placeholder="https://x.com/yourhandle" />
          <Field label="Telegram"  icon={<Send         className="w-4 h-4" />} value={form.telegramUrl}  onChange={set("telegramUrl")}  placeholder="https://t.me/yourchannel" />
          <Field label="Facebook"  icon={<Facebook     className="w-4 h-4" />} value={form.facebookUrl}  onChange={set("facebookUrl")}  placeholder="https://facebook.com/yourpage" />
          <Field label="YouTube"   icon={<Youtube      className="w-4 h-4" />} value={form.youtubeUrl}   onChange={set("youtubeUrl")}   placeholder="https://youtube.com/@yourchannel" />
        </div>
      </div>

      {/* Live preview */}
      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4">Preview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-zinc-600 text-xs uppercase tracking-widest mb-1">Email</p>
            <p className="text-white">{form.email || "—"}</p>
          </div>
          <div>
            <p className="text-zinc-600 text-xs uppercase tracking-widest mb-1">Phone</p>
            <p className="text-white">{form.phone || "—"}</p>
          </div>
          <div>
            <p className="text-zinc-600 text-xs uppercase tracking-widest mb-1">Address</p>
            <p className="text-white">
              {[form.address, form.city, form.state, form.pincode].filter(Boolean).join(", ") || "—"}
            </p>
          </div>
        </div>

        {/* Social sidebar preview */}
        <div className="mt-6 pt-4 border-t border-zinc-800">
          <p className="text-zinc-600 text-xs uppercase tracking-widest mb-3">Sidebar Icons (configured)</p>
          <div className="flex gap-3 flex-wrap">
            {[
              { label: "WhatsApp",  val: form.whatsapp,     color: "#25D366" },
              { label: "Instagram", val: form.instagramUrl, color: "#E1306C" },
              { label: "Twitter",   val: form.twitterUrl,   color: "#ffffff" },
              { label: "Telegram",  val: form.telegramUrl,  color: "#26A5E4" },
            ]
              .filter((s) => s.val)
              .map((s) => (
                <span
                  key={s.label}
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: s.color + "22", color: s.color, border: `1px solid ${s.color}55` }}
                >
                  {s.label} ✓
                </span>
              ))}
            {![form.whatsapp, form.instagramUrl, form.twitterUrl, form.telegramUrl].some(Boolean) && (
              <span className="text-zinc-600 text-xs">No sidebar icons configured yet.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, icon, value, onChange, placeholder, type = "text",
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-400 mb-2">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
        />
      </div>
    </div>
  );
}
