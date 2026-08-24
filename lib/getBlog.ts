// import connectDB from './db';
// import Blog from '@/models/Blog';

// export interface BlogPost {
//   id: string;
//   title: string;
//   slug: string;
//   excerpt: string;
//   content: string;
//   author_name: string;
//   cover_image: string;
//   tags: string[];
//   published: boolean;
//   view_count: number;
//   meta_title: string;
//   meta_description: string;
//   createdAt: Date;
// }

// export async function getAllBlogs(limit = 10, publishedOnly = true): Promise<BlogPost[]> {
//   await connectDB();
//   const filter = publishedOnly ? { published: true } : {};
//   const blogs = await Blog.find(filter)
//     .select('-content')
//     .sort({ createdAt: -1 })
//     .limit(limit);

//   return blogs.map((b) => ({
//     id: String(b._id),
//     title: b.title,
//     slug: b.slug,
//     excerpt: b.excerpt || '',
//     content: '',
//     author_name: '',
//     cover_image: b.coverImage || '',
//     tags: b.tags,
//     published: b.published,
//     view_count: b.viewCount,
//     meta_title: b.metaTitle || '',
//     meta_description: b.metaDescription || '',
//     createdAt: b.createdAt,
//   }));
// }

// export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
//   await connectDB();
//   const b = await Blog.findOne({ slug });
//   if (!b) return null;
//   await Blog.findByIdAndUpdate(b._id, { $inc: { viewCount: 1 } });
//   return {
//     id: String(b._id),
//     title: b.title,
//     slug: b.slug,
//     excerpt: b.excerpt || '',
//     content: b.content,
//     author_name: '',
//     cover_image: b.coverImage || '',
//     tags: b.tags,
//     published: b.published,
//     view_count: b.viewCount,
//     meta_title: b.metaTitle || '',
//     meta_description: b.metaDescription || '',
//     createdAt: b.createdAt,
//   };
// }


import connectDB from './db';
import Blog from '@/models/Blog';

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
  published_at: Date | null;
}

function mapBlog(b: any, includeContent = true): BlogPost {
  return {
    id:             String(b._id),
    title:          b.title,
    slug:           b.slug,
    excerpt:        b.excerpt || '',
    content:        includeContent ? (b.content || '') : '',
    author_name:    "Kutti Story Photography",
    cover_image:    b.coverImage || '',
    gallery_images: Array.isArray(b.galleryImages)
    ? b.galleryImages
    : [],
    gallery_stories: Array.isArray(b.galleryStories)
    ? b.galleryStories
    : [],
    image_alt: b.imageAlt || '',
    category: b.category || 'General',
    
    tags:           b.tags || [],
    published:      !!b.published,
    is_featured:    !!b.isFeatured,
    view_count:     b.viewCount || 0,
    meta_title:     b.metaTitle || '',
    meta_description: b.metaDescription || '',
    og_image:       b.ogImage || '',
    canonical_url:  b.canonicalUrl || '',
    focus_keywords: b.focusKeywords || [],
    schema_type:    b.schemaType || 'Article',
    status:         b.published ? 'published' : (b.status || 'draft'),
    createdAt:      b.createdAt,
    published_at:   b.publishedAt || null,
  };
}

export async function getAllBlogs(limit = 0, publishedOnly = true): Promise<BlogPost[]> {
  await connectDB();

  const filter = publishedOnly ? { published: true } : {};

  let query = Blog.find(filter).sort({ createdAt: -1 });

  if (limit > 0) {
    query = query.limit(limit);
  }

  const blogs = await query;

  return blogs.map((b) => mapBlog(b, false));
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  await connectDB();

  const b = await Blog.findOne({ slug }).lean();

  if (!b) return null;

  await Blog.findByIdAndUpdate(b._id, {
    $inc: { viewCount: 1 },
  });

  return mapBlog(b, true);
}