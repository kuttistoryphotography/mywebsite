/**
 * app/api/quote-pdfs/route.ts
 *
 * Admin: manage the quote PDF library (CRUD).
 * Each entry = one pricing-tier PDF for a given service type.
 * Now uses Cloudinary instead of Google Drive.
 *
 * GET    /api/quote-pdfs?serviceType=wedding   → list PDFs
 * POST   /api/quote-pdfs (multipart)           → admin upload PDF
 * DELETE /api/quote-pdfs?id=<id>               → admin delete
 */
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import QuotePdf, { PRICING_TIERS, PRICING_TIER_LABELS, type PricingTier } from '@/models/QuotePdf';
import { getCurrentUser } from '@/lib/auth';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get('serviceType')?.toLowerCase().trim();

    const query: Record<string, unknown> = { isActive: true };
    if (serviceType) query.serviceType = serviceType;
    if (session.role === 'admin' && searchParams.get('all') === '1') {
      delete query.isActive;
    }

    const docs = await QuotePdf.find(query).sort({ serviceType: 1, tier: 1 });
    return NextResponse.json({ quotePdfs: docs });
  } catch (err) {
    console.error('[quote-pdfs GET]', err);
    return NextResponse.json({ error: 'Failed to fetch PDFs' }, { status: 500 });
  }
}

// ── POST (upload) ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const formData    = await request.formData();
    const file        = formData.get('file')         as File | null;
    const serviceType = (formData.get('serviceType') as string || '').toLowerCase().trim();
    const tier        = formData.get('tier')         as PricingTier | null;

    if (!file)        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!serviceType) return NextResponse.json({ error: 'serviceType is required' }, { status: 400 });
    if (!tier || !PRICING_TIERS.includes(tier)) {
      return NextResponse.json(
        { error: `tier must be one of: ${PRICING_TIERS.join(', ')}` },
        { status: 400 }
      );
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File exceeds 20 MB limit' }, { status: 400 });
    }

    await connectDB();

    // If a previous PDF exists for same serviceType+tier, delete it from Cloudinary
    const existing = await QuotePdf.findOne({ serviceType, tier });
    const oldPublicId = (existing as any)?.publicId || existing?.driveFileId;
    if (oldPublicId) {
      try { await deleteFromCloudinary(oldPublicId, 'raw'); } catch {}
    }

    // Upload to Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToCloudinary(buffer, {
      fileName: file.name,
      mimeType: 'application/pdf',
      context:  'quote_pdf',
    });

    // Upsert DB record
    const doc = await QuotePdf.findOneAndUpdate(
      { serviceType, tier },
      {
        serviceType,
        tier,
        label:             PRICING_TIER_LABELS[tier],
        fileName:          file.name,
        // New Cloudinary fields
        publicId:          result.publicId,
        url:               result.url,
        downloadUrl:       result.downloadUrl,
        // Legacy field aliases (kept so old code that reads driveFileId still works)
        driveFileId:       result.publicId,
        driveWebViewLink:  result.url,
        driveDownloadLink: result.downloadUrl,
        fileSizeBytes:     result.fileSizeBytes,
        isActive:          true,
        uploadedBy:        session.userId,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, quotePdf: doc }, { status: 201 });
  } catch (err: any) {
    console.error('[quote-pdfs POST]', err);
    return NextResponse.json({ error: err?.message || 'Upload failed' }, { status: 500 });
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────
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

    const doc = await QuotePdf.findById(id);
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const cloudId = (doc as any).publicId || doc.driveFileId;
    if (cloudId) {
      try { await deleteFromCloudinary(cloudId, 'raw'); } catch {}
    }

    await QuotePdf.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[quote-pdfs DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
