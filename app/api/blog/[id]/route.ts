import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Blog from '@/models/Blog';
import { getCurrentUser } from '@/lib/auth';

export function serializeBlog(blog: any) {
  return {
    id: blog._id?.toString(),
    title: blog.title || '',
    slug: blog.slug || '',
    excerpt: blog.excerpt || '',

    // ✅ FIX THIS
    content: blog.content || '',

    cover_image: blog.coverImage || '',
    image_alt:  blog.imageAlt || '',
    author_name: blog.authorName || '',
    category: blog.category || '',
    tags: blog.tags || [],
    status: blog.status || 'draft',
    is_featured: blog.isFeatured || false,
    view_count: blog.viewCount || 0,

    meta_title: blog.metaTitle || '',
    meta_description: blog.metaDescription || '',
    og_image: blog.ogImage || '',
    canonical_url: blog.canonicalUrl || '',
    focus_keywords: blog.focusKeywords || [],
    schema_type: blog.schemaType || 'Article',

    created_at: blog.createdAt,
    published_at: blog.publishedAt,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const blog = await Blog.findOne({
      $or: [
        { slug: id },
        ...(id.match(/^[a-f\d]{24}$/i)
          ? [{ _id: id }]
          : []),
      ],
    });
    console.log('blog------', blog);
    
    if (!blog) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      blog: serializeBlog(blog),
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'Failed to fetch blog' },
      { status: 500 }
    );
  }
}


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();

    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 401 }
      );
    }

    await connectDB();

    // ✅ unwrap params
    const { id } = await params;

    const body = await request.json();

    const {
      title,
      content,
      excerpt,
      cover_image,
      image_alt,   // <-- ADD THIS
      category,
      tags,
      status,
      is_featured,
      meta_title,
      meta_description,
      og_image,
      canonical_url,
      focus_keywords,
      schema_type,
    } = body;

    const update: Record<string, unknown> = {};

    if (title !== undefined) update.title = title;
    if (content !== undefined) update.content = content;
    if (excerpt !== undefined) update.excerpt = excerpt;
    if (cover_image !== undefined) update.coverImage = cover_image;
    if (image_alt !== undefined)
       update.imageAlt = image_alt;
    if (category !== undefined) update.category = category;
    if (tags !== undefined) update.tags = tags;
    if (is_featured !== undefined) update.isFeatured = !!is_featured;
    if (meta_title !== undefined) update.metaTitle = meta_title;
    if (meta_description !== undefined)
       update.metaDescription = meta_description;
    if (og_image !== undefined) update.ogImage = og_image;
    if (canonical_url !== undefined)
      update.canonicalUrl = canonical_url;
    if (focus_keywords !== undefined)
      update.focusKeywords = focus_keywords;
    if (schema_type !== undefined)
      update.schemaType = schema_type;
    if (status !== undefined) {
      update.status = status;
      update.published = status === 'published';

      if (status === 'published') {
        update.publishedAt = new Date();
      }
    }

    // ✅ use awaited id
    await Blog.findByIdAndUpdate(id, update);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'Failed to update blog' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }
    await connectDB();
    await Blog.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete blog' }, { status: 500 });
  }
}
