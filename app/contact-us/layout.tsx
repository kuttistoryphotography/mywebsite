import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title:
    "Contact Kutti Story Photography | Wedding Photographer in Madurai",

  description:
    "Contact Kutti Story Photography in Madurai for wedding photography, candid photography, cinematic wedding videography, pre-wedding shoots, events, maternity, baby photography and professional photography services across Tamil Nadu.",

  keywords: [
    "Contact Wedding Photographer Madurai",
    "Kutti Story Photography Contact",
    "Wedding Photographer in Madurai",
    "Candid Photography Madurai",
    "Wedding Videography Madurai",
    "Photography Studio Madurai"
  ],

  alternates: {
    canonical:
      "https://www.kuttistoryphotography.com/contact-us",
  },

  openGraph: {
    title:
      "Contact Kutti Story Photography | Wedding Photographer in Madurai",

    description:
      "Get in touch with Kutti Story Photography for premium wedding photography and videography services in Madurai and Tamil Nadu.",

    url:
      "https://www.kuttistoryphotography.com/contact-us",

    siteName:
      "Kutti Story Photography",

    type:
      "website",
  },
};


export default function ContactLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}