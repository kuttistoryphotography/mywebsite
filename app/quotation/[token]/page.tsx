
import { notFound } from "next/navigation";

interface QuotationService {
  name: string;
  quantity: number;
  unitPrice: number;
  total?: number;
  description?: string;
}

interface QuotationEvent {
  eventName: string;
  eventDate?: string;
  venue?: string;
  services: QuotationService[];
}

interface PaymentTerm {
  label: string;
  percentage?: number;
  amount?: number;
  dueDate?: string;
}

interface Quotation {
  quoteNumber: string;
  clientName: string;
  title: string;
  introduction?: string;
  events: QuotationEvent[];
  deliverables: string[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paymentTerms: PaymentTerm[];
  termsAndConditions: string[];
  validityDate?: string;
}

interface PageProps {
  params: Promise<{ token: string }>;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (value?: string) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

export default async function QuotationPage({ params }: PageProps) {
  const { token } = await params;

  if (!/^[a-f0-9]{64}$/.test(token)) notFound();

  // Use the incoming request's host rather than requiring a hard-coded URL.
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL is not configured on Vercel.");
  }

  const response = await fetch(
    `${baseUrl.replace(/\/$/, "")}/api/quotation-proposals/${token}`,
    { cache: "no-store" }
  );

  if (response.status === 404) notFound();

  if (!response.ok) {
    throw new Error("Unable to load this quotation.");
  }

  const result = await response.json();
  const quotation = result.quotation as Quotation | undefined;

  if (!result.success || !quotation) notFound();

  return (
    <main className="min-h-screen bg-[#f5f4f0] px-4 py-8 text-[#242424] sm:px-8 sm:py-12">
      <article className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-white shadow-sm">
        <header className="bg-[#202020] px-6 py-10 text-white sm:px-12 sm:py-14">
          <p className="text-sm uppercase tracking-[0.25em] text-[#d7bd8b]">
            Kutti Story Photography
          </p>

          <h1 className="mt-5 text-3xl font-semibold sm:text-5xl">
            {quotation.title}
          </h1>

          <p className="mt-4 text-sm text-white/70">
            Quotation No: {quotation.quoteNumber}
          </p>
        </header>

        <div className="space-y-10 px-6 py-8 sm:px-12 sm:py-12">
          <section>
            <p className="text-sm uppercase tracking-widest text-gray-500">
              Prepared for
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              {quotation.clientName}
            </h2>

            {quotation.introduction && (
              <p className="mt-4 leading-7 text-gray-600">
                {quotation.introduction}
              </p>
            )}

            {quotation.validityDate && (
              <p className="mt-4 text-sm text-gray-500">
                Valid until: {formatDate(quotation.validityDate)}
              </p>
            )}
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              Event Details &amp; Services
            </h2>

            <div className="mt-5 space-y-6">
              {quotation.events.map((event, index) => (
                <div
                  key={`${event.eventName}-${index}`}
                  className="rounded-xl border border-gray-200 p-5 sm:p-6"
                >
                  <h3 className="text-lg font-semibold">
                    {event.eventName}
                  </h3>

                  {event.eventDate && (
                    <p className="mt-2 text-sm text-gray-600">
                      Date: {formatDate(event.eventDate)}
                    </p>
                  )}

                  {event.venue && (
                    <p className="mt-1 text-sm text-gray-600">
                      Venue: {event.venue}
                    </p>
                  )}

                  <div className="mt-5 space-y-4">
                    {event.services.map((service, serviceIndex) => (
                      <div
                        key={`${service.name}-${serviceIndex}`}
                        className="flex items-start justify-between gap-4 border-t border-gray-100 pt-4"
                      >
                        <div>
                          <p className="font-medium">{service.name}</p>

                          {service.description && (
                            <p className="mt-1 text-sm text-gray-500">
                              {service.description}
                            </p>
                          )}

                          {service.quantity > 1 && (
                            <p className="mt-1 text-sm text-gray-500">
                              Quantity: {service.quantity}
                            </p>
                          )}
                        </div>

                        <p className="shrink-0 text-right font-medium">
                          {formatCurrency(
                            typeof service.total === "number"
                              ? service.total
                              : service.quantity * service.unitPrice
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {quotation.deliverables?.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold">Deliverables</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-700">
                {quotation.deliverables.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-xl bg-[#f7f5f0] p-6 sm:p-8">
            <h2 className="text-xl font-semibold">Quotation Summary</h2>

            <div className="mt-5 space-y-3">
              <div className="flex justify-between gap-4 text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(quotation.subtotal)}</span>
              </div>

              {quotation.discount > 0 && (
                <div className="flex justify-between gap-4 text-gray-600">
                  <span>Discount</span>
                  <span>−{formatCurrency(quotation.discount)}</span>
                </div>
              )}

              <div className="flex justify-between gap-4 border-t border-gray-300 pt-4 text-xl font-bold">
                <span>Total Amount</span>
                <span>{formatCurrency(quotation.totalAmount)}</span>
              </div>
            </div>
          </section>

          {quotation.paymentTerms?.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold">Payment Terms</h2>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-gray-700">
                {quotation.paymentTerms.map((term, index) => (
                  <li key={`${term.label}-${index}`}>
                    {term.label}
                    {typeof term.percentage === "number" && (
                      <> — {term.percentage}%</>
                    )}
                    {typeof term.amount === "number" && (
                      <> — {formatCurrency(term.amount)}</>
                    )}
                    {term.dueDate && (
                      <> — Due: {formatDate(term.dueDate)}</>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {quotation.termsAndConditions?.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold">
                Terms &amp; Conditions
              </h2>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-gray-700">
                {quotation.termsAndConditions.map((term, index) => (
                  <li key={`${term}-${index}`}>{term}</li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <footer className="border-t border-gray-200 px-6 py-6 text-center text-sm text-gray-500 sm:px-12">
          Thank you for considering Kutti Story Photography.
          <p className="mt-1">Capturing Life, One Story at a Time.</p>
        </footer>
      </article>
    </main>
  );
}
