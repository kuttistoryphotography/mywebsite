import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Favorite from '@/models/Favorite';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'portfolio' | 'album' | 'media'

    const filter: Record<string, unknown> = { userId: session.userId };
    if (type) filter.itemType = type;

    const favs = await Favorite.find(filter).sort({ createdAt: -1 });
    return NextResponse.json({
      favorites: favs.map((f: any) => ({
        id:          String(f._id),
        itemType:    f.itemType,
        itemId:      f.itemId,
        title:       f.title,
        coverImage:  f.coverImage   || null,
        mediaUrl:    f.mediaUrl     || null,
        mediaType:   f.mediaType    || null,
        category:    f.category     || null,
        slug:        f.slug         || null,
        parentTitle: f.parentTitle  || null,
        parentType:  f.parentType   || null,
        createdAt:   f.createdAt,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await connectDB();
    const {
      itemType, itemId, title,
      coverImage, mediaUrl, mediaType,
      category, slug,
      parentTitle, parentType,
    } = await request.json();

    if (!itemType || !itemId || !title)
      return NextResponse.json({ error: 'itemType, itemId, and title are required' }, { status: 400 });

    // Upsert — idempotent
    const fav = await Favorite.findOneAndUpdate(
      { userId: session.userId, itemType, itemId },
      {
        userId: session.userId,
        itemType, itemId, title,
        coverImage, mediaUrl, mediaType,
        category, slug, parentTitle, parentType,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, id: String(fav._id) }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(request.url);
    const itemId   = searchParams.get('itemId');
    const itemType = searchParams.get('itemType');
    const id       = searchParams.get('id');

    if (id) {
      await Favorite.findOneAndDelete({ _id: id, userId: session.userId });
    } else if (itemId && itemType) {
      await Favorite.findOneAndDelete({ userId: session.userId, itemId, itemType });
    } else {
      return NextResponse.json({ error: 'id or itemId+itemType required' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
