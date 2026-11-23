
import type { Metadata } from "next";

const siteUrl = "https://kuttistoryphotography.com";
const logoUrl = `${siteUrl}/images/kutti-story-logo-white.png`;

export const metadata: Metadata = {
  title: "Wedding Packages 2026 | KuttiStory Photography",
  description:
    "Explore KuttiStory Photography's wedding photography and cinematic film packages.",

  openGraph: {
    title: "Wedding Packages 2026 | KuttiStory Photography",
    description:
      "Explore our wedding photography and cinematic film collections.",
    url: siteUrl,
    siteName: "KuttiStory Photography",
    images: [
      {
        url: logoUrl,
        alt: "KuttiStory Photography Logo",
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Wedding Packages 2026 | KuttiStory Photography",
    description:
      "Explore our wedding photography and cinematic film collections.",
    images: [logoUrl],
  },
};

export default function WeddingCatalogueLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
