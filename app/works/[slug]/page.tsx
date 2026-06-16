import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getPortfolioBySlug } from "../../../lib/getPortfolioBySlug";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {

  const { slug } = await params;

  const item = await getPortfolioBySlug(slug);

  if (!item) {
    return {
      title: "Portfolio Not Found",
    };
  }

  return {
  title:
    item.metaTitle ||
    `${item.title} | Wedding Photography in Madurai | Kutti Story Photography`,

  description:
    item.metaDescription ||
    item.description ||
    "Professional wedding photography in Madurai by Kutti Story Photography.",

  alternates: {
    canonical: `https://www.kuttistoryphotography.com/works/${item.slug}`,
  },

  openGraph: {
    title: item.title,
    description:
      item.metaDescription ||
      item.description ||
      "Professional wedding photography in Madurai",

    url: `https://www.kuttistoryphotography.com/works/${item.slug}`,

    images: [
      {
        url: item.coverImage || "/images/og-image.jpg",
      },
    ],
  },
};
} // <-- add this closing brace

export default async function PortfolioPage(
  { params }: Props
) {
  const { slug } = await params;

  const item = await getPortfolioBySlug(slug);

  if (!item) {
    notFound();
  }

  return (
    <main className="max-w-6xl mx-auto py-20 px-6">

      <h1 className="text-4xl font-bold mb-6">
        {item.title}
      </h1>

      <p className="mb-8">
        {item.description}
      </p>

      {item.coverImage && (
        <img
          src={item.coverImage}
          alt={item.title}
          className="rounded-xl mb-10"
        />
      )}

    </main>
  );
}