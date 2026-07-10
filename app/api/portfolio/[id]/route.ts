import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import PortfolioItem from '@/models/Portfolio';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const item = await PortfolioItem.findOne({
      $or: [
        { slug: params.id },
        ...(params.id.match(/^[a-f\d]{24}$/i) ? [{ _id: params.id }] : []),
      ],
    });

    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Build typed media array from item.media (the real field)
    const mediaArr = (item.media || []).map((m) => ({
      url:       m.url,
      mediaType: m.mediaType,
      caption:   m.caption,
    }));

    // Legacy flat string array for components that haven't migrated yet
    const imagesFlat = mediaArr.map((m) => m.url);

    return NextResponse.json({
      item: {
        id:               String(item._id),
        title:            item.title,
        slug:             item.slug,
        category:         item.category,
        description:      item.description,
        cover_image:      item.coverImage,
        coverMediaType:   item.coverMediaType || 'image',
        // Typed array — used by PortfolioDetailClient (DriveMedia)
        media:            mediaArr,
        // Legacy flat array — kept for ContentSection and other older components
        images:           imagesFlat,
        image_count:      item.imageCount,
        tags:             item.tags,
        featured:         item.featured,
        published:        item.published,
        event_date:       item.eventDate,
        location:         item.location,
        client_name:      item.clientName,
        view_count:       item.viewCount,
        meta_title:       item.metaTitle,
        meta_description: item.metaDescription,
        og_image:         item.ogImage,
        focus_keywords:   item.focusKeywords,
        seo: {
                seoTitle: item.seo?.seoTitle || "",
                metaDescription: item.seo?.metaDescription || "",
                canonicalUrl: item.seo?.canonicalUrl || "",
                focusKeywords: item.seo?.focusKeywords || [],
                geoKeywords: item.seo?.geoKeywords || [],
                aeoQuestions: item.seo?.aeoQuestions || [],
                aiDescription: item.seo?.aiDescription || "",
                schemaType: item.seo?.schemaType || "ImageGallery",
                robots: item.seo?.robots || "index,follow",
              },
        created_at:       item.createdAt,
        
      },
    });
  } catch (error) {
    console.error("Portfolio API Error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}