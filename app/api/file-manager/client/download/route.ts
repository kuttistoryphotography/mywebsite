/**
 * app/api/file-manager/client/download/route.ts
 *
 * Client-facing download endpoint.
 * Increments download counter and redirects to the Cloudinary download URL.
 *
 * GET /api/file-manager/client/download?fileId=<mongoId>
 */
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { FileDoc, getFileDownloadUrl } from '@/models/FileManager';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    if (!fileId) return NextResponse.json({ error: 'fileId required' }, { status: 400 });

    const fileDoc = await FileDoc.findOne({
      _id:      fileId,
      clientId: session.userId,
    });

    if (!fileDoc) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Increment download counter (non-blocking)
    FileDoc.findByIdAndUpdate(fileId, { $inc: { downloadCount: 1 } }).catch(() => {});

    const dlUrl = getFileDownloadUrl(fileDoc);
    if (!dlUrl) {
      return NextResponse.json({ error: 'Download URL not available' }, { status: 404 });
    }

    return NextResponse.redirect(dlUrl, 302);
  } catch (error) {
    console.error('[Client Download]', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
