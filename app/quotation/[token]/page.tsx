
import { notFound } from "next/navigation";

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
  name: string;
  date?: string;
  description?: string;
  services: QuotationService[];
}

interface QuotationPaymentTerm {
  label: string;
  percentage?: number;
  amount?: number;
  dueDate?: string;
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

            <ImageGallery
              images={images}
              accentColor={accentColor}
            />
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
              title={heading || "Your Celebration"}
              subtitle={subtitle}
              accentColor={accentColor}
            />

            <div className="space-y-8">
              {quotation.events.map((event, index) => (
                <article
                  key={`${event.name}-${index}`}
                  className="border-b pb-8"
                  style={{ borderColor: `${accentColor}66` }}
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row">
                    <h3 className="text-2xl font-light">
                      {event.name}
                    </h3>

                    {event.date && (
                      <p className="text-sm opacity-70">
                        {formatDate(event.date)}
                      </p>
                    )}
                  </div>

                  {event.description && (
                    <p className="mt-3 leading-7 opacity-75">
                      {event.description}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      );

    case "services":
      return (
        <section
          key={section.id}
          className="px-6 py-20 md:px-12 md:py-28"
          style={sectionStyle}
        >
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              title={heading || "Photography & Cinematic Services"}
              subtitle={subtitle}
              accentColor={accentColor}
            />

            <div className="grid gap-6 md:grid-cols-2">
              {quotation.events.map((event, eventIndex) => (
                <article
                  key={`${event.name}-${eventIndex}`}
                  className="rounded-sm border p-6 md:p-8"
                  style={{ borderColor: `${accentColor}88` }}
                >
                  <p
                    className="mb-3 text-xs uppercase tracking-[0.2em]"
                    style={{ color: accentColor }}
                  >
                    {event.name}
                  </p>

                  <div className="space-y-5">
                    {event.services.map((service, serviceIndex) => (
                      <div
                        key={`${service.name}-${serviceIndex}`}
                        className="border-b pb-4 last:border-b-0"
                        style={{ borderColor: `${accentColor}44` }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-medium">
                            {service.name}
                          </h3>

                          <span className="whitespace-nowrap text-sm opacity-70">
                            × {service.quantity}
                          </span>
                        </div>

                        {service.description && (
                          <p className="mt-2 text-sm leading-6 opacity-70">
                            {service.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      );

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
                  <div key={`${event.name}-${eventIndex}`}>
                    <h3 className="mb-3 text-lg font-medium">
                      {event.name}
                    </h3>

                    {event.services.map((service, serviceIndex) => (
                      <div
                        key={`${service.name}-${serviceIndex}`}
                        className="flex justify-between gap-4 py-2 text-sm"
                      >
                        <span className="opacity-80">
                          {service.name}
                        </span>

                        <span className="whitespace-nowrap">
                          {formatCurrency(service.total)}
                        </span>
                      </div>
                    ))}
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
                    <span className="opacity-70">Discount</span>
                    <span>
                      −{formatCurrency(quotation.discount)}
                    </span>
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
      `${siteUrl.replace(/\/$/, "")}/api/quotation-proposals/${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      notFound();
    }

    result = (await response.json()) as ApiResponse;
  } catch {
    notFound();
  }

  const quotation = result.quotation;

  if (!result.success || !quotation) {
    notFound();
  }

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
            id: "payment",
            type: "payment_terms",
            visible: true,
            title: "Payment Schedule",
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
