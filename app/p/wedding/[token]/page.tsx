
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type CatalogueItem = {
  name: string;
  description?: string;
  quantity?: number;
};

type PackageTemplate = {
  templateCode: string;
  packageName: string;
  category: string;
  description?: string;
  basePrice: number;
  services: CatalogueItem[];
  deliverables: CatalogueItem[];
  sortOrder: number;
};

type CatalogueAddon = {
  addonCode: string;
  name: string;
  description?: string;
  category?: string;
  defaultPrice: number;
  sortOrder: number;
};

type CatalogueSettings = {
  businessName?: string;
  tagline?: string;
  logo?: string;
  phone?: string;
  whatsappNumber?: string;
  email?: string;
  address?: string;
  gstPercentage?: number;
  advancePercentage?: number;
  balancePaymentText?: string;
  defaultTermsAndConditions?: string[];
  theme?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
  };
};

type CatalogueData = {
  success: boolean;
  settings: CatalogueSettings | null;
  templates: PackageTemplate[];
  addons: CatalogueAddon[];
  counts: {
    templates: number;
    addons: number;
  };
};

const DEFAULT_THEME = {
  primary: "#14233B",
  secondary: "#C6A15B",
  background: "#F8F5EF",
  text: "#252525",
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price || 0);
}

function displayItem(item: CatalogueItem | string) {
  if (typeof item === "string") return item;
  return item.name;
}

function itemDescription(item: CatalogueItem | string) {
  if (typeof item === "string") return "";
  return item.description || "";
}

function itemQuantity(item: CatalogueItem | string) {
  if (typeof item === "string") return null;

  return item.quantity && item.quantity > 1
    ? item.quantity
    : null;
}

export default function WeddingCataloguePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [data, setData] = useState<CatalogueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function loadCatalogue() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/public/final-package-catalogue/${encodeURIComponent(token)}`,
          { cache: "no-store" }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to load catalogue."
          );
        }

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load catalogue."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCatalogue();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const settings = data?.settings;

  const theme = {
    primary: settings?.theme?.primary || DEFAULT_THEME.primary,
    secondary: settings?.theme?.secondary || DEFAULT_THEME.secondary,
    background:
      settings?.theme?.background || DEFAULT_THEME.background,
    text: settings?.theme?.text || DEFAULT_THEME.text,
  };

  const businessName =
    settings?.businessName || "KuttiStory Photography";

  const whatsappNumber = (
    settings?.whatsappNumber ||
    settings?.phone ||
    ""
  ).replace(/\D/g, "");

  function openWhatsApp(message: string) {
    if (!whatsappNumber) {
      if (settings?.email) {
        window.location.href = `mailto:${settings.email}?subject=${encodeURIComponent(
          "Wedding Package Enquiry"
        )}&body=${encodeURIComponent(message)}`;
      } else {
        alert(
          "Contact details are not available. Please contact our studio."
        );
      }

      return;
    }

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      message
    )}`;

    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F5EF]">
        <div className="text-center">
          <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-[#C6A15B] border-t-transparent" />

          <p className="text-sm tracking-[0.2em] text-[#14233B]">
            LOADING YOUR WEDDING EXPERIENCE
          </p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F5EF] px-6">
        <div className="max-w-md text-center">
          <p className="mb-4 text-sm tracking-[0.3em] text-[#C6A15B]">
            KUTTISTORY PHOTOGRAPHY
          </p>

          <h1 className="text-3xl font-serif text-[#14233B]">
            Catalogue Unavailable
          </h1>

          <p className="mt-4 text-sm leading-7 text-gray-600">
            {error ||
              "This wedding catalogue link is invalid, expired or revoked."}
          </p>

          <p className="mt-6 text-xs text-gray-400">
            Please contact our studio for a new catalogue link.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen overflow-hidden"
      style={{
        backgroundColor: theme.background,
        color: theme.text,
      }}
    >
      
        {/* RESPONSIVE WEDDING HERO */}

        {/* MOBILE COVER DESIGN */}
        <section
          className="relative flex min-h-[100svh] flex-col items-center overflow-hidden bg-[#F8F5EF] px-5 py-8 text-center md:hidden"
          style={{
            color: "#252525",
            backgroundImage:
              "radial-gradient(ellipse at 20% 10%, #E9E0D1 0%, transparent 45%), radial-gradient(ellipse at 90% 90%, #E7DFD0 0%, transparent 45%)",
          }}
        >
          {/* Fine gold border */}
          <div className="pointer-events-none absolute inset-4 border border-[#C6A15B]/50" />

          {/* Top header */}
          <div className="relative z-10 flex w-full items-center justify-between">
            {settings?.logo ? (
              <img
                src={settings.logo}
                alt={businessName}
                className="h-9 max-w-28 object-contain"
              />
            ) : (
              <span className="font-serif text-sm">{businessName}</span>
            )}

            <span className="text-xs tracking-[0.2em] text-[#14233B]">
              2026
            </span>
          </div>

          {/* Cover content */}
          <div className="relative z-10 my-auto flex w-full max-w-sm flex-col items-center py-12">
            {settings?.logo && (
              <img
                src={settings.logo}
                alt={businessName}
                className="mb-10 max-h-28 max-w-48 object-contain"
              />
            )}

            <p className="text-xs font-medium tracking-[0.3em] text-[#A77C35]">
              KUTTISTORY PHOTOGRAPHY
            </p>

            <h1 className="mt-7 font-serif text-4xl leading-tight text-[#252525]">
              Wedding
              <br />
              Photography
              <br />
              Package
            </h1>

            <p className="mt-7 max-w-xs font-serif text-lg leading-8 text-[#444444]">
              Capturing Life, One Story at a Time.
            </p>

            <div className="my-9 h-px w-20 bg-[#C6A15B]" />

            <p className="text-xs leading-6 tracking-[0.22em] text-[#252525]">
              A PERSONALIZED
              <br />
              PHOTOGRAPHY PROPOSAL
            </p>

            <p className="mt-12 text-sm text-[#333333]">
              Prepared for: <span className="font-semibold">WEDDING</span>
            </p>
          </div>

          <p className="relative z-10 text-[9px] tracking-[0.25em] text-[#9B815B]">
            KUTTISTORY PHOTOGRAPHY · SINCE 2018
          </p>
        </section>

        {/* DESKTOP HERO DESIGN */}
        <section
          className="relative isolate hidden min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6 py-24 text-center md:flex"
          style={{
            backgroundColor: theme.primary,
            color: "#FFFFFF",
            backgroundImage: "url('/images/wedding-hero-decoration.png')",
            backgroundSize: "100% 100%",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="pointer-events-none absolute inset-0 z-0 bg-[#10213B]/5" />

          <div className="relative z-20 mx-auto max-w-4xl">
            {settings?.logo && (
              <img
                src={settings.logo}
                alt={businessName}
                className="mx-auto mb-8 max-h-24 max-w-48 object-contain"
              />
            )}

            <p
              className="text-xs tracking-[0.45em] sm:text-sm"
              style={{ color: theme.secondary }}
            >
              {businessName.toUpperCase()}
            </p>

            <div
              className="mx-auto my-8 h-px w-24"
              style={{ backgroundColor: theme.secondary }}
            />

            <p
              className="mb-5 text-xs tracking-[0.35em] sm:text-sm"
              style={{ color: theme.secondary }}
            >
              THE 2026 COLLECTION
            </p>

            <h1 className="font-serif text-4xl leading-tight sm:text-6xl lg:text-7xl">
              Wedding Photography
              <br />
              <span className="italic" style={{ color: theme.secondary }}>
                &amp; Cinematic Films
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-sm leading-8 text-white/90 sm:text-base">
              Every wedding is a unique story. We preserve your memories through
              traditional photography, candid moments and cinematic storytelling.
            </p>

            <p
              className="mt-12 text-xs tracking-[0.25em]"
              style={{ color: theme.secondary }}
            >
              CAPTURING YOUR BEST MOMENTS
            </p>

            <a
              href="#packages"
              className="mt-12 inline-flex border px-9 py-4 text-xs tracking-[0.2em] transition hover:bg-white hover:text-[#14233B]"
              style={{ borderColor: theme.secondary }}
            >
              EXPLORE PACKAGES ↓
            </a>
          </div>
        </section>

      {/* INTRODUCTION + PACKAGE HEADING */}

      <section
        id="packages"
        className="mx-auto max-w-7xl scroll-mt-8 px-5 pb-16 pt-16 sm:px-8 sm:pt-20"
      >
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(300px,440px)] lg:gap-12">

          {/* LEFT: BOTH TEXT SECTIONS */}

          <div className="py-6 text-center md:text-left">
            <p
              className="text-xs tracking-[0.35em]"
              style={{ color: theme.secondary }}
            >
              OUR COLLECTION
            </p>

            <h2
              className="mt-5 font-serif text-3xl sm:text-5xl"
              style={{ color: theme.primary }}
            >
              Your Story. Our Frames.
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-sm leading-8 text-gray-600 md:mx-0">
              Discover our wedding photography and cinematic film
              collections, thoughtfully designed to preserve every
              beautiful moment of your celebration.
            </p>

            <div
              className="mx-auto my-8 h-px w-20 md:mx-0"
              style={{ backgroundColor: theme.secondary }}
            />

            <p
              className="text-xs tracking-[0.35em]"
              style={{ color: theme.secondary }}
            >
              FIND YOUR PERFECT COLLECTION
            </p>

            <h2
              className="mt-4 font-serif text-3xl sm:text-5xl"
              style={{ color: theme.primary }}
            >
              Wedding Packages
            </h2>

            <p className="mt-4 text-sm text-gray-500">
              {data.counts.templates} exclusive collections
            </p>
          </div>

          {/* RIGHT: ORIGINAL WEDDING COUPLE PNG */}

          <div className="flex w-full items-center justify-center">
            <img
              src="/images/wedding-catalogue-couple.png"
              alt="Traditional Tamil wedding couple"
              className="h-auto max-h-[560px] w-full max-w-[440px] object-contain object-center"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* ALL 10 PACKAGES */}

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <div className="space-y-12">
          {data.templates.map((pkg, index) => (
            <article
              key={pkg.templateCode}
              className="overflow-hidden border bg-white shadow-sm"
              style={{ borderColor: `${theme.secondary}66` }}
            >
              <div
                className="p-7 text-white sm:p-10"
                style={{ backgroundColor: theme.primary }}
              >
                <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                  <div>
                    <p
                      className="text-xs tracking-[0.3em]"
                      style={{ color: theme.secondary }}
                    >
                      {pkg.category.toUpperCase()} COLLECTION ·{" "}
                      {String(index + 1).padStart(2, "0")}
                    </p>

                    <h3 className="mt-4 font-serif text-3xl sm:text-4xl">
                      {pkg.packageName}
                    </h3>

                    {pkg.description && (
                      <p className="mt-3 text-sm text-white/70">
                        {pkg.description}
                      </p>
                    )}
                  </div>

                  <div className="sm:text-right">
                    <p className="text-xs tracking-[0.2em] text-white/60">
                      PACKAGE INVESTMENT
                    </p>

                    <p
                      className="mt-2 text-3xl font-serif sm:text-4xl"
                      style={{ color: theme.secondary }}
                    >
                      {formatPrice(pkg.basePrice)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-10 p-7 sm:grid-cols-2 sm:p-10">
                <div>
                  <h4
                    className="border-b pb-4 font-serif text-xl"
                    style={{
                      color: theme.primary,
                      borderColor: `${theme.secondary}66`,
                    }}
                  >
                    Event Day Crew
                  </h4>

                  <div className="mt-5 space-y-4">
                    {pkg.services.map((item, itemIndex) => (
                      <div
                        key={`${pkg.templateCode}-service-${itemIndex}`}
                        className="flex items-start justify-between gap-4 text-sm"
                      >
                        <div>
                          <p className="font-medium">
                            {displayItem(item)}
                          </p>

                          {itemDescription(item) && (
                            <p className="mt-1 text-xs text-gray-500">
                              {itemDescription(item)}
                            </p>
                          )}
                        </div>

                        {itemQuantity(item) !== null && (
                          <span className="shrink-0 text-sm text-gray-500">
                            × {itemQuantity(item)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4
                    className="border-b pb-4 font-serif text-xl"
                    style={{
                      color: theme.primary,
                      borderColor: `${theme.secondary}66`,
                    }}
                  >
                    Package Deliverables
                  </h4>

                  <div className="mt-5 space-y-4">
                    {pkg.deliverables.map((item, itemIndex) => (
                      <div
                        key={`${pkg.templateCode}-deliverable-${itemIndex}`}
                        className="flex items-start justify-between gap-4 text-sm"
                      >
                        <div>
                          <p className="font-medium">
                            {displayItem(item)}
                          </p>

                          {itemDescription(item) && (
                            <p className="mt-1 text-xs text-gray-500">
                              {itemDescription(item)}
                            </p>
                          )}
                        </div>

                        {itemQuantity(item) !== null && (
                          <span className="shrink-0 text-sm text-gray-500">
                            × {itemQuantity(item)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div
                className="flex flex-col items-center justify-between gap-5 border-t px-7 py-6 sm:flex-row sm:px-10"
                style={{ borderColor: `${theme.secondary}66` }}
              >
                <p className="text-xs text-gray-500">
                  {pkg.packageName} · {formatPrice(pkg.basePrice)}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    openWhatsApp(
                      `Hello ${businessName}, I am interested in the ${pkg.packageName} (${formatPrice(pkg.basePrice)}) wedding package. Please share more details.`
                    )
                  }
                  className="w-full px-8 py-4 text-xs tracking-[0.15em] text-white transition hover:opacity-90 sm:w-auto"
                  style={{ backgroundColor: theme.primary }}
                >
                  ENQUIRE ABOUT THIS PACKAGE →
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ADD-ONS */}

      <section
        className="px-5 py-24 sm:px-8"
        style={{ backgroundColor: "#EEE9DF" }}
      >
        <div className="mx-auto max-w-6xl">
          
          <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_300px]">
            <div className="py-8 text-center md:text-left">
              <p
                className="text-xs tracking-[0.35em]"
                style={{ color: theme.secondary }}
              >
                PERSONALISE YOUR EXPERIENCE
              </p>

              <h2
                className="mt-4 font-serif text-3xl sm:text-5xl"
                style={{ color: theme.primary }}
              >
                Additional Services
              </h2>

              <p className="mt-4 text-sm text-gray-500">
                Enhance your celebration with our optional add-ons.
              </p>
            </div>

            <div className="flex items-center justify-center">
              <img
                src="/images/additional-services-bride.png"
                alt="KuttiStory Photography bride portrait"
                className="h-auto max-h-[320px] w-full max-w-[260px] object-contain"
                loading="lazy"
              />
            </div>
          </div>


          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.addons.map((addon) => (
              <div
                key={addon.addonCode}
                className="flex items-center justify-between gap-4 border bg-white p-6"
                style={{ borderColor: `${theme.secondary}66` }}
              >
                <div>
                  <h3
                    className="font-medium"
                    style={{ color: theme.primary }}
                  >
                    {addon.name}
                  </h3>

                  {addon.description && (
                    <p className="mt-2 text-xs leading-6 text-gray-500">
                      {addon.description}
                    </p>
                  )}
                </div>

                <p
                  className="shrink-0 font-serif text-lg"
                  style={{ color: theme.secondary }}
                >
                  {formatPrice(addon.defaultPrice)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PAYMENT TERMS */}

      <section className="mx-auto max-w-4xl px-6 py-24">
        
        <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[220px_minmax(0,1fr)] md:gap-8">
          <div className="flex items-center justify-center">
            <img
              src="/images/payment-terms-couple.png"
              alt="KuttiStory Photography couple portrait"
              className="h-auto max-h-[260px] w-full max-w-[220px] object-contain"
              loading="lazy"
            />
          </div>

          <div className="py-6 text-center md:text-left">
            <p
              className="text-xs tracking-[0.35em]"
              style={{ color: theme.secondary }}
            >
              BOOKING INFORMATION
            </p>

            <h2
              className="mt-4 font-serif text-3xl sm:text-5xl"
              style={{ color: theme.primary }}
            >
              Payment & Terms
            </h2>
          </div>
        </div>


        <div className="mt-12 space-y-5">
          <div className="border bg-white p-7">
            <h3
              className="font-serif text-xl"
              style={{ color: theme.primary }}
            >
              Payment Schedule
            </h3>

            <p className="mt-4 text-sm leading-7 text-gray-600">
              {settings?.advancePercentage ?? 50}% advance payment
              is required to confirm the booking.
            </p>

            <p className="mt-2 text-sm leading-7 text-gray-600">
              {settings?.balancePaymentText ||
                "Remaining balance to be paid on or before the event day."}
            </p>
          </div>

          <div className="border bg-white p-7">
            <h3
              className="font-serif text-xl"
              style={{ color: theme.primary }}
            >
              Terms & Conditions
            </h3>

            <div className="mt-5 space-y-3">
              {(settings?.defaultTermsAndConditions || [
                "50% advance payment is required to confirm the booking.",
                "Remaining 50% must be paid on or before the event day.",
                "Booking confirmation is subject to advance payment and date availability.",
                "Additional services or requirements beyond the selected package will be charged separately.",
                "Event timings and coverage schedules will be shared in advance.",
                "Extra hours may incur additional charges.",
                "Outdoor shoots are subject to weather, location permissions and availability.",
                "Travel, accommodation and location expenses, if applicable, will be charged separately.",
                "Event date or location changes must be communicated in advance and are subject to availability.",
                "Album design will be shared for client approval before printing.",
                "Revisions are subject to the agreed revision policy.",
                "Final edited photos and videos will be delivered digitally or through an agreed storage medium.",
                "RAW files will be provided on the client's own hard disk as specified.",
                "Delivery timelines will be communicated based on the selected package and project requirements.",
                "All bookings are subject to KuttiStory Photography terms and conditions.",
              ]).map((term, index) => (
                <p
                  key={index}
                  className="flex gap-3 text-sm leading-7 text-gray-600"
                >
                  <span style={{ color: theme.secondary }}>
                    {String(index + 1).padStart(2, "0")}.
                  </span>
                  {term}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT / CLOSING */}

      <footer
        className="px-6 py-24 text-center text-white"
        style={{ backgroundColor: theme.primary }}
      >
        <p
          className="text-xs tracking-[0.35em]"
          style={{ color: theme.secondary }}
        >
          LET US CAPTURE YOUR STORY
        </p>

        <h2 className="mx-auto mt-6 max-w-3xl font-serif text-4xl sm:text-6xl">
          Your Beautiful Beginning Deserves to Be Remembered.
        </h2>

        <p className="mx-auto mt-6 max-w-xl text-sm leading-8 text-white/70">
          Thank you for exploring our wedding collections.
          We look forward to being part of your special celebration.
        </p>

        <button
          type="button"
          onClick={() =>
            openWhatsApp(
              `Hello ${businessName}, I viewed your 2026 Wedding Photography & Cinematic Film Catalogue. I would like to discuss my wedding photography requirements.`
            )
          }
          className="mt-10 border px-10 py-5 text-xs tracking-[0.2em] transition hover:bg-white hover:text-[#14233B]"
          style={{ borderColor: theme.secondary }}
        >
          CONTACT US ON WHATSAPP
        </button>

        <div
          className="mx-auto my-12 h-px max-w-xs"
          style={{ backgroundColor: theme.secondary }}
        />

        <p className="font-serif text-2xl">
          {businessName}
        </p>

        {settings?.tagline && (
          <p className="mt-3 text-xs text-white/60">
            {settings.tagline}
          </p>
        )}

        {settings?.phone && (
          <p className="mt-5 text-sm text-white/70">
            {settings.phone}
          </p>
        )}

        {settings?.email && (
          <p className="mt-2 text-sm text-white/70">
            {settings.email}
          </p>
        )}

        {settings?.address && (
          <p className="mt-2 text-sm text-white/70">
            {settings.address}
          </p>
        )}

        <p className="mt-12 text-[10px] tracking-[0.25em] text-white/40">
          © {new Date().getFullYear()} {businessName}. ALL RIGHTS RESERVED.
        </p>
      </footer>
    </main>
  );
}
