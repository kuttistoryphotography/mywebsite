/**
 * app/api/file-manager/files/route.ts
 *
 * Admin CRUD for files inside a file-manager folder.
 * Returns Cloudinary view + download links for every file.
 */
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { FileDoc, getFileUrl, getFileViewLink, getFileDownloadUrl } from '@/models/FileManager';
import { getCurrentUser } from '@/lib/auth';
import { deleteFromCloudinary } from '@/lib/cloudinary';

// ── GET ────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }
    await connectDB();
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    const clientId = searchParams.get('clientId');

    const filter: Record<string, unknown> = {};
    if (folderId) filter.folderId = folderId;
    if (clientId) filter.clientId = clientId;

    const files = await FileDoc.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({
      files: files.map((f) => ({
        id:                 String(f._id),
        folderId:           f.folderId ? String(f.folderId) : null,
        fileName:           f.originalName,
        filePath:           getFileUrl(f),
        downloadUrl:        getFileDownloadUrl(f),
        viewLink:           getFileViewLink(f),
        // backward compat aliases
        driveViewLink:      getFileViewLink(f),
        driveFileId:        f.cloudinaryPublicId || f.driveFileId || null,
        publicId:           f.cloudinaryPublicId || null,
        resourceType:       f.resourceType || null,
        fileType:           f.mimeType || f.fileType,
        fileSize:           f.fileSize,
        uploadedAt:         f.createdAt,
        isSharedWithClient: f.isSharedWithClient,
        downloadCount:      f.downloadCount,
      })),
    });
  } catch (error) {
    console.error('[Files GET]', error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
}

// ── PUT ────────────────────────────────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }
    await connectDB();
    const body = await request.json();
    const { id, fileId, isSharedWithClient, folderId, clientId } = body;
    const resolvedId = id || fileId;
    if (!resolvedId) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const update: Record<string, unknown> = {};
    if (isSharedWithClient !== undefined) update.isSharedWithClient = isSharedWithClient;
    if (folderId !== undefined)           update.folderId           = folderId;
    if (clientId !== undefined)           update.clientId           = clientId;

    await FileDoc.findByIdAndUpdate(resolvedId, update);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Files PUT]', error);
    return NextResponse.json({ error: 'Failed to update file' }, { status: 500 });
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
    const fileId = searchParams.get('id') || searchParams.get('fileId');
    if (!fileId) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const fileDoc = await FileDoc.findById(fileId);
    if (fileDoc) {
      if (fileDoc.cloudinaryPublicId) {
        try { await deleteFromCloudinary(fileDoc.cloudinaryPublicId, fileDoc.resourceType as any); } catch {}
      }
      await FileDoc.findByIdAndDelete(fileId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Files DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
