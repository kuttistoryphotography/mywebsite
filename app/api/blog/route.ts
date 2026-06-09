import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Blog from '@/models/Blog';
import { getCurrentUser } from '@/lib/auth';

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function buildUniqueSlug(baseTitle: string, excludeId?: string): Promise<string> {
  const base = slugify(baseTitle) || `blog-${Date.now()}`;
  let candidate = base;
  let suffix = 1;
  while (true) {
    const q: Record<string, unknown> = { slug: candidate };
    if (excludeId) q._id = { $ne: excludeId };
    const exists = await Blog.findOne(q).select('_id');
    if (!exists) return candidate;
    suffix++;
    candidate = `${base}-${suffix}`;
  }
}

/** Normalize a raw Mongoose blog doc → consistent API shape */
function serializeBlog(b: any, includeContent = true) {
  return {
    id:               String(b._id),
    title:            b.title,
    slug:             b.slug,
    excerpt:          b.excerpt || '',
    content:          includeContent ? (b.content || '') : '',
    cover_image:      b.coverImage || '',
    author_name:      '',
    category:         b.category || 'General',
    tags:             b.tags || [],
    status:           b.published ? 'published' : (b.status || 'draft'),
    is_featured:      !!b.isFeatured,
    view_count:       b.viewCount || 0,
    meta_title:       b.metaTitle || '',
    meta_description: b.metaDescription || '',
    og_image:         b.ogImage || '',
    canonical_url:    b.canonicalUrl || '',
    focus_keywords:   b.focusKeywords || [],
    schema_type:      b.schemaType || 'Article',
    created_at:       b.createdAt,
    published_at:     b.publishedAt || null,
  };
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const adminView = searchParams.get('admin') === 'true';
    const statusFilter = searchParams.get('status');
    const limitParam = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = isNaN(limitParam) ? 10 : limitParam;

    const filter: Record<string, unknown> = {};
    if (!adminView) {
      if (statusFilter === 'published') {
        filter.published = true;
      } else if (!statusFilter) {
        filter.published = true;
      }
    }

    const skip = (page - 1) * limit;
    const [blogs, total] = await Promise.all([
      Blog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Blog.countDocuments(filter),
    ]);
    console.log('blllll--------', blogs);
    
    return NextResponse.json({
      blogs: blogs.map((b) => serializeBlog(b)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[Blog GET]', error);
    return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const {
      title, content, excerpt, cover_image, category, tags, status, is_featured,
      meta_title, meta_description, og_image, canonical_url, focus_keywords, schema_type,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const isPublished = status === 'published';
    const slug = await buildUniqueSlug(title);

    const blog = await Blog.create({
      title:          title.trim(),
      slug,
      content,
      excerpt:        excerpt || '',
      coverImage:     cover_image || '',
      category:       category || 'General',
      tags:           Array.isArray(tags) ? tags : [],
      published:      isPublished,
      status:         status || 'draft',
      isFeatured:     !!is_featured,
      publishedAt:    isPublished ? new Date() : undefined,
      authorId:       session.userId,
      metaTitle:      meta_title || '',
      metaDescription: meta_description || '',
      ogImage:        og_image || '',
      canonicalUrl:   canonical_url || '',
      focusKeywords:  Array.isArray(focus_keywords) ? focus_keywords : [],
      schemaType:     schema_type || 'Article',
    });

    return NextResponse.json({ success: true, id: String(blog._id), slug: blog.slug }, { status: 201 });
  } catch (error) {
    console.error('[Blog POST]', error);
    return NextResponse.json({ error: 'Failed to create blog' }, { status: 500 });
  }
}


export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { id, title, content, excerpt, coverImage, tags, published, metaTitle, metaDescription } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const update: Record<string, unknown> = {};
    if (title !== undefined) { update.title = title; update.slug = await buildUniqueSlug(title, id); }
    if (content !== undefined) update.content = content;
    if (excerpt !== undefined) update.excerpt = excerpt;
    if (coverImage !== undefined) update.coverImage = coverImage;
    if (tags !== undefined) update.tags = tags;
    if (published !== undefined) {
      update.published = published;
      if (published) update.publishedAt = new Date();
    }
    if (metaTitle !== undefined) update.metaTitle = metaTitle;
    if (metaDescription !== undefined) update.metaDescription = metaDescription;

    await Blog.findByIdAndUpdate(id, update);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update blog' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await Blog.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete blog' }, { status: 500 });
  }
}
