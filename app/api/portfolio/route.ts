import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import PortfolioItem from '@/models/Portfolio';
import { getCurrentUser } from '@/lib/auth';
import { stringsToMediaItems } from '@/lib/media';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const category  = searchParams.get('category');
    const featured  = searchParams.get('featured');
    const adminView = searchParams.get('admin') === 'true';
    const page      = parseInt(searchParams.get('page')  || '1');
    const limit     = parseInt(searchParams.get('limit') || '0');

    const filter: Record<string, unknown> = {};
    if (!adminView) filter.published = true;
    if (category && category !== 'all') filter.category = category;
    if (featured === 'true') filter.featured = true;

    let query = PortfolioItem.find(filter).sort({ sortOrder: 1, createdAt: -1 });
    let total = 0;
    if (limit > 0) {
      total = await PortfolioItem.countDocuments(filter);
      query = query.skip((page - 1) * limit).limit(limit) as any;
    }

    const items = await query.lean();

    const mapped = items.map((item: any) => ({
      id:               String(item._id),
      title:            item.title,
      slug:             item.slug,
      category:         item.category,
      description:      item.description,
      // Cover
      cover_image:      item.coverImage,
      coverMediaType:   item.coverMediaType || 'image',
      // Typed media array
      media:            item.media || [],
      // Legacy flat arrays — kept for components not yet migrated
      images:           (item.media || []).map((m: any) => m.url),
      image_count:      item.imageCount || (item.media || []).length,
      tags:             item.tags,
      featured:         item.featured,
      published:        item.published,
      event_date:       item.eventDate,
      location:         item.location,
      client_name:      item.clientName,
      view_count:       item.viewCount,
      sort_order:       item.sortOrder,
      meta_title:       item.metaTitle,
      meta_description: item.metaDescription,
      og_image:         item.ogImage,
      focus_keywords:   item.focusKeywords,
      created_at:       item.createdAt,
    }));

    if (limit > 0) {
      return NextResponse.json({ items: mapped, total, page, totalPages: Math.ceil(total / limit), hasMore: page * limit < total });
    }
    return NextResponse.json({ items: mapped });
  } catch (error: any) {
    console.error('Portfolio GET error:', error);
    return NextResponse.json({ error: error.message, items: [] }, { status: 500 });
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
      title, category, description,
      cover_image, coverMediaType,
      // Accept either typed `media` array or legacy flat `images` array + typeMap
      media, images, imageTypeMap,
      tags, featured, published,
      event_date, location, client_name,
      meta_title, meta_description, og_image, focus_keywords, sort_order,
    } = body;

    if (!title || !category) {
      return NextResponse.json({ error: 'Title and category are required' }, { status: 400 });
    }

    const slugBase = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = slugBase;
    let suffix = 1;
    while (await PortfolioItem.findOne({ slug })) { slug = `${slugBase}-${++suffix}`; }

    // Build typed media array
    let typedMedia = media && Array.isArray(media) ? media : [];
    if (!typedMedia.length && images?.length) {
      // Legacy: flat URL array — caller may pass typeMap { [url]: mediaType }
      typedMedia = stringsToMediaItems(images, imageTypeMap || {});
    }

    const item = await PortfolioItem.create({
      title, slug, category, description,
      coverImage:     cover_image,
      coverMediaType: coverMediaType || 'image',
      media:          typedMedia,
      imageCount:     typedMedia.length,
      tags:           tags || [],
      featured:       !!featured,
      published:      !!published,
      eventDate:      event_date ? new Date(event_date) : undefined,
      location, clientName: client_name,
      metaTitle: meta_title, metaDescription: meta_description,
      ogImage: og_image, focusKeywords: focus_keywords || [],
      sortOrder: sort_order || 0,
      createdBy: session.userId,
    });

    return NextResponse.json({ success: true, id: String(item._id) });
  } catch (error: any) {
    if (error.code === 11000) return NextResponse.json({ error: 'Title already exists' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create portfolio item' }, { status: 500 });
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
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const fieldMap: Record<string, string> = {
      cover_image:      'coverImage',
      coverMediaType:   'coverMediaType',
      client_name:      'clientName',
      event_date:       'eventDate',
      meta_title:       'metaTitle',
      meta_description: 'metaDescription',
      og_image:         'ogImage',
      focus_keywords:   'focusKeywords',
      sort_order:       'sortOrder',
    };

    const update: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(updates)) {
      const mongoKey = fieldMap[k] || k;
      if (k === 'media') {
        update.media = v;
        update.imageCount = Array.isArray(v) ? (v as any[]).length : 0;
      } else if (k === 'images' && !updates.media) {
        // Legacy flat images — convert with optional typeMap
        const typeMap = (updates as any).imageTypeMap || {};
        const typed = stringsToMediaItems(v as string[], typeMap);
        update.media      = typed;
        update.imageCount = typed.length;
      } else if (k === 'event_date') {
        update.eventDate = v ? new Date(v as string) : null;
      } else {
        update[mongoKey] = v;
      }
    }

    if (updates.title) {
      const slugBase = (updates.title as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      update.slug = slugBase;
    }

    await PortfolioItem.findByIdAndUpdate(id, update);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update portfolio item' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await PortfolioItem.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
