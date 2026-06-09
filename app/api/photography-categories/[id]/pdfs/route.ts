/**
 * app/api/photography-categories/[id]/pdfs/route.ts
 *
 * Manage PDFs inside a photography category.
 * Now uses Cloudinary instead of Google Drive.
 *
 * POST   multipart → admin upload one or more PDFs to a category
 * DELETE ?pdfId=<id> → admin remove a single PDF
 */
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import PhotographyCategory from '@/models/PhotographyCategory';
import { getCurrentUser } from '@/lib/auth';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';

// ── POST (upload PDF to category) ─────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    await connectDB();
    const cat = await PhotographyCategory.findById(id);
    if (!cat) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

    const formData = await request.formData();
    const files    = formData.getAll('files') as File[];
    const label    = (formData.get('label') as string) || '';

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const added  = [];
    const errors = [];

    for (const file of files) {
      if (file.type !== 'application/pdf') {
        errors.push({ name: file.name, error: 'Only PDF files allowed' });
        continue;
      }
      if (file.size > 20 * 1024 * 1024) {
        errors.push({ name: file.name, error: 'File exceeds 20 MB' });
        continue;
      }
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadToCloudinary(buffer, {
          fileName: file.name,
          mimeType: 'application/pdf',
          context:  'quote_pdf',
        });
        const pdfEntry = {
          // New Cloudinary fields
          publicId:     result.publicId,
          url:          result.url,
          downloadUrl:  result.downloadUrl,
          // Legacy field aliases for backward compat with PhotographyCategory model
          driveFileId:       result.publicId,
          driveWebViewLink:  result.url,
          driveDownloadLink: result.downloadUrl,
          fileName:          file.name,
          fileSizeBytes:     result.fileSizeBytes,
          label:             label || file.name.replace(/\.pdf$/i, ''),
          uploadedAt:        new Date(),
        };
        cat.pdfs.push(pdfEntry as any);
        added.push(pdfEntry);
      } catch (e: any) {
        errors.push({ name: file.name, error: e?.message || 'Upload failed' });
      }
    }

    await cat.save();
    return NextResponse.json({ success: true, added, errors, category: cat }, { status: 201 });
  } catch (err: any) {
    console.error('[category pdfs POST]', err);
    return NextResponse.json({ error: err?.message || 'Upload failed' }, { status: 500 });
  }
}

// ── DELETE (remove a single PDF from category) ────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const pdfId = searchParams.get('pdfId');
    if (!pdfId) return NextResponse.json({ error: 'pdfId required' }, { status: 400 });

    const cat = await PhotographyCategory.findById(id);
    if (!cat) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

    const pdfEntry = cat.pdfs.find((p: any) => String(p._id) === pdfId);
    if (!pdfEntry) return NextResponse.json({ error: 'PDF not found' }, { status: 404 });

    // Delete from Cloudinary (publicId preferred; fall back to driveFileId for legacy)
    const cloudId = (pdfEntry as any).publicId || pdfEntry.driveFileId;
    if (cloudId) {
      try { await deleteFromCloudinary(cloudId, 'raw'); } catch {}
    }

    cat.pdfs = cat.pdfs.filter((p: any) => String(p._id) !== pdfId) as any;
    await cat.save();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[category pdfs DELETE]', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
