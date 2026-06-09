/**
 * app/api/cloudinary-files/route.ts
 *
 * List Cloudinary files stored in MongoDB.
 *
 * GET /api/cloudinary-files
 *   ?context=portfolio|album|blog|quote_pdf|fm|document|profile|general
 *   ?search=filename
 *   ?page=1&limit=20
 *   ?mimeType=image|video|pdf   (prefix match)
 *
 * Admin sees all files. Regular user sees only their own uploads.
 *
 * DELETE /api/cloudinary-files?id=<dbId>
 *   Admin only — deletes from Cloudinary + DB.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { CloudinaryFile } from '@/models/CloudinaryFile';
import { getCurrentUser } from '@/lib/auth';
import { deleteFromCloudinary } from '@/lib/cloudinary';

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(request.url);
    const context    = searchParams.get('context') || '';
    const search     = searchParams.get('search')  || '';
    const mimePrefix = searchParams.get('mimeType') || '';
    const page       = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit      = Math.min(100, parseInt(searchParams.get('limit') || '20'));

    const filter: Record<string, unknown> = {};

    if (session.role !== 'admin') filter.uploadedBy = session.userId;
    if (context)    filter.context      = context;
    if (search)     filter.originalName = { $regex: search, $options: 'i' };
    if (mimePrefix) filter.mimeType     = { $regex: `^${mimePrefix}`, $options: 'i' };

    const [files, total] = await Promise.all([
      CloudinaryFile.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('uploadedBy', 'name email')
        .lean(),
      CloudinaryFile.countDocuments(filter),
    ]);

    const mapped = files.map((f: any) => ({
      id:           String(f._id),
      originalName: f.originalName,
      publicId:     f.publicId,
      url:          f.url,
      downloadUrl:  f.downloadUrl,
      resourceType: f.resourceType,
      format:       f.format,
      mimeType:     f.mimeType,
      fileSizeBytes: f.fileSizeBytes,
      folderName:   f.folderName,
      context:      f.context,
      label:        f.label,
      refModel:     f.refModel,
      refId:        f.refId,
      uploadedBy:   f.uploadedBy,
      createdAt:    f.createdAt,
      // Convenience flags
      isImage:      f.mimeType?.startsWith('image/'),
      isVideo:      f.mimeType?.startsWith('video/'),
      isPdf:        f.mimeType === 'application/pdf',
      // Backward compat fields that old components may reference
      driveUrl:         f.url,
      driveWebViewLink: f.url,
      driveFileId:      f.publicId,
    }));

    return NextResponse.json({
      files: mapped,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (err: any) {
    console.error('[cloudinary-files GET]', err);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
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

    const doc = await CloudinaryFile.findById(id);
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Delete from Cloudinary
    if (doc.publicId) {
      try {
        await deleteFromCloudinary(doc.publicId, doc.resourceType as any);
      } catch {}
    }

    await CloudinaryFile.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[cloudinary-files DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
