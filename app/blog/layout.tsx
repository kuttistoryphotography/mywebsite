import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title:
    "Wedding Photography Blog | Tips, Ideas & Stories | Kutti Story Photography",

  description:
    "Read Kutti Story Photography blogs about wedding photography tips, candid photography ideas, pre-wedding shoots, Tamil wedding traditions, photography guides, and creative stories from Madurai and Tamil Nadu.",

  keywords: [
    "Wedding Photography Blog",
    "Wedding Photography Tips",
    "Wedding Photography Ideas",
    "Candid Wedding Photography Tips",
    "Pre Wedding Photography Ideas",
    "Tamil Wedding Photography Blog",
    "Kutti Story Photography Blog"
  ],

  alternates: {
    canonical:
      "https://www.kuttistoryphotography.com/blog",
  },

  openGraph: {
    title:
      "Wedding Photography Blog | Kutti Story Photography",

    description:
      "Explore wedding photography guides, creative ideas, tips and stories from Kutti Story Photography in Madurai.",

    url:
      "https://www.kuttistoryphotography.com/blog",

    siteName:
      "Kutti Story Photography",

    type:
      "website",
  },
};


export default function BlogLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}