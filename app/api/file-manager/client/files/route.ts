/**
 * app/api/file-manager/client/files/route.ts
 *
 * Client-facing: list + delete files shared with the logged-in client.
 * Returns Cloudinary URLs for view and download.
 */
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { FileDoc } from '@/models/FileManager';
import { getCurrentUser } from '@/lib/auth';
import { deleteFromCloudinary } from '@/lib/cloudinary';
import { CloudinaryFile } from '@/models/CloudinaryFile';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');

    const filter: Record<string, unknown> = {
      clientId:           session.userId,
      isSharedWithClient: true,
    };
    if (folderId) filter.folderId = folderId;

    const files = await FileDoc.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({
      files: files.map((f) => {
        const url         = f.cloudinaryUrl  || f.driveUrl          || '';
        const downloadUrl = f.cloudinaryDownloadUrl || f.driveUrl    || '';
        const viewLink    = f.resourceType === 'raw' || f.mimeType === 'application/pdf'
          ? (url ? `/api/pdf-proxy?url=${encodeURIComponent(url)}` : '')
          : url;

        return {
          id:                 String(f._id),
          folderId:           f.folderId ? String(f.folderId) : null,
          fileName:           f.originalName,
          filePath:           url,
          downloadUrl,
          viewLink,
          // backward compat
          driveFileId:        f.cloudinaryPublicId || f.driveFileId  || null,
          driveUrl:           url,
          driveWebViewLink:   viewLink,
          publicId:           f.cloudinaryPublicId || null,
          cloudinaryUrl:      f.cloudinaryUrl || null,
          resourceType:       f.resourceType || null,
          fileType:           f.mimeType || f.fileType,
          fileSize:           f.fileSize,
          uploadedAt:         f.createdAt,
          isSharedWithClient: f.isSharedWithClient,
          downloadCount:      f.downloadCount,
        };
      }),
    });
  } catch (error) {
    console.error('[Client Files GET]', error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
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
    const fileId = searchParams.get('id') || searchParams.get('fileId');
    if (!fileId) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const doc = await FileDoc.findById(fileId);
    if (doc?.cloudinaryPublicId) {
      try { await deleteFromCloudinary(doc.cloudinaryPublicId, doc.resourceType as any); } catch {}
    }
    if (doc) {
      await FileDoc.findByIdAndDelete(fileId);
      await CloudinaryFile.findOneAndDelete({ publicId: doc.cloudinaryPublicId }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Client Files DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
