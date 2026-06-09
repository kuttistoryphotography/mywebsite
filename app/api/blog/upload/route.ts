/**
 * app/api/blog/upload/route.ts
 *
 * Admin-only: upload blog images/videos to Cloudinary (blog folder).
 * Saves a CloudinaryFile record to MongoDB.
 *
 * POST multipart/form-data → { files: File[] }
 * Returns: { files: [{ name, url, downloadUrl, publicId, type }] }
 */
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/db';
import { CloudinaryFile } from '@/models/CloudinaryFile';
import { uploadToCloudinary, guessMimeType } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const formData = await request.formData();
    const entries  = formData.getAll('files');
    const files    = entries.filter((e): e is File => e instanceof File);

    if (!files.length) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    await connectDB();
    const saved: Array<{ name: string; url: string; downloadUrl: string; publicId: string; type: string; dbId: string }> = [];

    for (const file of files) {
      const mimeType = guessMimeType(file.name, file.type);

      if (!mimeType.startsWith('image/') && !mimeType.startsWith('video/')) {
        return NextResponse.json(
          { error: `Unsupported file type: ${mimeType || file.name}` },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadToCloudinary(buffer, {
        fileName: file.name,
        mimeType,
        context:  'blog',
      });

      const doc = await CloudinaryFile.create({
        originalName:  file.name,
        publicId:      result.publicId,
        url:           result.url,
        downloadUrl:   result.downloadUrl,
        resourceType:  result.resourceType,
        format:        result.format,
        mimeType:      result.mimeType,
        fileSizeBytes: result.fileSizeBytes,
        folderName:    result.folderName,
        context:       'blog',
        label:         file.name,
        uploadedBy:    session.userId,
      });

      saved.push({
        name:        file.name,
        type:        mimeType,
        url:         result.url,
        downloadUrl: result.downloadUrl,
        publicId:    result.publicId,
        dbId:        String(doc._id),
      });
    }

    return NextResponse.json({ files: saved });
  } catch (error: any) {
    console.error('[blog upload]', error);
    return NextResponse.json({ error: 'Failed to upload media' }, { status: 500 });
  }
}
