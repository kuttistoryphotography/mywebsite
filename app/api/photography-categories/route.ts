/**
 * app/api/photography-categories/route.ts
 *
 * Admin manages photography service categories (Wedding Photography,
 * Baby Shoots, Food, Ads, Outdoor, etc.).
 *
 * GET    /api/photography-categories            → list all (active only for users)
 * POST   /api/photography-categories (JSON)     → admin create category
 * PUT    /api/photography-categories (JSON)     → admin update category
 * DELETE /api/photography-categories?id=<id>   → admin delete category
 */
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import PhotographyCategory from '@/models/PhotographyCategory';
import { getCurrentUser } from '@/lib/auth';
import { deleteFromCloudinary } from '@/lib/cloudinary';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── GET ────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === '1';

    const query: Record<string, unknown> = {};
    // Non-admins only see active categories
    if (!session || session.role !== 'admin' || !all) {
      query.isActive = true;
    }

    const cats = await PhotographyCategory.find(query).sort({ sortOrder: 1, name: 1 });
    return NextResponse.json({ categories: cats });
  } catch (err) {
    console.error('[photography-categories GET]', err);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// ── POST (create) ──────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { name, description, isActive, sortOrder } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const slug = slugify(name);
    const existing = await PhotographyCategory.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: 'A category with that name already exists' }, { status: 409 });
    }

    const cat = await PhotographyCategory.create({
      name: name.trim(),
      slug,
      description: description?.trim() || '',
      isActive:    isActive !== false,
      sortOrder:   sortOrder ?? 0,
      pdfs:        [],
    });

    return NextResponse.json({ success: true, category: cat }, { status: 201 });
  } catch (err: any) {
    console.error('[photography-categories POST]', err);
    return NextResponse.json({ error: err?.message || 'Create failed' }, { status: 500 });
  }
}

// ── PUT (update) ──────────────────────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { id, name, description, isActive, sortOrder } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const update: Record<string, unknown> = {};
    if (name       !== undefined) { update.name = name.trim(); update.slug = slugify(name); }
    if (description !== undefined) update.description = description;
    if (isActive   !== undefined) update.isActive = isActive;
    if (sortOrder  !== undefined) update.sortOrder = sortOrder;

    const cat = await PhotographyCategory.findByIdAndUpdate(id, update, { new: true });
    if (!cat) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

    return NextResponse.json({ success: true, category: cat });
  } catch (err: any) {
    console.error('[photography-categories PUT]', err);
    return NextResponse.json({ error: err?.message || 'Update failed' }, { status: 500 });
  }
}

// ── DELETE ─────────────────────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const cat = await PhotographyCategory.findById(id);
    if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Delete all attached PDFs from Drive
    await Promise.allSettled(cat.pdfs.map((p) => deleteFromCloudinary((p as any).publicId || p.driveFileId, 'raw')));

    await PhotographyCategory.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[photography-categories DELETE]', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
