
import { notFound } from "next/navigation";

import type { Metadata } from "next";

import PublicQuotationCategoryGallery from "@/components/quotation/PublicQuotationCategoryGallery";

interface QuotationImage {
  url: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

interface QuotationService {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface QuotationEvent {
  eventName: string;
  eventDate?: string;
  venue?: string;
  services: QuotationService[];
}

interface QuotationPaymentTerm {
  label: string;
  percentage?: number;
  amount?: number;
  dueDate?: string;
}

interface QuotationGalleryCategory {
  id: string;
  title: string;
  coverImage: string;
  photos: string[];
}

interface QuotationPageSection {
  id: string;
  type: string;
  visible: boolean;
  title?: string;
  subtitle?: string;
  body?: string;
  layout?: string;
  backgroundColor?: string;
  textColor?: string;
  images?: QuotationImage[];
  categories?: QuotationGalleryCategory[];
  heading?: string;
  items?: string[];
  itemsText?: string;
  fontFamily?: string;
  headingFontSize?: number;
  listFontSize?: number;
  headingColor?: string;
  subtitleColor?: string;
  itemColor?: string;
  accentColor?: string;
  imageUrl?: string;
  logoUrl?: string;
}

interface QuotationPageDesign {
  brandName?: string;
  tagline?: string;
  logoUrl?: string;
  backgroundColor?: string;
  accentColor?: string;
  textColor?: string;
  fontFamily?: string;
  sections?: QuotationPageSection[];
}

interface Quotation {
  quoteNumber: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  title: string;
  introduction?: string;
  events: QuotationEvent[];
  deliverables: string[];
  subtotal: number;
  discount: number;
  gstin?: string;
  gstRate?: number;
  gstAmount?: number;
  additionalDiscountPercent?: number;
  additionalDiscountAmount?: number;
  totalAmount: number;
  paymentTerms: QuotationPaymentTerm[];
  termsAndConditions: string[];
  validityDate?: string;
  status: string;
  pageDesign?: QuotationPageDesign;
}

interface ApiResponse {
  success: boolean;
  quotation?: Quotation;
}

interface PageProps {
  params: Promise<{ token: string }>;
}

function formatCurrency(value: number | undefined): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function formatDate(value?: string): string {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function SectionHeading({
  title,
  subtitle,
  accentColor,
}: {
  title: string;
  subtitle?: string;
  accentColor: string;
}) {
  return (
    <div className="mb-10 text-center">
      <div
        className="mx-auto mb-4 h-px w-16"
        style={{ backgroundColor: accentColor }}
      />

      <h2 className="text-3xl font-light tracking-wide md:text-5xl">
        {title}
      </h2>

      {subtitle && (
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 opacity-70 md:text-base">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function ImageGallery({
  images,
  accentColor,
}: {
  images: QuotationImage[];
  accentColor: string;
}) {
  if (!images.length) {
    return (
      <div
        className="rounded-xl border border-dashed p-8 text-center text-sm opacity-60"
        style={{ borderColor: accentColor }}
      >
        Gallery photographs will be added to this proposal.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {images.map((image, index) => (
        <figure key={`${image.url}-${index}`} className="group">
          <div className="overflow-hidden rounded-sm">
            <img
              src={image.url}
              alt={image.alt || `Wedding photograph ${index + 1}`}
              width={image.width || 1200}
              height={image.height || 900}
              loading="lazy"
              className="h-72 w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>

          {image.caption && (
            <figcaption className="mt-3 text-center text-xs tracking-wide opacity-70">
              {image.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

function renderSection(
  section: QuotationPageSection,
  quotation: Quotation,
  design: QuotationPageDesign,
  accentColor: string,
  textColor: string,
) {
  // quotation is explicitly passed in, so TypeScript knows it exists.
  const heading = section.title;
  const subtitle = section.subtitle;
  const body = section.body;
  const images = section.images ?? [];

  const sectionStyle: React.CSSProperties = {
    backgroundColor: section.backgroundColor || "transparent",
    color: section.textColor || textColor,
  };

  switch (section.type) {
    
    case "hero":
      return (
        <section
          key={section.id}
          className="relative flex min-h-[90vh] items-center justify-center overflow-hidden px-4 py-16 text-center sm:px-6 md:py-24"
          style={{
            ...sectionStyle,
            backgroundColor:
              section.backgroundColor ||
              design.backgroundColor ||
              "#f5f1e9",
          }}
        >
          {/* Botanical background image */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage:
                "url('/images/quotation-botanical-bg.png')",
            }}
          />

          {/* Soft ivory overlay keeps the text readable */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,252,245,0.20), rgba(255,252,245,0.38))",
            }}
          />

          {/* Optional image configured in the quotation builder */}
          {images[0]?.url && (
            <img
              src={images[0].url}
              alt={images[0].alt || heading || quotation.title}
              className="absolute bottom-5 right-5 h-16 w-16 rounded-full object-cover opacity-0"
              aria-hidden="true"
            />
          )}

          {/* Existing dynamic quotation content */}
          <div className="relative z-10 mx-auto w-full max-w-5xl border border-[#c6a66b]/40 bg-[#fffdf8]/50 px-5 py-12 shadow-sm backdrop-blur-[1px] sm:px-10 sm:py-16 md:px-16 md:py-20">
            {design.logoUrl && (
              <img
                src={design.logoUrl}
                alt={design.brandName || "Photography logo"}
                className="mx-auto mb-8 max-h-20 max-w-48 object-contain"
              />
            )}

            <p
              className="mb-5 text-xs uppercase tracking-[0.35em]"
              style={{ color: accentColor }}
            >
              {design.brandName || "Kutti Story Photography"}
            </p>

            <h1 className="mx-auto max-w-4xl text-4xl font-light leading-tight sm:text-5xl md:text-7xl">
              {heading || quotation.title}
            </h1>

            {subtitle && (
              <p className="mt-6 text-lg font-light md:text-2xl">
                {subtitle}
              </p>
            )}

            <div
              className="mx-auto my-8 h-px w-20"
              style={{ backgroundColor: accentColor }}
            />

            <p className="text-xs tracking-[0.2em] sm:text-sm">
              A PERSONALIZED PHOTOGRAPHY PROPOSAL
            </p>

            <div className="mt-10 space-y-2 text-sm sm:mt-12">
              <p>Prepared for: {quotation.clientName}</p>
              <p>Quotation No: {quotation.quoteNumber}</p>

              {quotation.validityDate && (
                <p>Valid until: {formatDate(quotation.validityDate)}</p>
              )}
            </div>
          </div>
        </section>
      );

    case "story":
      return (
        <section
          key={section.id}
          className="px-6 py-20 md:px-12 md:py-28"
          style={sectionStyle}
        >
          <div className="mx-auto max-w-4xl">
            <SectionHeading
              title={heading || "Your Story, Beautifully Told"}
              subtitle={subtitle}
              accentColor={accentColor}
            />

            <div className="mx-auto max-w-3xl text-center">
              <p className="whitespace-pre-line text-base leading-8 opacity-80 md:text-lg md:leading-9">
                {body ||
                  quotation.introduction ||
                  `Dear ${quotation.clientName}, we would love to capture the moments, emotions and memories that make your celebration unique.`}
              </p>

              {quotation.validityDate && (
                <p className="mt-8 text-sm opacity-70">
                  Proposal valid until: {formatDate(quotation.validityDate)}
                </p>
              )}
            </div>
          </div>
        </section>
      );

    case "gallery":
      return (
        <section
          key={section.id}
          className="px-6 py-20 md:px-12 md:py-28"
          style={sectionStyle}
        >
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              title={heading || "A Glimpse of Our Stories"}
              subtitle={subtitle}
              accentColor={accentColor}
            />

            {section.categories?.length ? (
              <PublicQuotationCategoryGallery
                categories={section.categories}
                accentColor={accentColor}
              />
            ) : (
              <ImageGallery
                images={images}
                accentColor={accentColor}
              />
            )}

          </div>
        </section>
      );
    
    case "event":
      return (
        <section
          key={section.id}
          className="px-6 py-20 md:px-12 md:py-28"
          style={sectionStyle}
        >
          <div className="mx-auto max-w-5xl">
            <SectionHeading
              title={heading || "Your Wedding Celebrations"}
              subtitle={subtitle}
              accentColor={accentColor}
            />

            <div className="space-y-6">
              {quotation.events.map((event, index) => (
                <article
                  key={`${event.eventName}-${index}`}
                  className="rounded-sm border p-6 md:p-8"
                  style={{ borderColor: `${accentColor}66` }}
                >
                  <h3 className="text-2xl font-light">
                    {event.eventName}
                  </h3>

                  {event.eventDate && (
                    <p className="mt-3 text-sm opacity-70">
                      Event Date: {formatDate(event.eventDate)}
                    </p>
                  )}

                  {event.venue && (
                    <p className="mt-2 text-sm opacity-70">
                      Venue: {event.venue}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      );

      case "services": {
        const rawServices =
          Array.isArray(section.items) && section.items.length > 0
            ? section.items
            : typeof section.itemsText === "string"
              ? section.itemsText.split(/\r?\n/)
              : [];

        // Also handle saved data where all services were joined into one line.
        const services = rawServices
          .flatMap((item) => item.split(/\r?\n|(?<=SHOOTS|PHOTOGRAPHY|VIDEOGRAPHY|STREAMING|FILM|EXPERIENCE|DRONE)\s+(?=[A-Z0-9])/))
          .map((item) => item.trim())
          .filter(Boolean);

        const servicesHeading = section.heading || heading || "OUR";
        const servicesSubtitle =
          subtitle || "COVERAGE TAILORED TO YOUR CELEBRATION";

        const servicesFont =
          section.fontFamily || design.fontFamily || "Georgia, serif";

        const headingSize = Number(section.headingFontSize) || 34;
        const listSize = Number(section.listFontSize) || 12;

        const headingColor =
          section.headingColor || section.accentColor || accentColor;
        const subtitleColor = section.subtitleColor || "#111111";
        const itemColor = section.itemColor || section.textColor || textColor;
        const bulletColor = section.accentColor || accentColor;

        const serviceImage =
          section.imageUrl || images[0]?.url || "/images/services-couple.png";

        const serviceLogo = section.logoUrl || design.logoUrl;

        return (
          <section
            key={section.id}
            className="overflow-hidden bg-white px-5 py-12 sm:px-10 md:px-14 md:py-16"
            style={{
              ...sectionStyle,
              backgroundColor: section.backgroundColor || "#ffffff",
              fontFamily: servicesFont,
            }}
          >
            <div className="mx-auto grid max-w-7xl items-center gap-8 md:grid-cols-2 md:gap-10">
              <div className="relative z-10 min-w-0">
                <div className="mb-6 text-center md:text-left">
                  <h2
                    className="font-light leading-none tracking-tight"
                    style={{
                      color: headingColor,
                      fontSize: `${headingSize}px`,
                    }}
                  >
                    {servicesHeading}
                    <span style={{ color: itemColor }}>..</span>
                  </h2>

                  <p
                    className="mt-2 max-w-md uppercase leading-tight tracking-wide"
                    style={{
                      color: subtitleColor,
                      fontSize: `${Math.max(14, headingSize * 0.45)}px`,
                    }}
                  >
                    {servicesSubtitle}
                  </p>

                  <div
                    className="mx-auto mt-4 h-[3px] w-12 md:mx-0"
                    style={{ backgroundColor: bulletColor }}
                  />
                </div>

                <ul className="space-y-1">
                  {services.map((service, index) => (
                    <li
                      key={`${service}-${index}`}
                      className="flex items-start gap-2 text-left"
                      style={{
                        color: itemColor,
                        fontFamily: servicesFont,
                        fontSize: `${listSize}px`,
                        lineHeight: 1.6,
                      }}
                    >
                      <span
                        aria-hidden="true"
                        className="mt-[0.55em] h-1 w-1 shrink-0"
                        style={{ backgroundColor: bulletColor }}
                      />

                      <span className="block min-w-0 flex-1">
                        {service}
                      </span>
                    </li>
                  ))}
                </ul>

                {serviceLogo && (
                  <div className="mt-7 flex justify-center md:justify-start">
                    <img
                      src={serviceLogo}
                      alt={design.brandName || "Photography logo"}
                      className="h-16 w-16 object-contain"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>

              <div className="relative flex min-h-[350px] items-end justify-center md:min-h-[540px]">
                {serviceImage && (
                  <img
                    src={serviceImage}
                    alt="Wedding couple portrait"
                    className="max-h-[540px] w-full object-contain object-bottom"
                    loading="lazy"
                  />
                )}
              </div>
            </div>
          </section>
        );
      }

    case "deliverables":
      return (
        <section
          key={section.id}
          className="px-6 py-20 md:px-12 md:py-28"
          style={sectionStyle}
        >
          <div className="mx-auto max-w-4xl">
            <SectionHeading
              title={heading || "What You Will Receive"}
              subtitle={subtitle}
              accentColor={accentColor}
            />

            {quotation.deliverables.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {quotation.deliverables.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="flex items-start gap-4 border-b pb-4"
                    style={{ borderColor: `${accentColor}55` }}
                  >
                    <span
                      className="text-xl"
                      style={{ color: accentColor }}
                    >
                      ✓
                    </span>

                    <p className="leading-7">{item}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center opacity-60">
                Deliverables will be confirmed in your proposal.
              </p>
            )}
          </div>
        </section>
      );

    case "pricing":
      return (
        <section
          key={section.id}
          className="px-6 py-20 md:px-12 md:py-28"
          style={sectionStyle}
        >
          <div className="mx-auto max-w-3xl">
            <SectionHeading
              title={heading || "Your Investment"}
              subtitle={subtitle}
              accentColor={accentColor}
            />

            <div
              className="rounded-sm border p-6 md:p-10"
              style={{ borderColor: `${accentColor}88` }}
            >
              <div className="space-y-5">
                
                {quotation.events.map((event, eventIndex) => (
                  <div
                    key={`${event.eventName}-${eventIndex}`}
                    className="mb-8 last:mb-0"
                  >
                    <h3
                      className="mb-4 border-b pb-3 text-lg font-semibold uppercase tracking-wide"
                      style={{
                        color: accentColor,
                        borderColor: `${accentColor}66`,
                      }}
                    >
                      {event.eventName}
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr
                            style={{
                              backgroundColor: accentColor,
                              color: "#ffffff",
                            }}
                          >
                            <th className="px-3 py-3 text-center font-semibold">
                              S.No
                            </th>
                            <th className="px-3 py-3 text-left font-semibold">
                              Services
                            </th>
                            <th className="px-3 py-3 text-center font-semibold">
                              Cameras
                            </th>
                            <th className="px-3 py-3 text-right font-semibold">
                              Amount
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {event.services.map((service, serviceIndex) => (
                            <tr
                              key={`${service.name}-${serviceIndex}`}
                              className="border-b"
                              style={{
                                borderColor: `${accentColor}44`,
                              }}
                            >
                              <td className="px-3 py-4 text-center opacity-70">
                                {serviceIndex + 1}
                              </td>

                              <td className="px-3 py-4">
                                <div className="font-medium">
                                  {service.name}
                                </div>

                                {service.description && (
                                  <div className="mt-1 text-xs opacity-60">
                                    {service.description}
                                  </div>
                                )}
                              </td>

                              <td className="px-3 py-4 text-center tabular-nums">
                                {service.quantity ?? 1}
                              </td>

                              <td className="whitespace-nowrap px-3 py-4 text-right tabular-nums">
                                {Number(service.total) === 0
                                  ? ""
                                  : formatCurrency(service.total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

              </div>

              <div
                className="mt-8 space-y-4 border-t pt-6"
                style={{ borderColor: `${accentColor}88` }}
              >
                
              <div className="flex justify-between gap-4">
                 <span className="opacity-70">Subtotal</span>
                 <span>{formatCurrency(quotation.subtotal)}</span>
              </div>

                {quotation.discount > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="opacity-70">Fixed Discount</span>
                    <span>
                      −{formatCurrency(quotation.discount)}
                    </span>
                  </div>
                )}

                {(quotation.additionalDiscountPercent ?? 0) > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="opacity-70">
                      Additional Discount ({quotation.additionalDiscountPercent}%)
                    </span>
                    <span>
                      −{formatCurrency(quotation.additionalDiscountAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between gap-4">
                  <span className="opacity-70">Taxable Amount</span>
                  <span>
                    {formatCurrency(
                      Math.max(
                        0,
                        quotation.subtotal -
                          quotation.discount -
                          (quotation.additionalDiscountAmount ?? 0)
                      )
                    )}
                  </span>
                </div>

                {(quotation.gstRate ?? 0) > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="opacity-70">
                      GST ({quotation.gstRate}%)
                    </span>
                    <span>{formatCurrency(quotation.gstAmount)}</span>
                  </div>
                )}

                {quotation.gstin && (
                  <div className="flex flex-wrap justify-between gap-4 text-sm">
                    <span className="opacity-70">GSTIN</span>
                    <span>{quotation.gstin}</span>
                  </div>
                )}

                <div
                  className="flex flex-wrap items-center justify-between gap-4 border-t pt-6"
                  style={{ borderColor: `${accentColor}88` }}
                >
                  <span className="text-lg">Total Investment</span>

                  <span
                    className="text-3xl font-light md:text-4xl"
                    style={{ color: accentColor }}
                  >
                    {formatCurrency(quotation.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      );

    case "payment_terms":
      return (
        <section
          key={section.id}
          className="px-6 py-20 md:px-12 md:py-28"
          style={sectionStyle}
        >
          <div className="mx-auto max-w-4xl">
            <SectionHeading
              title={heading || "Payment Schedule"}
              subtitle={subtitle}
              accentColor={accentColor}
            />

            {quotation.paymentTerms.length ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {quotation.paymentTerms.map((term, index) => (
                  <article
                    key={`${term.label}-${index}`}
                    className="border p-6"
                    style={{ borderColor: `${accentColor}88` }}
                  >
                    <p
                      className="text-xs uppercase tracking-[0.2em]"
                      style={{ color: accentColor }}
                    >
                      Payment {index + 1}
                    </p>

                    <h3 className="mt-3 text-xl font-light">
                      {term.label}
                    </h3>

                    {term.percentage !== undefined && (
                      <p className="mt-3 text-2xl">
                        {term.percentage}%
                      </p>
                    )}

                    {term.amount !== undefined && (
                      <p className="mt-2 text-lg">
                        {formatCurrency(term.amount)}
                      </p>
                    )}

                    {term.dueDate && (
                      <p className="mt-3 text-sm opacity-70">
                        Due: {formatDate(term.dueDate)}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-center opacity-70">
                Payment schedule will be confirmed during booking.
              </p>
            )}
          </div>
        </section>
      );

    case "terms":
      return (
        <section
          key={section.id}
          className="px-6 py-20 md:px-12 md:py-28"
          style={sectionStyle}
        >
          <div className="mx-auto max-w-4xl">
            <SectionHeading
              title={heading || "Terms & Conditions"}
              subtitle={subtitle}
              accentColor={accentColor}
            />

            {quotation.termsAndConditions.length ? (
              <ol className="space-y-4">
                {quotation.termsAndConditions.map((term, index) => (
                  <li
                    key={`${term}-${index}`}
                    className="flex items-start gap-4 text-sm leading-7 opacity-80"
                  >
                    <span style={{ color: accentColor }}>
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span>{term}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-center opacity-60">
                Terms and conditions will be discussed before confirmation.
              </p>
            )}
          </div>
        </section>
      );

    case "closing":
      return (
        <section
          key={section.id}
          className="px-6 py-24 text-center md:px-12 md:py-32"
          style={{
            ...sectionStyle,
            backgroundColor:
              section.backgroundColor ||
              design.backgroundColor ||
              "#f5f1e9",
          }}
        >
          <div className="mx-auto max-w-3xl">
            <div
              className="mx-auto mb-8 h-px w-16"
              style={{ backgroundColor: accentColor }}
            />

            <h2 className="text-3xl font-light md:text-5xl">
              {heading || "Let’s Tell Your Story"}
            </h2>

            {subtitle && (
              <p className="mt-5 text-lg opacity-75">{subtitle}</p>
            )}

            <p className="mx-auto mt-6 max-w-2xl whitespace-pre-line leading-8 opacity-75">
              {body ||
                "Thank you for considering us to be part of your special celebration. We look forward to creating memories you can cherish for a lifetime."}
            </p>

            <p
              className="mt-10 text-sm uppercase tracking-[0.2em]"
              style={{ color: accentColor }}
            >
              {design.brandName || "Kutti Story Photography"}
            </p>

            {design.tagline && (
              <p className="mt-3 text-sm opacity-70">
                {design.tagline}
              </p>
            )}
          </div>
        </section>
      );

    case "custom":
      return (
        <section
          key={section.id}
          className="px-6 py-20 md:px-12 md:py-28"
          style={sectionStyle}
        >
          <div className="mx-auto max-w-4xl">
            {heading && (
              <SectionHeading
                title={heading}
                subtitle={subtitle}
                accentColor={accentColor}
              />
            )}

            {body && (
              <p className="whitespace-pre-line text-center leading-8 opacity-80">
                {body}
              </p>
            )}

            {images.length > 0 && (
              <div className="mt-10">
                <ImageGallery
                  images={images}
                  accentColor={accentColor}
                />
              </div>
            )}
          </div>
        </section>
      );

    default:
      return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { token } = await params;

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://www.kuttistoryphotography.com"
  ).replace(/\/+$/, "");

  const previewImage = `${siteUrl}/images/quotation-preview.png`;
  const quotationUrl = `${siteUrl}/quotation/${encodeURIComponent(token)}`;

  
  return {
    metadataBase: new URL(siteUrl),

    alternates: {
      canonical: quotationUrl,
    },

    title: "Kutti Story Photography | Wedding Quotation",

    description:
      "Your Wedding Story, Beautifully Captured. Explore your personalized photography quotation from Kutti Story Photography.",
    openGraph: {
      title: "Kutti Story Photography",
      description: "Your Wedding Story, Beautifully Captured",
      url: quotationUrl,
      siteName: "Kutti Story Photography",
      images: [
        {
          url: previewImage,
          alt: "Kutti Story Photography — Your Wedding Story, Beautifully Captured",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Kutti Story Photography",
      description: "Your Wedding Story, Beautifully Captured",
      images: [previewImage],
    },
  };
}

function normalizeQuotationContent(
  quotation: Quotation
): Quotation {
  const sections = quotation.pageDesign?.sections;

  if (!sections?.length) return quotation;

  const noteText = (quotation.termsAndConditions || []).join("\n").trim();

  const paymentSectionIndex = sections.findIndex(
    (section) => section.id === "payment"
  );

  if (paymentSectionIndex === -1) return quotation;

  const paymentSection = sections[paymentSectionIndex];
  const commitmentText = (paymentSection.body || "").trim();

  const noteLooksLikeClosing =
    /memories|pleasure|look forward|thank you|exceptional experience|terms\s*&\s*conditions apply/i.test(noteText);

  const commitmentLooksLikePayment =
    /advance payment|balance|paid|payment|album preparation|travel|food|accommodation|expenses|quotation covers/i.test(commitmentText);

  // Swap only when the saved content is actually reversed.
  if (!noteLooksLikeClosing || !commitmentLooksLikePayment) {
    return quotation;
  }

  const updatedSections = sections.map((section, index) =>
    index === paymentSectionIndex
      ? { ...section, body: noteText }
      : section
  );

  return {
    ...quotation,
    termsAndConditions: commitmentText
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean),
    pageDesign: {
      ...quotation.pageDesign,
      sections: updatedSections,
    },
  };
}

export default async function PublicQuotationPage({
  params,
}: PageProps) {
  const { token } = await params;

  if (!/^[a-f0-9]{64}$/i.test(token)) {
    notFound();
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000";

  let result: ApiResponse;

  try {
    const response = await fetch(
      
    `${siteUrl.replace(/\/$/, "")}/api/quotation-proposals/public/${encodeURIComponent(token)}`,

      { cache: "no-store" },
    );

    if (!response.ok) {
      notFound();
    }

    result = (await response.json()) as ApiResponse;
  } catch {
    notFound();
  }

  const savedQuotation = result.quotation;

  if (!result.success || !savedQuotation) {
    notFound();
  }

  const quotation = normalizeQuotationContent(savedQuotation);

  const design = quotation.pageDesign ?? {};

  const accentColor = design.accentColor || "#c6a66b";
  const textColor = design.textColor || "#242424";
  const backgroundColor = design.backgroundColor || "#f5f1e9";
  const fontFamily =
    design.fontFamily === "sans-serif"
      ? "Arial, Helvetica, sans-serif"
      : design.fontFamily === "serif"
        ? "Georgia, 'Times New Roman', serif"
        : design.fontFamily || "Georgia, 'Times New Roman', serif";

  const configuredSections = design.sections;

  const sections: QuotationPageSection[] =
    configuredSections && configuredSections.length > 0
      ? configuredSections.filter((section) => section.visible !== false)
      : [
          {
            id: "hero",
            type: "hero",
            visible: true,
            title: quotation.title,
            subtitle: design.tagline,
            images: [],
          },
          {
            id: "story",
            type: "story",
            visible: true,
            title: "Your Story, Beautifully Told",
            body: quotation.introduction,
            images: [],
          },
          {
            id: "events",
            type: "event",
            visible: true,
            title: "Your Celebration",
            images: [],
          },
          {
            id: "services",
            type: "services",
            visible: true,
            title: "Photography & Cinematic Services",
            images: [],
          },
          {
            id: "deliverables",
            type: "deliverables",
            visible: true,
            title: "What You Will Receive",
            images: [],
          },
          {
            id: "pricing",
            type: "pricing",
            visible: true,
            title: "Your Investment",
            images: [],
          },
          {
            id: "terms",
            type: "terms",
            visible: true,
            title: "Terms & Conditions",
            images: [],
          },
          {
            id: "payment",
            type: "custom",
            visible: true,
            title: "Your Celebration, Our Commitment",
            subtitle: "Thank You for Choosing Kutti Story Photography",
            body:
              "The value of the memories we create together is truly priceless.\n\n" +
              "It is our pleasure to present our services for your upcoming special occasion. We sincerely appreciate the opportunity to be considered for your event and thank you for placing your trust in Kutti Story Photography.\n\n" +
              "We look forward to delivering an exceptional experience and capturing your precious moments with creativity, care, and dedication.\n\n" +
              "Terms & Conditions Apply",
            layout: "centered",
            backgroundColor: "#ffffff",
            textColor: "#242424",
            images: [],
          },
          
          {
            id: "closing",
            type: "closing",
            visible: true,
            title: "Let’s Tell Your Story",
            images: [],
          },
        ];

  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor,
        color: textColor,
        fontFamily,
      }}
    >
      <article>
        {sections.map((section) =>
          renderSection(
            section,
            quotation,
            design,
            accentColor,
            textColor,
          ),
        )}
      </article>

      <footer
        className="border-t px-6 py-10 text-center"
        style={{ borderColor: `${accentColor}66` }}
      >
        {design.logoUrl && (
          <img
            src={design.logoUrl}
            alt={design.brandName || "Photography logo"}
            className="mx-auto mb-5 max-h-14 max-w-40 object-contain"
          />
        )}

        <p className="text-sm tracking-wide">
          {design.brandName || "Kutti Story Photography"}
        </p>

        <p className="mt-2 text-xs opacity-60">
          {design.tagline || "Capturing Life, One Story at a Time."}
        </p>

        <p className="mt-5 text-xs opacity-50">
          Photography proposal · {quotation.quoteNumber}
        </p>
      </footer>
    </main>
  );
}
