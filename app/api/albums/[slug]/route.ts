import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Album from '@/models/Album';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    await connectDB();

    const album = await Album.findOne({ slug });

    if (!album) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ album });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch album" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // ✅ unwrap params
    const { slug } = await params;

    await connectDB();

    const body = await request.json();
    console.log('body----', body);
    
    const album = await Album.findOneAndUpdate(
      { slug },
      body,
      { new: true }
    );

    if (!album) {
      return NextResponse.json(
        { error: "Album not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      album,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to update album" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    await connectDB();
    await Album.findOneAndDelete({ slug: params.slug });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete album' }, { status: 500 });
  }
}
