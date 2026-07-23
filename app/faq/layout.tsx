import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "FAQ | Kutti Story Photography | Wedding Photographer in Madurai",

  description:
    "Find answers about Kutti Story Photography services, wedding photography packages, candid photography, cinematic wedding films, booking process, and event photography in Madurai.",

  keywords: [
    "Kutti Story Photography FAQ",
    "Wedding Photographer FAQ Madurai",
    "Wedding Photography Packages Madurai",
    "Candid Photography Madurai",
    "Wedding Videography Madurai"
  ],

  alternates: {
    canonical:
      "https://www.kuttistoryphotography.com/faq",
  },

  openGraph: {
    title:
      "FAQ | Kutti Story Photography | Wedding Photographer in Madurai",

    description:
      "Find answers about wedding photography, videography, packages, booking process and services offered by Kutti Story Photography.",

    url:
      "https://www.kuttistoryphotography.com/faq",

    siteName:
      "Kutti Story Photography",

    type:
      "website",
  },
};


export default function FaqLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}