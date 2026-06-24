"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const DEFAULTS = {
  email: "kuttistoryphotography@gmail.com",
  phone: "+91 82489 51574",
  whatsapp: "+91 82489 51574",
  address: "Periyar",
  city: "Madurai",
  state: "Tamil Nadu",
  pincode: "625016",
  mapEmbedUrl: "",
  businessHours: "Mon – Sat: 9 AM – 7 PM",
  instagramUrl: "",
  facebookUrl: "",
  youtubeUrl: "",
};

const ContactPage = () => {
  const infoRef = useRef(null);
  const [contact, setContact] = useState(DEFAULTS);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", category: "Wedding Shoot", date: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState("");

  useEffect(() => {
    fetch("/api/contact")
      .then((r) => r.json())
      .then((data) => { if (data.settings) setContact({ ...DEFAULTS, ...data.settings }); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power4.out", duration: 1.2 } });
    tl.fromTo(".contact-title", { opacity: 0, y: 30 }, { opacity: 1, y: 0 })
      .fromTo(".info-item", { opacity: 0, x: -20 }, { opacity: 1, x: 0, stagger: 0.15 }, "-=0.8")
      .fromTo(".contact-form", { opacity: 0, y: 40 }, { opacity: 1, y: 0 }, "-=1");
  }, []);

  const fullAddress = [contact.address, contact.city, contact.state, contact.pincode].filter(Boolean).join(", ");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setSendError("");
    try {
      // Send via WhatsApp / email — using simple mailto fallback
      const subject = encodeURIComponent(`Photography Inquiry – ${form.category}`);
      const body = encodeURIComponent(
        `Name: ${form.firstName} ${form.lastName}\nEmail: ${form.email}\nCategory: ${form.category}\nDate: ${form.date}\n\nMessage:\n${form.message}`
      );
      window.open(`mailto:${contact.email}?subject=${subject}&body=${body}`, "_blank");
      setSent(true);
      setForm({ firstName: "", lastName: "", email: "", category: "Wedding Shoot", date: "", message: "" });
    } catch {
      setSendError("Something went wrong. Please email us directly.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="bg-black text-white py-16 md:py-32 px-4 sm:px-6 md:px-16 min-h-screen flex items-center overflow-hidden">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

        {/* ── LEFT: INFO ── */}
        <div ref={infoRef} className="space-y-12 relative z-10">
          <div className="contact-title">
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-extrabold tracking-tighter leading-tight mb-6">
              Get in — <br /> <span className="text-orange-500">touch</span>
            </h1>
            <p className="text-zinc-400 text-lg max-w-md leading-relaxed">
              Based in {contact.city || "Madurai"}. Let's turn your vision into a visual masterpiece.
            </p>
          </div>

          <div className="space-y-8">
            {/* Email */}
            <div className="info-item group cursor-pointer">
              <p className="text-[10px] uppercase tracking-[0.3em] text-orange-500 font-bold mb-2">Email Us</p>
              <a href={`mailto:${contact.email}`} className="text-lg md:text-xl font-medium group-hover:text-orange-400 transition-colors duration-300">
                {contact.email}
              </a>
            </div>

            {/* Phone */}
            <div className="info-item group cursor-pointer">
              <p className="text-[10px] uppercase tracking-[0.3em] text-orange-500 font-bold mb-2">Call Anytime</p>
              <a href={`tel:${contact.phone.replace(/\s+/g, "")}`} className="text-lg md:text-xl font-medium group-hover:text-orange-400 transition-colors duration-300">
                {contact.phone}
              </a>
            </div>

            {/* WhatsApp */}
            {contact.whatsapp && (
              <div className="info-item group cursor-pointer">
                <p className="text-[10px] uppercase tracking-[0.3em] text-orange-500 font-bold mb-2">WhatsApp</p>
                <a
                  href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg md:text-xl font-medium group-hover:text-orange-400 transition-colors duration-300"
                >
                  {contact.whatsapp}
                </a>
              </div>
            )}

            {/* Address */}
            {fullAddress && (
              <div className="info-item">
                <p className="text-[10px] uppercase tracking-[0.3em] text-orange-500 font-bold mb-2">Visit Studio</p>
                <p className="text-lg md:text-xl font-medium text-zinc-200">{fullAddress}</p>
              </div>
            )}

            {/* Hours */}
            {contact.businessHours && (
              <div className="info-item">
                <p className="text-[10px] uppercase tracking-[0.3em] text-orange-500 font-bold mb-2">Business Hours</p>
                <p className="text-lg font-medium text-zinc-200">{contact.businessHours}</p>
              </div>
            )}

            {/* Social links */}
            {(contact.instagramUrl || contact.facebookUrl || contact.youtubeUrl) && (
              <div className="info-item flex gap-4 pt-2">
                {contact.instagramUrl && (
                  <a href={contact.instagramUrl} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-orange-500 flex items-center justify-center transition-colors group">
                    <svg className="w-5 h-5 text-zinc-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                )}
                {contact.facebookUrl && (
                  <a href={contact.facebookUrl} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-orange-500 flex items-center justify-center transition-colors group">
                    <svg className="w-5 h-5 text-zinc-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                )}
                {contact.youtubeUrl && (
                  <a href={contact.youtubeUrl} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-orange-500 flex items-center justify-center transition-colors group">
                    <svg className="w-5 h-5 text-zinc-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Map */}
          {contact.mapEmbedUrl && (
            <div className="info-item rounded-2xl overflow-hidden border border-zinc-800 h-48">
              <iframe
                src={contact.mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
        </div>

        {/* ── RIGHT: FORM ── */}
        <div className="contact-form relative">
          <div className="absolute -inset-10 bg-orange-500/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative bg-zinc-900/40 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] border border-zinc-800 shadow-2xl">
            {sent ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold">Message Sent!</h3>
                <p className="text-zinc-400">We'll get back to you within 24 hours.</p>
                <button onClick={() => setSent(false)} className="mt-4 px-6 py-2 border border-zinc-700 rounded-full text-sm hover:border-orange-500 transition-colors">
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">First Name</label>
                  <input suppressHydrationWarning required value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                    type="text" placeholder="John"
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Last Name</label>
                  <input suppressHydrationWarning required value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                    type="text" placeholder="Doe"
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors" />
                </div>
                <div className="col-span-full space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Email Address</label>
                  <input suppressHydrationWarning required value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    type="email" placeholder={`hello@${(contact.city || "studio").toLowerCase()}.com`}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Event Category</label>
                  <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none">
                    <option className="bg-zinc-900">Wedding Shoot</option>
                    <option className="bg-zinc-900">Pre Wedding</option>
                    <option className="bg-zinc-900">Outdoor Portrait</option>
                    <option className="bg-zinc-900">Baby / Kids Shoot</option>
                    <option className="bg-zinc-900">Commercial / Ad</option>
                    <option className="bg-zinc-900">Corporate Event</option>
                    <option className="bg-zinc-900">Food Photography</option>
                    <option className="bg-zinc-900">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Proposed Date</label>
                  <input suppressHydrationWarning value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                    type="date"
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors" />
                </div>
                <div className="col-span-full space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Tell us your story</label>
                  <textarea required rows={4} value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                    placeholder="How can we help make your moments special?"
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors resize-none" />
                </div>
                {sendError && (
                  <div className="col-span-full text-red-400 text-sm">{sendError}</div>
                )}
                <div className="col-span-full pt-2">
                  <button type="submit" disabled={sending}
                    className="w-full md:w-auto flex items-center justify-center gap-4 bg-white text-black px-10 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-orange-500 hover:text-white transition-all duration-300 group disabled:opacity-60">
                    {sending ? "Sending…" : "Send Message"}
                    {!sending && <span className="bg-black text-white rounded-full w-6 h-6 flex items-center justify-center group-hover:translate-x-1 group-hover:bg-white group-hover:text-black transition-all">→</span>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactPage;
