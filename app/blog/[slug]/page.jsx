import BlogPost from "../../../components/blog/blogpost";
import { getBlogBySlug } from "@/lib/getBlog";
import Script from "next/script";

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
  const image =
        blog.og_image ||
        blog.cover_image ||
        "https://www.kuttistoryphotography.com/images/og-default.jpg";
  const canonicalPath =
        blog.canonical_url?.trim() ||
        `https://www.kuttistoryphotography.com/blog/${blog.slug}`;

  const publishedTime = blog.createdAt;
  const modifiedTime = blog.updatedAt || blog.createdAt;

  return {
    metadataBase: new URL("https://www.kuttistoryphotography.com"),

    title,
    description,
    
    authors: [
      {
        name: blog.author_name,
      },
    ],

    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonicalPath,
      siteName: "Kutti Story Photography",
      publishedTime,
      modifiedTime,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: "@kuttistoryphoto",
      images: [image],
    },

    keywords:
    blog.focus_keywords?.length
      ? blog.focus_keywords
      : blog.tags,
  };
}

export default async function BlogPosts({ params }) {
  const resolvedParams = await params;
  const blog = await getBlogBySlug(resolvedParams?.slug);

  return (
    <>
      {blog && (
        <>
          <Script
            id="blog-schema"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                headline: blog.title,
                description: blog.meta_description || blog.excerpt,

                mainEntityOfPage: {
                  "@type": "WebPage",
                  "@id":
                    blog.canonical_url ||
                    `https://www.kuttistoryphotography.com/blog/${blog.slug}`,
                },

                url:
                  blog.canonical_url ||
                  `https://www.kuttistoryphotography.com/blog/${blog.slug}`,

                image: blog.og_image || blog.cover_image,
                datePublished: blog.published_at || blog.createdAt,
                dateModified: blog.createdAt,

                author: {
                  "@type": "Organization",
                  name: blog.author_name,
                },

                publisher: {
                  "@type": "Organization",
                  name: "Kutti Story Photography",
                  logo: {
                    "@type": "ImageObject",
                    url: "https://www.kuttistoryphotography.com/favicon.svg",
                  },
                },

                inLanguage: "en-IN",
              }),
            }}
          />

          <Script
            id="breadcrumb-schema"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  {
                    "@type": "ListItem",
                    position: 1,
                    name: "Home",
                    item: "https://www.kuttistoryphotography.com",
                  },
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: "Blog",
                    item: "https://www.kuttistoryphotography.com/blog",
                  },
                  {
                    "@type": "ListItem",
                    position: 3,
                    name: blog.title,
                    item:
                      blog.canonical_url ||
                      `https://www.kuttistoryphotography.com/blog/${blog.slug}`,
                  },
                ],
              }),
            }}
          />
        </>
      )}

      <BlogPost blog={blog} />
    </>
  );
}
