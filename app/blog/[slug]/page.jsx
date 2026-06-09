import BlogPost from "../../../components/blog/blogpost";
import { getBlogBySlug } from "@/lib/getBlog";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const blog = await getBlogBySlug(resolvedParams?.slug);

  if (!blog) {
    return {
      title: "Blog | Kutti Story",
      description: "Latest stories and photography insights from Kutti Story.",
    };
  }

  const title = blog.meta_title || blog.title;
  const description = blog.meta_description || blog.excerpt || "Photography insights from Kutti Story.";
  const image = blog.og_image || blog.cover_image || "/images/og-default.jpg";
  const canonicalPath = blog.canonical_url || `/blog/${blog.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonicalPath,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    keywords: blog.focus_keywords || blog.tags || [],
  };
}

export default function BlogPosts() {
  return <BlogPost />;
}
