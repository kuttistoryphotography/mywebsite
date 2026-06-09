import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Album from '@/models/Album';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const category  = searchParams.get('category');
    const adminView = searchParams.get('admin') === 'true';
    const page      = parseInt(searchParams.get('page') || '1');
    const limit     = parseInt(searchParams.get('limit') || '100');

    const filter: Record<string, unknown> = {};
    if (!adminView) filter.published = true;
    if (category && category !== 'all') filter.category = category;

    const skip = (page - 1) * limit;
    const [albums, total] = await Promise.all([
      Album.find(filter).sort({ sortOrder: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      Album.countDocuments(filter),
    ]);

    const formatted = albums.map((a: any) => ({
      id:          String(a._id),
      title:       a.title,
      slug:        a.slug,
      category:    a.category,
      coverImage:  a.coverImage ?? null,
      description: a.description ?? null,
      media:       Array.isArray(a.media) ? a.media : [],   // ← always include media
      mediaCount:  a.media?.length ?? 0,
      published:   a.published,
      sortOrder:   a.sortOrder,
      createdAt:   a.createdAt,
      updatedAt:   a.updatedAt,
    }));

    return NextResponse.json({ albums: formatted, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, albums: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin')
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });

    await connectDB();
    const { title, category, description, coverImage, media, published, sortOrder } = await request.json();
    if (!title || !category)
      return NextResponse.json({ error: 'title and category required' }, { status: 400 });

    // Generate unique slug
    let baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug;
    let n = 1;
    while (await Album.findOne({ slug })) { slug = `${baseSlug}-${n++}`; }

    const album = await Album.create({
      title, slug, category, description, coverImage,
      media: media || [], published: published ?? false,
      sortOrder: sortOrder ?? 0, createdBy: session.userId,
    });

    return NextResponse.json({ success: true, album }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
