
"use client";

import { useEffect, useState } from "react";

type SharedQuotation = {
  id: string;
  quoteNumber: string;
  clientName: string;
  clientEmail: string;
  title: string;
  status: string;
  linkRevoked: boolean;
  createdAt: string;
  clientUrl: string | null;
};

type QuotationDesign = {
  brandName: string;
  tagline: string;
  logoUrl: string;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  fontFamily: string;
};

const defaultQuotationDesign: QuotationDesign = {
  brandName: "Kutti Story Photography",
  tagline: "Capturing Life, One Story at a Time.",
  logoUrl: "",
  backgroundColor: "#f5f1e9",
  accentColor: "#c6a66b",
  textColor: "#242424",
  fontFamily: "serif",
};

type Service = {
  name: string;
  description: string;
  quantity: string;
  price: string;
};

type EventItem = {
  eventName: string;
  eventDate: string;
  venue: string;
  services: Service[];
};

const emptyService = (): Service => ({
  name: "",
  description: "",
  quantity: "1",
  price: "",
});

const emptyEvent = (): EventItem => ({
  eventName: "",
  eventDate: "",
  venue: "",
  services: [emptyService()],
});

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500";

const labelClass = "block text-sm font-medium text-zinc-300";

export default function QuotationBuilderSection() {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [title, setTitle] = useState("Wedding Photography Package");
  const [introduction, setIntroduction] = useState("");
  const [pageDesign, setPageDesign] =
  useState<QuotationDesign>(defaultQuotationDesign);
  const [events, setEvents] = useState<EventItem[]>([emptyEvent()]);
  const [deliverablesText, setDeliverablesText] = useState(
    "Edited photographs\nCinematic wedding video\nPremium wedding album"
  );
  const [discount, setDiscount] = useState("0");
  const [validityDate, setValidityDate] = useState("");
  const [paymentTermsText, setPaymentTermsText] = useState(
    "50% advance to confirm the booking\nRemaining balance as agreed before delivery"
  );
  const [termsText, setTermsText] = useState(
    "Booking is confirmed after advance payment.\nDeliverables will be provided as agreed in the quotation."
  );
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [quoteNumber, setQuoteNumber] = useState("");
  const [quotationUrl, setQuotationUrl] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"generate" | "shared">("generate");
  const [sharedLinks, setSharedLinks] = useState<SharedQuotation[]>([]);
  const [sharedLoading, setSharedLoading] = useState(false);
  const [sharedError, setSharedError] = useState("");
  const [sharedMessage, setSharedMessage] = useState("");
  const [actionId, setActionId] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState("");

  const subtotal = events.reduce(
    (eventTotal, event) =>
        eventTotal +
        event.services.reduce(
        (serviceTotal, service) =>
            serviceTotal +
            Math.max(0, Number(service.quantity) || 0) *
            Math.max(0, Number(service.price) || 0),
        0
        ),
    0
    );

  const discountAmount = Math.min(
    subtotal,
    Math.max(0, Number(discount) || 0)
  );

  const total = subtotal - discountAmount;

  function updateEvent(
    eventIndex: number,
    field: keyof EventItem,
    value: string
  ) {
    setEvents((current) =>
      current.map((event, index) =>
        index === eventIndex ? { ...event, [field]: value } : event
      )
    );
  }

  function updateService(
    eventIndex: number,
    serviceIndex: number,
    field: keyof Service,
    value: string
  ) {
    setEvents((current) =>
      current.map((event, index) =>
        index !== eventIndex
          ? event
          : {
              ...event,
              services: event.services.map((service, index) =>
                index === serviceIndex
                  ? { ...service, [field]: value }
                  : service
              ),
            }
      )
    );
  }

  function addEvent() {
    setEvents((current) => [...current, emptyEvent()]);
  }

  function removeEvent(eventIndex: number) {
    setEvents((current) =>
      current.filter((_, index) => index !== eventIndex)
    );
  }

  function addService(eventIndex: number) {
    setEvents((current) =>
      current.map((event, index) =>
        index === eventIndex
          ? { ...event, services: [...event.services, emptyService()] }
          : event
      )
    );
  }

  function removeService(eventIndex: number, serviceIndex: number) {
    setEvents((current) =>
      current.map((event, index) =>
        index === eventIndex
          ? {
              ...event,
              services: event.services.filter(
                (_, index) => index !== serviceIndex
              ),
            }
          : event
      )
    );
  }

  async function loadSharedLinks() {
    setSharedLoading(true);
    setSharedError("");
    try {
      const response = await fetch("/api/quotation-proposals", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to load quotations.");
      }
      setSharedLinks(Array.isArray(result.proposals) ? result.proposals : []);
    } catch (err) {
      setSharedError(err instanceof Error ? err.message : "Unable to load quotations.");
    } finally {
      setSharedLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === "shared") void loadSharedLinks();
  }, [activeTab]);

  async function updateLink(id: string, action: "revoke" | "restore") {
    setActionId(id);
    setSharedError("");
    setSharedMessage("");
    try {
      const response = await fetch(`/api/quotation-proposals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to update the link.");
      }
      setSharedMessage(result.message || "Link updated.");
      await loadSharedLinks();
    } catch (err) {
      setSharedError(err instanceof Error ? err.message : "Unable to update the link.");
    } finally {
      setActionId("");
    }
  }

  async function deleteQuotation(id: string, name: string) {
    if (!window.confirm(`Permanently delete the quotation for ${name || "this client"}? This cannot be undone.`)) return;
    setActionId(id);
    setSharedError("");
    setSharedMessage("");
    try {
      const response = await fetch(`/api/quotation-proposals/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to delete quotation.");
      }
      setSharedMessage("Quotation deleted successfully.");
      await loadSharedLinks();
    } catch (err) {
      setSharedError(err instanceof Error ? err.message : "Unable to delete quotation.");
    } finally {
      setActionId("");
    }
  }

  async function copySharedLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setSharedMessage("Quotation link copied!");
      setSharedError("");
    } catch {
      setSharedError("Copy failed. Please select and copy the link manually.");
    }
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setLogoUploadError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setLogoUploadError("Logo image must be 5 MB or smaller.");
      return;
    }

    setLogoUploading(true);
    setLogoUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("context", "quote");
      formData.append("label", "Quotation Brand Logo");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const responseText = await response.text();

      let result: {
        success?: boolean;
        url?: string;
        error?: string;
        errors?: { error?: string }[];
      };

      try {
        result = JSON.parse(responseText);
      } catch {
        console.error("Logo upload returned HTML:", responseText);
        throw new Error(
          `Upload failed (HTTP ${response.status}). Check the /api/upload endpoint and terminal error.`
        );
      }

      if (!response.ok || !result.success || !result.url) {
        throw new Error(
          result.error || result.errors?.[0]?.error || "Logo upload failed."
        );
      }

      if (!result.url) {
        throw new Error("Logo upload succeeded, but no image URL was returned.");
      }

      setPageDesign((current) => ({
        ...current,
        logoUrl: result.url!,
      }));
      
    } catch (error) {
      setLogoUploadError(
        error instanceof Error ? error.message : "Unable to upload the logo."
      );
    } finally {
      setLogoUploading(false);
    }
  }

  async function saveQuotation() {
    setError("");
    
    setQuoteNumber("");

    if (
       !clientName.trim() ||
       !clientEmail.trim() ||
       !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim()) ||
       !title.trim()
    ) {
      setError("Please enter a valid client email, client name, and quotation title.");
      return;
    }

    if (
      events.length === 0 ||
      events.some(
        (event) =>
          !event.eventName.trim() ||
          event.services.length === 0 ||
          event.services.some(
            (service) =>
              !service.name.trim() ||
              service.price.trim() === "" ||
              !Number.isFinite(Number(service.price)) ||
              Number(service.price) < 0
          )
      )
    ) {
      setError(
        "Each event needs a name and at least one service with a valid price."
      );
      return;
    }

    const payload = {
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      clientPhone: clientPhone.trim(),
      title: title.trim(),
      introduction: introduction.trim(),
      
        pageDesign: {
        ...pageDesign,
        sections: [
            {
            id: "hero",
            type: "hero",
            visible: true,
            title: title.trim() || "Your Wedding Story",
            subtitle: pageDesign.tagline,
            body: introduction.trim(),
            layout: "cover",
            backgroundColor: pageDesign.backgroundColor,
            textColor: pageDesign.textColor,
            images: [],
            },
            {
            id: "story",
            type: "story",
            visible: true,
            title: "Your Story, Beautifully Told",
            subtitle: "A celebration of your journey",
            body: introduction.trim(),
            layout: "centered",
            backgroundColor: pageDesign.backgroundColor,
            textColor: pageDesign.textColor,
            images: [],
            },
            {
            id: "gallery",
            type: "gallery",
            visible: true,
            title: "Stories Through Our Lens",
            subtitle: "A glimpse into our visual storytelling",
            body: "",
            layout: "masonry",
            backgroundColor: "#ffffff",
            textColor: pageDesign.textColor,
            images: [],
            },
            {
            id: "events",
            type: "event",
            visible: true,
            title: "Your Wedding Celebrations",
            subtitle: "Every moment, thoughtfully captured",
            body: "",
            layout: "cards",
            backgroundColor: pageDesign.backgroundColor,
            textColor: pageDesign.textColor,
            images: [],
            },
            {
            id: "services",
            type: "services",
            visible: true,
            title: "Photography & Cinematic Films",
            subtitle: "Coverage tailored to your celebration",
            body: "",
            layout: "cards",
            backgroundColor: "#ffffff",
            textColor: pageDesign.textColor,
            images: [],
            },
            {
            id: "deliverables",
            type: "deliverables",
            visible: true,
            title: "Your Memories, Preserved",
            subtitle: "The final collection you'll receive",
            body: "",
            layout: "grid",
            backgroundColor: pageDesign.backgroundColor,
            textColor: pageDesign.textColor,
            images: [],
            },
            {
            id: "pricing",
            type: "pricing",
            visible: true,
            title: "Your Investment",
            subtitle: "A clear overview of your collection",
            body: "",
            layout: "premium-card",
            backgroundColor: "#242424",
            textColor: "#ffffff",
            images: [],
            },
            {
            id: "payment",
            type: "payment_terms",
            visible: true,
            title: "Payment Schedule",
            subtitle: "A simple plan for your booking",
            body: "",
            layout: "timeline",
            backgroundColor: "#ffffff",
            textColor: pageDesign.textColor,
            images: [],
            },
            {
            id: "terms",
            type: "terms",
            visible: true,
            title: "Booking Details",
            subtitle: "Important information about your proposal",
            body: "",
            layout: "default",
            backgroundColor: pageDesign.backgroundColor,
            textColor: pageDesign.textColor,
            images: [],
            },
            {
            id: "closing",
            type: "closing",
            visible: true,
            title: "Let's Tell Your Story",
            subtitle: "We would love to be part of your celebration",
            body: "Thank you for considering Kutti Story Photography. We look forward to preserving your most meaningful moments.",
            layout: "centered",
            backgroundColor: "#242424",
            textColor: "#ffffff",
            images: [],
            },
        ],
        },

      events: events.map((event) => ({
        eventName: event.eventName.trim(),
        eventDate: event.eventDate || undefined,
        venue: event.venue.trim(),
        services: event.services.map((service) => ({
            name: service.name.trim(),
            description: service.description.trim(),
            quantity: Number(service.quantity),
            unitPrice: Number(service.price),
        })),
        })),
      deliverables: deliverablesText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      subtotal,
      discount: discountAmount,
      totalAmount: total,
      paymentTerms: paymentTermsText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((label) => ({ label })),
      termsAndConditions: termsText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      validityDate: validityDate || undefined,
      status,
    };

    setSaving(true);

    try {
      const response = await fetch("/api/quotation-proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
            result.error || result.message || "Unable to save quotation."
        );
      }
      
      setQuoteNumber(result.proposal?.quoteNumber || "");

      const generatedUrl = result.proposal?.clientUrl || "";
      setQuotationUrl(generatedUrl);
      setCopyMessage("");
      if (status === "published") void loadSharedLinks();

      if (status === "published" && !generatedUrl) {
        setError(
          "Quotation saved, but no client link was returned. Please check the publish API."
        );
      }

    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 text-white">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-400">
          Kutti Story Photography
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Quotation Builder</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Create a professional quotation and share it with your client.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-2">
        <button
          type="button"
          onClick={() => setActiveTab("generate")}
          className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${activeTab === "generate" ? "bg-amber-500 text-black" : "text-zinc-300 hover:bg-zinc-800"}`}
        >
          + Generate Link
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("shared")}
          className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${activeTab === "shared" ? "bg-amber-500 text-black" : "text-zinc-300 hover:bg-zinc-800"}`}
        >
          Shared Links ({sharedLinks.length})
        </button>
      </div>

      {activeTab === "generate" ? (
        <>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {quoteNumber && (
        <div className="space-y-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="font-medium text-emerald-300">
            Quotation saved: {quoteNumber}
          </p>

          {quotationUrl ? (
            <div className="space-y-3">
              <label className="block text-sm text-zinc-300">
                Client quotation link
                <input
                  readOnly
                  value={quotationUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(quotationUrl);
                      setCopyMessage("Link copied successfully!");
                    } catch {
                      setCopyMessage("Copy failed. Select and copy the link above.");
                    }
                  }}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400"
                >
                  Copy Link
                </button>

                <a
                  href={quotationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Preview Quotation
                </a>
              </div>

              {copyMessage && (
                <p className="text-sm text-emerald-300" role="status">
                  {copyMessage}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-300">
              This quotation is saved as a draft. Publish it to generate a client link.
            </p>
          )}
        </div>
      )}

<section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Client Details</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Client name *
            <input
              className={inputClass}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Client full name"
            />
          </label>
          <label className={labelClass}>
            Client email
            <input
              type="email"
              className={inputClass}
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="client@example.com"
            />
          </label>
          <label className={labelClass}>
            Client phone
            <input
              type="tel"
              className={inputClass}
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="Phone number"
            />
          </label>
          <label className={labelClass}>
            Quotation title *
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Wedding Photography Package"
            />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Introduction
            <textarea
              className={inputClass}
              rows={3}
              value={introduction}
              onChange={(e) => setIntroduction(e.target.value)}
              placeholder="A short personalized message for your client"
            />
          </label>
        </div>
      </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Design & Branding</h2>
        <p className="mt-1 text-sm text-zinc-400">
            Customize the appearance of your client quotation page.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
            Brand name
            <input
                className={inputClass}
                value={pageDesign.brandName}
                onChange={(e) =>
                setPageDesign((current) => ({
                    ...current,
                    brandName: e.target.value,
                }))
                }
                maxLength={150}
                placeholder="Kutti Story Photography"
            />
            </label>

            <label className={labelClass}>
            Tagline
            <input
                className={inputClass}
                value={pageDesign.tagline}
                onChange={(e) =>
                setPageDesign((current) => ({
                    ...current,
                    tagline: e.target.value,
                }))
                }
                maxLength={250}
                placeholder="Your brand tagline"
            />
            </label>

            <label className={labelClass}>
            Logo image URL
            <input
                type="url"
                className={inputClass}
                value={pageDesign.logoUrl}
                onChange={(e) =>
                setPageDesign((current) => ({
                    ...current,
                    logoUrl: e.target.value,
                }))
                }
                placeholder="https://..."
            />
            </label>

            <div className="sm:col-span-2">
              <label className={labelClass}>
                Upload logo from your computer
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={logoUploading}
                  className="mt-2 block w-full text-sm text-zinc-300 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-500 file:px-4 file:py-2 file:font-semibold file:text-black hover:file:bg-amber-400 disabled:opacity-50"
                />
              </label>
              <p className="mt-1 text-xs text-zinc-500">PNG, JPG, WEBP or another image format. Maximum 5 MB.</p>
              {logoUploading && <p className="mt-2 text-sm text-amber-300">Uploading logo...</p>}
              {logoUploadError && <p role="alert" className="mt-2 text-sm text-red-400">{logoUploadError}</p>}
              {pageDesign.logoUrl && (
                <img
                  src={pageDesign.logoUrl}
                  alt="Quotation logo preview"
                  className="mt-3 max-h-24 max-w-48 rounded-lg border border-zinc-700 bg-white p-2 object-contain"
                />
              )}
            </div>

            <label className={labelClass}>
            Font style
            <select
                className={inputClass}
                value={pageDesign.fontFamily}
                onChange={(e) =>
                setPageDesign((current) => ({
                    ...current,
                    fontFamily: e.target.value,
                }))
                }
            >
                <option value="serif">Elegant serif</option>
                <option value="sans-serif">Modern sans-serif</option>
                <option value="Georgia, serif">Classic Georgia</option>
            </select>
            </label>

            <label className={labelClass}>
            Background color
            <div className="mt-1 flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900 p-2">
                <input
                type="color"
                className="h-10 w-12 cursor-pointer rounded"
                value={pageDesign.backgroundColor}
                onChange={(e) =>
                    setPageDesign((current) => ({
                    ...current,
                    backgroundColor: e.target.value,
                    }))
                }
                />
                <span className="text-sm">{pageDesign.backgroundColor}</span>
            </div>
            </label>

            <label className={labelClass}>
            Accent color
            <div className="mt-1 flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900 p-2">
                <input
                type="color"
                className="h-10 w-12 cursor-pointer rounded"
                value={pageDesign.accentColor}
                onChange={(e) =>
                    setPageDesign((current) => ({
                    ...current,
                    accentColor: e.target.value,
                    }))
                }
                />
                <span className="text-sm">{pageDesign.accentColor}</span>
            </div>
            </label>

            <label className={labelClass}>
            Text color
            <div className="mt-1 flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900 p-2">
                <input
                type="color"
                className="h-10 w-12 cursor-pointer rounded"
                value={pageDesign.textColor}
                onChange={(e) =>
                    setPageDesign((current) => ({
                    ...current,
                    textColor: e.target.value,
                    }))
                }
                />
                <span className="text-sm">{pageDesign.textColor}</span>
            </div>
            </label>
        </div>

        <div
            className="mt-6 rounded-xl border p-5"
            style={{
            backgroundColor: pageDesign.backgroundColor,
            color: pageDesign.textColor,
            fontFamily: pageDesign.fontFamily,
            borderColor: pageDesign.accentColor,
            }}
        >
            <p className="text-xs uppercase tracking-[0.25em]">
            Quotation preview
            </p>
            {pageDesign.logoUrl && (
              <img
                src={pageDesign.logoUrl}
                alt={`${pageDesign.brandName || "Brand"} logo`}
                className="mb-4 mt-3 max-h-20 max-w-48 object-contain"
              />
            )}
            <h3 className="mt-3 text-2xl font-semibold">
            {pageDesign.brandName || "Your Brand Name"}
            </h3>
            <p className="mt-2 text-sm">{pageDesign.tagline}</p>
            <div
            className="mt-4 h-1 w-20 rounded"
            style={{ backgroundColor: pageDesign.accentColor }}
            />
        </div>
        </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Events & Services</h2>
          <button
            type="button"
            onClick={addEvent}
            className="rounded-lg border border-amber-500/40 px-4 py-2 text-sm font-medium text-amber-300 hover:bg-amber-500/10"
          >
            + Add Event
          </button>
        </div>

        {events.map((event, eventIndex) => (
          <div
            key={eventIndex}
            className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Event {eventIndex + 1}</h3>
              {events.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEvent(eventIndex)}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Remove event
                </button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className={labelClass}>
                Event name *
                <input
                  className={inputClass}
                  value={event.eventName}
                  onChange={(e) =>
                    updateEvent(eventIndex, "eventName", e.target.value)
                  }
                  placeholder="Wedding / Reception"
                />
              </label>
              <label className={labelClass}>
                Event date
                <input
                  type="date"
                  className={inputClass}
                  value={event.eventDate}
                  onChange={(e) =>
                    updateEvent(eventIndex, "eventDate", e.target.value)
                  }
                />
              </label>
              <label className={labelClass}>
                Venue
                <input
                  className={inputClass}
                  value={event.venue}
                  onChange={(e) =>
                    updateEvent(eventIndex, "venue", e.target.value)
                  }
                  placeholder="Event venue"
                />
              </label>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-zinc-200">Services</h4>

              {event.services.map((service, serviceIndex) => (
                <div
                  key={serviceIndex}
                  className="grid gap-3 rounded-lg border border-zinc-800 p-4 sm:grid-cols-4"
                >
                  <label className={labelClass}>
                    Service name *
                    <input
                      className={inputClass}
                      value={service.name}
                      onChange={(e) =>
                        updateService(
                          eventIndex,
                          serviceIndex,
                          "name",
                          e.target.value
                        )
                      }
                      placeholder="Traditional Photography"
                    />
                  </label>
                  <label className={labelClass}>
                    Description
                    <input
                      className={inputClass}
                      value={service.description}
                      onChange={(e) =>
                        updateService(
                          eventIndex,
                          serviceIndex,
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="Coverage details"
                    />
                  </label>
                  
                <label className={labelClass}>
                Quantity *
                <input
                    type="number"
                    min="1"
                    max="10000"
                    step="1"
                    className={inputClass}
                    value={service.quantity}
                    onChange={(e) =>
                    updateService(
                        eventIndex,
                        serviceIndex,
                        "quantity",
                        e.target.value
                    )
                    }
                    placeholder="1"
                />
                </label>

                  <label className={labelClass}>
                    Price ($) *
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className={inputClass}
                      value={service.price}
                      onChange={(e) =>
                        updateService(
                          eventIndex,
                          serviceIndex,
                          "price",
                          e.target.value
                        )
                      }
                      placeholder="15000"
                    />
                  </label>

                  {event.services.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeService(eventIndex, serviceIndex)}
                      className="text-left text-sm text-red-400 sm:col-span-3"
                    >
                      Remove service
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => addService(eventIndex)}
                className="text-sm font-medium text-amber-300 hover:text-amber-200"
              >
                + Add service
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Deliverables & Terms</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Enter one item per line.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Deliverables
            <textarea
              className={inputClass}
              rows={5}
              value={deliverablesText}
              onChange={(e) => setDeliverablesText(e.target.value)}
            />
          </label>
          <label className={labelClass}>
            Payment terms
            <textarea
              className={inputClass}
              rows={5}
              value={paymentTermsText}
              onChange={(e) => setPaymentTermsText(e.target.value)}
            />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Terms & conditions
            <textarea
              className={inputClass}
              rows={4}
              value={termsText}
              onChange={(e) => setTermsText(e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Pricing Summary</h2>

        <div className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between gap-4 text-zinc-300">
            <span>Subtotal</span>
            <span>${subtotal.toLocaleString("en-IN")}</span>
          </div>

          <label className={`${labelClass} block max-w-xs`}>
            Discount ($)
            <input
              type="number"
              min="0"
              step="1"
              className={inputClass}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </label>

          <div className="flex justify-between gap-4 border-t border-zinc-700 pt-4 text-xl font-bold">
            <span>Total</span>
            <span className="text-amber-400">
              ${total.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <label className={`${labelClass} mt-5 block max-w-xs`}>
          Quotation validity date
          <input
            type="date"
            className={inputClass}
            value={validityDate}
            onChange={(e) => setValidityDate(e.target.value)}
          />
        </label>

        <label className={`${labelClass} mt-5 block max-w-xs`}>
          Save as
          <select
            className={inputClass}
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "draft" | "published")
            }
          >
            <option value="draft">Draft â€” Admin only</option>
            <option value="published">Published â€” Client link</option>
          </select>
        </label>

        <button
          type="button"
          onClick={saveQuotation}
          disabled={saving}
          className="mt-6 w-full rounded-xl bg-amber-500 px-5 py-3 font-semibold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {saving
            ? status === "published"
              ? "Generating quotation link..."
              : "Saving draft..."
            : status === "published"
              ? "Generate Quotation Link"
              : "Save Draft"}
        </button>

      </section>
        </>
      ) : (
        <section className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Shared Quotations</h2>
              <p className="mt-1 text-sm text-zinc-400">Manage your quotation links and client proposals.</p>
            </div>
            <button
              type="button"
              onClick={() => void loadSharedLinks()}
              disabled={sharedLoading}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800 disabled:opacity-50"
            >
              {sharedLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {sharedError && <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{sharedError}</p>}
          {sharedMessage && <p role="status" className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-300">{sharedMessage}</p>}

          {sharedLoading && sharedLinks.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-400">Loading quotations...</p>
          ) : sharedLinks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-700 p-8 text-center">
              <p className="font-medium">No quotations found</p>
              <p className="mt-2 text-sm text-zinc-400">Generate your first quotation to see it here.</p>
              <button type="button" onClick={() => setActiveTab("generate")} className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black">Generate Quotation</button>
            </div>
          ) : (
            <div className="space-y-4">
              {sharedLinks.map((quotation) => {
                const revoked = quotation.linkRevoked === true;
                const published = quotation.status === "published";
                return (
                  <article key={quotation.id} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold">{quotation.clientName || "Unnamed client"}</h3>
                        <p className="mt-1 text-sm text-zinc-400">{quotation.quoteNumber} · {quotation.title}</p>
                        <p className="mt-1 text-xs text-zinc-500">{quotation.clientEmail}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${revoked ? "bg-red-500/10 text-red-300" : published ? "bg-emerald-500/10 text-emerald-300" : "bg-zinc-800 text-zinc-300"}`}>
                        {revoked ? "Revoked" : published ? "Published" : quotation.status}
                      </span>
                    </div>

                    {quotation.clientUrl && (
                      <div className="mt-4">
                        <input readOnly value={quotation.clientUrl} aria-label={`Quotation link for ${quotation.clientName}`} onFocus={(e) => e.currentTarget.select()} className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300" />
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" onClick={() => void copySharedLink(quotation.clientUrl!)} className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-black hover:bg-amber-400">Copy Link</button>
                          <a href={`https://wa.me/?text=${encodeURIComponent(`Hello ${quotation.clientName}, here is your quotation from Kutti Story Photography: ${quotation.clientUrl}`)}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-800">Share on WhatsApp</a>
                          <a href={quotation.clientUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-800">Preview</a>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
                      {published && (
                        <button type="button" disabled={actionId === quotation.id} onClick={() => void updateLink(quotation.id, revoked ? "restore" : "revoke")} className="rounded-lg border border-amber-500/40 px-3 py-2 text-sm text-amber-300 hover:bg-amber-500/10 disabled:opacity-50">
                          {actionId === quotation.id ? "Please wait..." : revoked ? "Restore Link" : "Revoke Link"}
                        </button>
                      )}
                      <button type="button" disabled={actionId === quotation.id} onClick={() => void deleteQuotation(quotation.id, quotation.clientName)} className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50">Delete</button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
