import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title:
    "Photography & Videography Services in Madurai | Kutti Story Photography",

  description:
    "Kutti Story Photography offers professional wedding photography, candid photography, cinematic wedding videography, pre-wedding shoots, maternity photography, baby photography, event photography, and commercial photography services in Madurai and Tamil Nadu.",

  keywords: [
    "Photography Services in Madurai",
    "Wedding Photography Madurai",
    "Candid Wedding Photography Madurai",
    "Wedding Videography Madurai",
    "Pre Wedding Photography Madurai",
    "Maternity Photography Madurai",
    "Baby Photography Madurai",
    "Event Photography Madurai"
  ],

  alternates: {
    canonical:
      "https://www.kuttistoryphotography.com/services",
  },

  openGraph: {
    title:
      "Photography & Videography Services in Madurai | Kutti Story Photography",

    description:
      "Explore professional photography and videography services by Kutti Story Photography including weddings, events, portraits, maternity, baby shoots and commercial photography.",

    url:
      "https://www.kuttistoryphotography.com/services",

    siteName:
      "Kutti Story Photography",

    type:
      "website",
  },
};


export default function ServicesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}