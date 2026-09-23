import connectDB from "./db";
import Blog from "@/models/Blog";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author_name: string;
  cover_image: string;

  gallery_images: string[];

  gallery_stories: {
    label: string;
    title: string;
    text: string;
  }[];

  image_alt: string;
  category: string;
  tags: string[];

  published: boolean;
  is_featured: boolean;
  view_count: number;

  meta_title: string;
  meta_description: string;

  og_image: string;
  canonical_url: string;

  focus_keywords: string[];
  schema_type: string;
  status: string;

  createdAt: Date;
  updatedAt: Date;
  published_at: Date | null;
}

function mapBlog(
  b: any,
  includeContent = true
): BlogPost {
  return {
    id: String(b._id),

    title: b.title,

    slug: b.slug,

    excerpt: b.excerpt || "",

    content: includeContent
      ? b.content || ""
      : "",

    author_name:
      "Kutti Story Photography",

    cover_image:
      b.coverImage || "",

    gallery_images:
      Array.isArray(b.galleryImages)
        ? b.galleryImages
        : [],

    gallery_stories:
      Array.isArray(b.galleryStories)
        ? b.galleryStories
        : [],

    image_alt:
      b.imageAlt || "",

    category:
      b.category || "General",

    tags:
      Array.isArray(b.tags)
        ? b.tags
        : [],

    published:
      b.published === true ||
      b.status === "published",

    is_featured:
      b.isFeatured === true,

    view_count:
      b.viewCount || 0,

    meta_title:
      b.metaTitle || "",

    meta_description:
      b.metaDescription || "",

    og_image:
      b.ogImage || "",

    canonical_url:
      b.canonicalUrl || "",

    focus_keywords:
      Array.isArray(b.focusKeywords)
        ? b.focusKeywords
        : [],

    schema_type:
      b.schemaType || "Article",

    status:
      b.status ||
      (b.published ? "published" : "draft"),

    createdAt:
      b.createdAt,

    updatedAt:
      b.updatedAt || b.createdAt,

    published_at:
      b.publishedAt ||
      (b.status === "published"
        ? b.updatedAt || b.createdAt
        : null),
  };
}


/**
 * Get all published blogs
 *
 * A blog is considered published when:
 *
 * published === true
 *
 * OR
 *
 * status === "published"
 */
export async function getAllBlogs(
  limit = 0,
  publishedOnly = true
): Promise<BlogPost[]> {

  await connectDB();

  const filter = publishedOnly
    ? {
        $or: [
          {
            published: true,
          },
          {
            status: "published",
          },
        ],
      }
    : {};

  let query = Blog.find(filter)
    .sort({
      createdAt: -1,
    });

  if (limit > 0) {
    query = query.limit(limit);
  }

  const blogs = await query.lean();

  return blogs.map((blog) =>
    mapBlog(blog, false)
  );
}


/**
 * Get one blog by slug
 */
export async function getBlogBySlug(
  slug: string
): Promise<BlogPost | null> {

  await connectDB();

  if (!slug) {
    return null;
  }

  const blog = await Blog.findOne({
    slug,
  }).lean();

  if (!blog) {
    return null;
  }

  /*
   * Increment view count.
   * This is intentionally done after retrieving
   * the blog so the page can still render.
   */
  try {
    await Blog.findByIdAndUpdate(
      blog._id,
      {
        $inc: {
          viewCount: 1,
        },
      }
    );
  } catch (error) {
    console.error(
      "Failed to update blog view count:",
      error
    );
  }

  return mapBlog(blog, true);
}