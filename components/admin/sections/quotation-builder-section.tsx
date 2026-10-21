
"use client";

import { useState } from "react";

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
  const [clientUrl, setClientUrl] = useState("");
  const [quoteNumber, setQuoteNumber] = useState("");

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

  async function saveQuotation() {
    setError("");
    setClientUrl("");
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

        if (result.proposal?.clientUrl) {
        setClientUrl(result.proposal.clientUrl);
        }

      if (status === "published" && !result.proposal?.clientUrl) {
        setError(
          "Quotation saved, but no public link was returned. Check the API response."
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

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {quoteNumber && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="font-medium text-emerald-300">
            Quotation saved: {quoteNumber}
          </p>
          {clientUrl && (
            <div className="mt-3 space-y-2">
              <p className="break-all text-sm text-zinc-300">{clientUrl}</p>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(
                    new URL(clientUrl, window.location.origin).toString()
                  );
                }}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black"
              >
                Copy client link
              </button>
            </div>
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
                    Price (₹) *
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
            <span>₹{subtotal.toLocaleString("en-IN")}</span>
          </div>

          <label className={`${labelClass} block max-w-xs`}>
            Discount (₹)
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
              ₹{total.toLocaleString("en-IN")}
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
            <option value="draft">Draft — Admin only</option>
            <option value="published">Published — Client link</option>
          </select>
        </label>

        <button
          type="button"
          onClick={saveQuotation}
          disabled={saving}
          className="mt-6 w-full rounded-xl bg-amber-500 px-5 py-3 font-semibold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {saving
            ? "Saving quotation..."
            : status === "published"
              ? "Publish quotation"
              : "Save draft"}
        </button>
      </section>
    </div>
  );
}
