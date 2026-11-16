
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read the Privacy Policy of Kutti Story Photography to understand how we collect, use, store and protect customer information, photographs and videos.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

const sections = [
  {
    title: "1. Introduction",
    content: [
      "Welcome to Kutti Story Photography. We respect your privacy and are committed to protecting the personal information, photographs, videos and other details you share with us.",
      "This Privacy Policy explains how we collect, use, process, store, disclose and protect your information when you visit our website, contact us, enquire about our services or engage us for photography and videography services.",
      "By using our website or voluntarily providing your information, you acknowledge this Privacy Policy.",
    ],
  },
  {
    title: "2. About Us",
    content: [
      "Kutti Story Photography provides professional photography and videography services, including wedding photography, candid photography, cinematic wedding films, pre-wedding and post-wedding shoots, engagement photography, maternity and baby photography, portraits, family photography and event coverage.",
    ],
  },
  {
    title: "3. Information We Collect",
    content: [
      "Personal information may include your full name, mobile number, email address, residential or communication address and other contact information voluntarily provided by you.",
      "Enquiry and event information may include event type, date, time, venue, selected package, service requirements, booking details, payment records and additional instructions.",
      "While providing our services, we may capture and process event photographs, personal portraits, family photographs, video recordings, edited photographs, cinematic videos and album designs.",
      "Payment-related records may include booking advances, payment amounts, dates, transaction references and payment confirmations. We do not intend to collect complete card numbers, banking passwords or UPI PINs through ordinary enquiry communications.",
      "Technical information may include IP address, browser type, device information, pages visited, website interactions and cookie information, depending on the website features enabled.",
    ],
  },
  {
    title: "4. How We Use Your Information",
    content: [
      "We use collected information to respond to enquiries, communicate about services, prepare quotations, manage client agreements, coordinate event coverage, provide photography and editing services, prepare albums, deliver photographs and videos, process payments, provide customer support, maintain business records, improve our website and comply with applicable legal requirements.",
    ],
  },
  {
    title: "5. Photographs, Videos and Promotional Use",
    content: [
      "Selected event photographs and video clips may be considered for use on our website, portfolio, social media accounts, promotional campaigns, advertisements and business presentations.",
      "Promotional use is subject to applicable privacy requirements and appropriate consent or other lawful permission.",
      "If you do not wish your photographs or videos to be used for promotional purposes, please inform Kutti Story Photography in writing before the event or, wherever reasonably possible, before publication.",
      "Clients should inform us if they are aware of specific privacy restrictions relating to other individuals appearing in event photographs or videos.",
    ],
  },
  {
    title: "6. Sharing of Information",
    content: [
      "We do not sell personal information to third parties.",
      "Where reasonably necessary, information may be shared with photography and videography team members, editing professionals, album printing vendors, delivery providers, website hosting providers, cloud storage providers, payment service providers and professional advisers.",
      "Information may also be disclosed to government authorities or law enforcement agencies where legally required.",
      "Third-party providers may process information under their own terms and privacy practices.",
    ],
  },
  {
    title: "7. Cookies and Website Technologies",
    content: [
      "Our website or integrated third-party services may use cookies or similar technologies to enable essential website functionality, maintain security, understand website usage, improve performance and measure marketing effectiveness where enabled.",
      "You may control cookies through your browser settings. Disabling certain cookies may affect some website features.",
      "Where consent is required by applicable law for non-essential cookies or tracking technologies, appropriate consent will be sought.",
    ],
  },
  {
    title: "8. Data Storage and Security",
    content: [
      "We take reasonable technical and organisational measures to protect information against unauthorised access, misuse, alteration, disclosure or loss.",
      "Information and project materials may be stored using business systems, local storage devices and third-party digital storage services, depending on the service involved.",
      "No electronic storage system, internet transmission or digital platform can be guaranteed to be completely secure.",
      "Clients are encouraged to download delivered photographs and videos and maintain independent backup copies.",
    ],
  },
  {
    title: "9. Data Retention",
    content: [
      "We retain personal information and project materials only for as long as reasonably necessary for the purposes for which they were collected, subject to contractual requirements, operational needs and applicable law.",
      "We make reasonable efforts to protect and retain project files for up to 12 months from the event date, subject to storage availability and operational requirements.",
      "Clients are responsible for downloading delivered digital files and maintaining independent backups. Online download links may only remain available for the communicated availability period.",
      "Permanent storage or indefinite availability of photographs, videos or download links is not guaranteed.",
      "Retrieval, restoration or copying beyond the applicable storage period may incur additional charges where files remain available. Files may be deleted after the applicable storage period, and recovery cannot be guaranteed.",
      "Certain business, payment, contractual or legal records may be retained longer where required or permitted by applicable law.",
    ],
  },
  {
    title: "10. Your Privacy Choices and Requests",
    content: [
      "Subject to applicable law, you may contact us to request information about personal data you have provided, correction of inaccurate information, deletion where legally and operationally permissible, withdrawal of consent where processing is based on consent, or clarification about the use of your photographs and videos.",
      "Some information may need to be retained to fulfil contractual obligations, resolve disputes, maintain required business records or comply with applicable law.",
      "We may need to verify your identity before responding to requests involving personal information.",
    ],
  },
  {
    title: "11. Third-Party Websites and Services",
    content: [
      "Our website or communications may contain links to third-party websites, social media platforms, payment services or other external services.",
      "We are not responsible for the privacy policies, security practices or content of third-party websites and platforms. We encourage you to review their privacy policies before providing personal information.",
    ],
  },
  {
    title: "12. Children's Privacy",
    content: [
      "Our services may involve baby photography, children's portraits, birthday photography and family events.",
      "Where personal information or identifiable photographs of children are involved, the parent or lawful guardian should provide the necessary information and permissions.",
      "We do not knowingly seek personal information directly from children for independent marketing or promotional purposes.",
      "Processing involving children's personal data will be handled subject to applicable legal requirements and appropriate parental or guardian authorisation.",
    ],
  },
  {
    title: "13. Changes to This Privacy Policy",
    content: [
      "We may update this Privacy Policy to reflect changes in our business practices, website features, technology or applicable legal requirements.",
      "The revised version will be published on this page with an updated Last Updated date. We encourage visitors and clients to review this page periodically.",
    ],
  },
  {
    title: "14. Contact and Privacy Enquiries",
    content: [
      "For questions, concerns, correction requests, deletion requests or other privacy-related matters, please contact Kutti Story Photography using the contact details below.",
    ],
  },
  {
    title: "15. Applicable Law",
    content: [
      "This Privacy Policy is intended to be interpreted in accordance with the applicable laws of India, including applicable data protection and privacy laws.",
      "Where applicable, we will handle personal data in accordance with the Digital Personal Data Protection Act, 2023 and the rules and provisions brought into force under it.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="px-5 sm:px-8 pt-28 pb-16">
        <div className="max-w-5xl mx-auto">
          <p className="text-orange-500 text-xs tracking-[0.3em] uppercase mb-5">
            Legal Information
          </p>

          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight">
            Privacy <span className="text-orange-500">Policy</span>
          </h1>

          <p className="text-gray-400 mt-6 max-w-2xl leading-7">
            Your privacy matters to us. Learn how Kutti Story Photography
            collects, uses and protects your personal information,
            photographs and videos.
          </p>

          <div className="border-y border-white/10 mt-10 py-5 flex flex-wrap gap-6 text-sm text-gray-400">
            <span>Kutti Story Photography</span>
            <span>Effective: 16 November 2026</span>
            <span>Last Updated: 16 November 2026</span>
          </div>

          <div className="grid md:grid-cols-[240px_1fr] gap-12 mt-14">
            <aside className="hidden md:block">
              <div className="sticky top-24 border border-white/10 rounded-2xl p-5">
                <p className="text-xs uppercase tracking-widest text-orange-500 mb-5">
                  On this page
                </p>
                <nav className="space-y-3 text-sm text-gray-400">
                  {sections.map((section, index) => (
                    <a
                      key={section.title}
                      href={`#privacy-${index + 1}`}
                      className="block hover:text-orange-500 transition-colors"
                    >
                      {section.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            <article className="space-y-12">
              {sections.map((section, index) => (
                <section
                  key={section.title}
                  id={`privacy-${index + 1}`}
                  className="scroll-mt-28"
                >
                  <h2 className="text-xl sm:text-2xl font-semibold mb-5">
                    {section.title}
                  </h2>

                  <div className="space-y-4 text-gray-400 text-sm sm:text-base leading-8">
                    {section.content.map((paragraph, paragraphIndex) => (
                      <p key={paragraphIndex}>{paragraph}</p>
                    ))}
                  </div>

                  {index === 13 && (
                    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-3 text-sm text-gray-300">
                      <p className="font-semibold text-white">
                        Kutti Story Photography
                      </p>
                      <p>
                        No. 39, Second State Bank Colony, First Street,
                        Near Porkudam Apartments, Bypass Road, Madurai –
                        625016, Tamil Nadu, India.
                      </p>
                      <p>
                        Email:{" "}
                        <a
                          href="mailto:kuttistoryphotography@gmail.com"
                          className="text-orange-500 hover:underline"
                        >
                          kuttistoryphotography@gmail.com
                        </a>
                      </p>
                      <p>
                        Phone:{" "}
                        <a
                          href="tel:+919342013600"
                          className="text-orange-500 hover:underline"
                        >
                          +91 93420 13600
                        </a>
                      </p>
                      <a
                        href="https://www.kuttistoryphotography.com"
                        className="text-orange-500 hover:underline"
                      >
                        www.kuttistoryphotography.com
                      </a>
                    </div>
                  )}
                </section>
              ))}

              <div className="border-t border-white/10 pt-8">
                <p className="text-sm text-gray-500">
                  © 2026 Kutti Story Photography. All Rights Reserved.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
