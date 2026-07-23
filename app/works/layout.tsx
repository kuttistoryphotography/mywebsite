import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title:
    "Wedding Photography Portfolio in Madurai | Kutti Story Photography",

  description:
    "Explore Kutti Story Photography portfolio featuring cinematic wedding photography, candid wedding moments, engagement shoots, pre-wedding photography, traditional Tamil weddings, and beautiful stories captured across Madurai and Tamil Nadu.",

  keywords: [
    "Wedding Photography Portfolio Madurai",
    "Kutti Story Photography Portfolio",
    "Candid Wedding Photos Madurai",
    "Wedding Photographer Madurai",
    "Pre Wedding Photoshoot Madurai",
    "Engagement Photography Madurai",
    "Tamil Wedding Photography"
  ],

  alternates: {
    canonical:
      "https://www.kuttistoryphotography.com/works",
  },

  openGraph: {
    title:
      "Wedding Photography Portfolio in Madurai | Kutti Story Photography",

    description:
      "View our latest wedding photography, candid moments, cinematic wedding films, pre-wedding shoots and creative photography stories.",

    url:
      "https://www.kuttistoryphotography.com/works",

    siteName:
      "Kutti Story Photography",

    type:
      "website",
  },
};


export default function WorksLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}