import { Metadata } from "next";
import PortfolioDetailClient from "./PortfolioDetailClient";

interface PortfolioItem {
  id: number;
  title: string;
  slug: string;
  category: string;
  description: string | null;
  cover_image: string | null;
  images: string[];
  image_count: number;
  tags: string[];
  featured: boolean;
  event_date: string | null;
  location: string | null;
  client_name: string | null;

  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  focus_keywords: string[];

  seo?: {
    seoTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    focusKeywords?: string[];
    geoKeywords?: string[];
    aeoQuestions?: string[];
    aiDescription?: string;
    schemaType?: string;
    robots?: string;
  };

  created_at: string;
}

async function getPortfolioItem(id: string): Promise<PortfolioItem | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/portfolio/${id}`, {
      cache: 'no-store',
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    return data.item;
  } catch (error) {
    console.error('Error fetching portfolio item:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = await getPortfolioItem(id);
  
  if (!item) {
    return {
      title: 'Portfolio Not Found | Kutti Story',
      description: 'The portfolio item you are looking for could not be found.',
    };
  }

  const title =
    item.seo?.seoTitle ||
    item.meta_title ||
    `${item.title} - ${item.category} Photography | Kutti Story`;

  const description =
    item.seo?.metaDescription ||
    item.meta_description ||
    item.description ||
    `Professional ${item.category} photography by Kutti Story.`;
  const ogImage = item.og_image || item.cover_image || '/images/default-og.jpg';
  
  // Safely handle focus_keywords (could be array or string from API)
  const keywords =
  [
    ...(item.seo?.focusKeywords || item.focus_keywords || []),
    ...(item.seo?.geoKeywords || []),
  ].join(", ") ||
  `${item.category}, photography`;
  
  return {
    title,
    description,
    keywords,
    openGraph: {
    title,
    description,
    images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: item.title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical:
        item.seo?.canonicalUrl ||
        `${process.env.NEXT_PUBLIC_BASE_URL}/portfolio/${id}`,
    },

    robots: item.seo?.robots || "index,follow",
    
  };
}

function generateSchema(item: PortfolioItem) {
    return {
      "@context": "https://schema.org",
      "@type": item.seo?.schemaType || "ImageGallery",

      name: item.title,

      description:
        item.seo?.metaDescription ||
        item.meta_description ||
        item.description,

      image: item.cover_image,

      url:
        item.seo?.canonicalUrl ||
        `${process.env.NEXT_PUBLIC_BASE_URL}/portfolio/${item.id}`,

      creator: {
        "@type": "Organization",
        name: "Kutti Story Photography",
        url: "https://www.kuttistoryphotography.com",
      },
    };
  }

export default async function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const item = await getPortfolioItem(id);

  if (!item) {
    return <PortfolioDetailClient id={id} />;
  }

  const schema = generateSchema(item);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema),
        }}
      />

      <PortfolioDetailClient id={id} />
    </>
  );
}
