import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import connectDB from '@/lib/db';
import FaqSettings from '@/models/FaqSettings';

export const dynamic = 'force-dynamic';

const DEFAULT_KEYWORDS = [
  'Kutti Story Photography FAQ',
  'Wedding Photographer FAQ Madurai',
  'Wedding Photography Packages Madurai',
  'Candid Photography Madurai',
  'Wedding Videography Madurai',
];

const FAQ_URL = 'https://www.kuttistoryphotography.com/faq';

export async function generateMetadata(): Promise<Metadata> {
  try {
    await connectDB();

    const settings = await FaqSettings.findOne()
      .select('heading description seoKeywords')
      .lean();

    const heading =
      settings?.heading || 'Frequently Asked Questions';

    const description =
      settings?.description ||
      'Find answers about Kutti Story Photography services, wedding photography packages, candid photography, cinematic wedding films, booking process, and event photography in Madurai.';

    const keywords =
      Array.isArray(settings?.seoKeywords) &&
      settings.seoKeywords.length > 0
        ? settings.seoKeywords
        : DEFAULT_KEYWORDS;

    const title = `${heading} | Kutti Story Photography | Wedding Photographer in Madurai`;

    return {
      title,
      description,
      keywords,

      alternates: {
        canonical: FAQ_URL,
      },

      openGraph: {
        title,
        description,
        url: FAQ_URL,
        siteName: 'Kutti Story Photography',
        type: 'website',
      },

      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },

      robots: {
        index: true,
        follow: true,
      },
    };
  } catch (error) {
    console.error('FAQ metadata error:', error);

    return {
      title:
        'FAQ | Kutti Story Photography | Wedding Photographer in Madurai',

      description:
        'Find answers about Kutti Story Photography services, wedding photography packages, candid photography, cinematic wedding films, booking process, and event photography in Madurai.',

      keywords: DEFAULT_KEYWORDS,

      alternates: {
        canonical: FAQ_URL,
      },

      robots: {
        index: true,
        follow: true,
      },
    };
  }
}

export default function FaqLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}