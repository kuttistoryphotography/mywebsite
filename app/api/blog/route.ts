import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Blog from '@/models/Blog';
import { getCurrentUser } from '@/lib/auth';
import { publishBlogToTelegram } from '@/lib/telegram';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function buildUniqueSlug(
  baseTitle: string,
  excludeId?: string
): Promise<string> {
  const base = slugify(baseTitle) || `blog-${Date.now()}`;

  let candidate = base;
  let suffix = 1;

  while (true) {
    const q: Record<string, unknown> = {
      slug: candidate,
    };

    if (excludeId) {
      q._id = { $ne: excludeId };
    }

    const exists = await Blog.findOne(q).select('_id');

    if (!exists) {
      return candidate;
    }

    suffix++;
    candidate = `${base}-${suffix}`;
  }
}

/**
 * Normalize a raw Mongoose blog document
 * into a consistent API response shape.
 */
function serializeBlog(
  b: any,
  includeContent = true
) {
  return {
    id: String(b._id),

    title: b.title,

    slug: b.slug,

    excerpt: b.excerpt || '',

    content: includeContent
      ? (b.content || '')
      : '',

    cover_image: b.coverImage || '',

    gallery_images: b.galleryImages || [],

    gallery_stories: Array.isArray(b.galleryStories)
      ? b.galleryStories
      : [],

    image_alt: b.imageAlt || '',

    author_name: '',

    category: b.category || 'General',

    tags: b.tags || [],

    status: b.published
      ? 'published'
      : (b.status || 'draft'),

    is_featured: !!b.isFeatured,

    view_count: b.viewCount || 0,

    meta_title: b.metaTitle || '',

    meta_description: b.metaDescription || '',

    og_image: b.ogImage || '',

    canonical_url: b.canonicalUrl || '',

    focus_keywords: b.focusKeywords || [],

    schema_type: b.schemaType || 'Article',

    created_at: b.createdAt,

    published_at: b.publishedAt || null,

    telegram_posted_at:
      b.telegramPostedAt || null,
  };
}


/* =========================================================
   GET BLOGS
========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    await connectDB();

    const { searchParams } =
      new URL(request.url);

    const adminView =
      searchParams.get('admin') === 'true';

    const statusFilter =
      searchParams.get('status');

    /* -------------------------------
       Pagination
    -------------------------------- */

    const rawLimit =
      searchParams.get('limit');

    const rawPage =
      searchParams.get('page');

    const limit = rawLimit
      ? Math.max(
          1,
          parseInt(rawLimit, 10) || 20
        )
      : null;

    const page = Math.max(
      1,
      parseInt(rawPage || '1', 10) || 1
    );

    /* -------------------------------
       Build filter
    -------------------------------- */

    const filter: Record<
      string,
      unknown
    > = {};

    /*
      Public API:
      Only published blogs.

      Admin API:
      All blogs.
    */

    if (!adminView) {
      if (statusFilter === 'published') {
        filter.published = true;
      } else if (!statusFilter) {
        filter.published = true;
      }
    }

    /* -------------------------------
       Count
    -------------------------------- */

    const total =
      await Blog.countDocuments(filter);

    /* -------------------------------
       Pagination
    -------------------------------- */

    const totalPages = limit
      ? Math.max(
          1,
          Math.ceil(total / limit)
        )
      : 1;

    const safePage = limit
      ? Math.min(page, totalPages)
      : 1;

    /* -------------------------------
       Fetch
    -------------------------------- */

    let query = Blog.find(filter)
      .sort({
        createdAt: -1,
      });

    if (limit) {
      const skip =
        (safePage - 1) * limit;

      query = query
        .skip(skip)
        .limit(limit);
    }

    const blogs = await query;

    /* -------------------------------
       Response
    -------------------------------- */

    return NextResponse.json({
      blogs: blogs.map((b) =>
        serializeBlog(b)
      ),

      total,

      page: safePage,

      totalPages,
    });

  } catch (error) {
    console.error(
      '[Blog GET]',
      error
    );

    return NextResponse.json(
      {
        error: 'Failed to fetch blogs',
      },
      {
        status: 500,
      }
    );
  }
}


/* =========================================================
   CREATE BLOG
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    /* -------------------------------
       Admin authentication
    -------------------------------- */

    const session =
      await getCurrentUser();

    if (
      !session ||
      session.role !== 'admin'
    ) {
      return NextResponse.json(
        {
          error:
            'Admin access required',
        },
        {
          status: 401,
        }
      );
    }

    await connectDB();

    const body =
      await request.json();

    const {
      title,
      slug,
      content,
      excerpt,
      cover_image,
      gallery_images,
      gallery_stories,
      image_alt,
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

    /* -------------------------------
       Validation
    -------------------------------- */

    if (!title?.trim()) {
      return NextResponse.json(
        {
          error:
            'Title is required',
        },
        {
          status: 400,
        }
      );
    }

    if (!content?.trim()) {
      return NextResponse.json(
        {
          error:
            'Content is required',
        },
        {
          status: 400,
        }
      );
    }

    /* -------------------------------
       Published status
    -------------------------------- */

    const isPublished =
      status === 'published';

    /* -------------------------------
       Unique slug
    -------------------------------- */

    const finalSlug =
      slug?.trim()
        ? await buildUniqueSlug(
            slug
          )
        : await buildUniqueSlug(
            title
          );

    /* -------------------------------
       Create blog
    -------------------------------- */

    const blog =
      await Blog.create({
        title: title.trim(),

        slug: finalSlug,

        content,

        excerpt: excerpt || '',

        coverImage:
          cover_image || '',

        galleryImages:
          Array.isArray(
            gallery_images
          )
            ? gallery_images
            : [],

        galleryStories:
          Array.isArray(
            gallery_stories
          )
            ? gallery_stories
            : [],

        imageAlt:
          image_alt || '',

        category:
          category || 'General',

        tags:
          Array.isArray(tags)
            ? tags
            : [],

        published:
          isPublished,

        status:
          status || 'draft',

        isFeatured:
          !!is_featured,

        publishedAt:
          isPublished
            ? new Date()
            : undefined,

        authorId:
          session.userId,

        metaTitle:
          meta_title || '',

        metaDescription:
          meta_description || '',

        ogImage:
          og_image || '',

        canonicalUrl:
          canonical_url || '',

        focusKeywords:
          Array.isArray(
            focus_keywords
          )
            ? focus_keywords
            : [],

        schemaType:
          schema_type || 'Article',
      });

    /* =====================================================
       TELEGRAM AUTO PUBLISH
       
       Only send when the NEW blog is published.
    ===================================================== */

    if (
      isPublished &&
      !blog.telegramPostedAt
    ) {
      try {
        const telegramMessageId =
          await publishBlogToTelegram({
            title: blog.title,

            slug: blog.slug,

            excerpt:
              blog.excerpt,

            category:
              blog.category,
          });

        if (
          telegramMessageId
        ) {
          blog.telegramPostedAt =
            new Date();

          blog.telegramMessageId =
            telegramMessageId;

          await blog.save();
        }

      } catch (telegramError) {
        /*
          IMPORTANT:

          If Telegram fails, the blog
          should still be successfully
          published on the website.
        */

        console.error(
          '[Telegram Blog Publish]',
          telegramError
        );
      }
    }

    /* -------------------------------
       Response
    -------------------------------- */

    return NextResponse.json(
      {
        success: true,

        id: String(blog._id),

        slug: blog.slug,
      },
      {
        status: 201,
      }
    );

  } catch (error) {
    console.error(
      '[Blog POST]',
      error
    );

    return NextResponse.json(
      {
        error:
          'Failed to create blog',
      },
      {
        status: 500,
      }
    );
  }
}


/* =========================================================
   UPDATE BLOG
========================================================= */

export async function PUT(
  request: NextRequest
) {
  try {
    /* -------------------------------
       Admin authentication
    -------------------------------- */

    const session =
      await getCurrentUser();

    if (
      !session ||
      session.role !== 'admin'
    ) {
      return NextResponse.json(
        {
          error:
            'Admin access required',
        },
        {
          status: 401,
        }
      );
    }

    await connectDB();

    const body =
      await request.json();

    console.log(
      '========= PUT BLOG ========='
    );

    console.log(body);

    const {
      id,
      title,
      slug,
      content,
      excerpt,
      cover_image,
      gallery_images,
      gallery_stories,
      image_alt,
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

    if (!id) {
      return NextResponse.json(
        {
          error: 'ID required',
        },
        {
          status: 400,
        }
      );
    }

    /* -------------------------------
       Get existing blog FIRST
       
       We need this to know whether
       the blog was draft before.
    -------------------------------- */

    const existing =
      await Blog.findById(id);

    if (!existing) {
      return NextResponse.json(
        {
          error:
            'Blog not found',
        },
        {
          status: 404,
        }
      );
    }

    /*
      This is important.

      If existing blog = draft
      and new status = published

      => send Telegram.

      If existing blog was already published
      and user edits it

      => DON'T send another Telegram post.
    */

    const wasAlreadyPublished =
      existing.published === true;

    const willBePublished =
      status === 'published';

    const isNewlyPublished =
      willBePublished &&
      !wasAlreadyPublished;

    /* -------------------------------
       Build update object
    -------------------------------- */

    const update: Record<
      string,
      unknown
    > = {};

    if (title !== undefined) {
      update.title = title;

      update.slug =
        await buildUniqueSlug(
          slug?.trim() || title,
          id
        );
    }

    if (content !== undefined) {
      update.content = content;
    }

    if (excerpt !== undefined) {
      update.excerpt = excerpt;
    }

    if (
      cover_image !== undefined
    ) {
      update.coverImage =
        cover_image;
    }

    if (
      gallery_images !== undefined
    ) {
      update.galleryImages =
        Array.isArray(
          gallery_images
        )
          ? gallery_images
          : [];
    }

    if (
      gallery_stories !== undefined
    ) {
      update.galleryStories =
        Array.isArray(
          gallery_stories
        )
          ? gallery_stories
          : [];
    }

    if (
      image_alt !== undefined
    ) {
      update.imageAlt =
        image_alt;
    }

    if (
      category !== undefined
    ) {
      update.category =
        category;
    }

    if (tags !== undefined) {
      update.tags =
        tags;
    }

    /* -------------------------------
       Status
    -------------------------------- */

    if (status !== undefined) {
      update.status =
        status;

      update.published =
        status === 'published';

      if (
        status === 'published'
      ) {
        update.publishedAt =
          existing.publishedAt ||
          new Date();
      }
    }

    if (
      is_featured !== undefined
    ) {
      update.isFeatured =
        is_featured;
    }

    if (
      meta_title !== undefined
    ) {
      update.metaTitle =
        meta_title;
    }

    if (
      meta_description !== undefined
    ) {
      update.metaDescription =
        meta_description;
    }

    if (
      og_image !== undefined
    ) {
      update.ogImage =
        og_image;
    }

    if (
      canonical_url !== undefined
    ) {
      update.canonicalUrl =
        canonical_url;
    }

    if (
      focus_keywords !== undefined
    ) {
      update.focusKeywords =
        focus_keywords;
    }

    if (
      schema_type !== undefined
    ) {
      update.schemaType =
        schema_type;
    }

    console.log(
      'UPDATE OBJECT:'
    );

    console.log(update);

    /* -------------------------------
       Update database
    -------------------------------- */

    const updated =
      await Blog.findByIdAndUpdate(
        id,
        update,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!updated) {
      return NextResponse.json(
        {
          error:
            'Failed to update blog',
        },
        {
          status: 500,
        }
      );
    }

    console.log(
      'UPDATED imageAlt:',
      updated.imageAlt
    );

    /* =====================================================
       TELEGRAM AUTO PUBLISH
       
       Only when:
       
       DRAFT → PUBLISHED
       
       NOT:
       
       PUBLISHED → EDITED
    ===================================================== */

    if (
      isNewlyPublished &&
      !updated.telegramPostedAt
    ) {
      try {
        const telegramMessageId =
          await publishBlogToTelegram({
            title:
              updated.title,

            slug:
              updated.slug,

            excerpt:
              updated.excerpt,

            category:
              updated.category,
          });

        if (
          telegramMessageId
        ) {
          await Blog.findByIdAndUpdate(
            id,
            {
              telegramPostedAt:
                new Date(),

              telegramMessageId:
                telegramMessageId,
            }
          );
        }

      } catch (telegramError) {
        /*
          Telegram failure must NOT
          break blog publishing.
        */

        console.error(
          '[Telegram Blog Publish]',
          telegramError
        );
      }
    }

    /* -------------------------------
       Response
    -------------------------------- */

    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    console.error(
      '[BLOG PUT ERROR]',
      error
    );

    return NextResponse.json(
      {
        error:
          'Failed to update blog',
      },
      {
        status: 500,
      }
    );
  }
}


/* =========================================================
   DELETE BLOG
========================================================= */

export async function DELETE(
  request: NextRequest
) {
  try {
    const session =
      await getCurrentUser();

    if (
      !session ||
      session.role !== 'admin'
    ) {
      return NextResponse.json(
        {
          error:
            'Admin access required',
        },
        {
          status: 401,
        }
      );
    }

    await connectDB();

    const {
      searchParams,
    } = new URL(
      request.url
    );

    const id =
      searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          error:
            'ID required',
        },
        {
          status: 400,
        }
      );
    }

    await Blog.findByIdAndDelete(
      id
    );

    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    console.error(
      '[Blog DELETE]',
      error
    );

    return NextResponse.json(
      {
        error:
          'Failed to delete blog',
      },
      {
        status: 500,
      }
    );
  }
}