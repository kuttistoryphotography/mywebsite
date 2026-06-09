import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Service from '@/models/Service';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const adminView = searchParams.get('admin') === 'true';

    const filter = adminView ? {} : { isActive: true };
    const services = await Service.find(filter).sort({ sortOrder: 1, createdAt: 1 });

    return NextResponse.json({ services });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, services: [] }, { status: 500 });
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
    const { title, description, shortDescription, coverImage, images, price, features, isActive, sortOrder, icon } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const service = await Service.create({
      title, slug, description, shortDescription,
      coverImage: coverImage || null,
      images: images || [],
      price: price || null,
      features: features || [],
      isActive: isActive !== false,
      sortOrder: sortOrder || 0,
      icon: icon || null,
    });

    return NextResponse.json({ success: true, id: String(service._id) });
  } catch (error: any) {
    if (error.code === 11000) return NextResponse.json({ error: 'Service already exists' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
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

    const update: Record<string, unknown> = {};
    const fields = ['title','description','shortDescription','coverImage','images','price','features','isActive','sortOrder','icon'];
    fields.forEach((f) => { if (updates[f] !== undefined) update[f] = updates[f]; });
    if (updates.title) {
      update.slug = updates.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    await Service.findByIdAndUpdate(id, update);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
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

    await Service.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
}
