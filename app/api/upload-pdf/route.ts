/**
 * app/api/upload-pdf/route.ts
 *
 * PDF upload — saves to Cloudinary (raw resource type) and persists
 * a CloudinaryFile record in MongoDB.
 *
 * POST multipart/form-data  → { file: File, label?: string }
 * Returns: { success, url, downloadUrl, publicId, folderName, filename, size, dbId }
 */
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/db';
import { CloudinaryFile } from '@/models/CloudinaryFile';
import { uploadToCloudinary } from '@/lib/cloudinary';

const MAX_SIZE_MB = 20;

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const formData = await request.formData();
    const file  = formData.get('file')  as File | null;
    const label = (formData.get('label') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `File exceeds ${MAX_SIZE_MB} MB limit` }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToCloudinary(buffer, {
      fileName: file.name,
      mimeType: 'application/pdf',
      context:  'quote_pdf',
    });

    // Persist to DB
    await connectDB();
    const doc = await CloudinaryFile.create({
      originalName:  file.name,
      publicId:      result.publicId,
      url:           result.url,
      downloadUrl:   result.downloadUrl,
      resourceType:  result.resourceType,
      format:        result.format,
      mimeType:      'application/pdf',
      fileSizeBytes: result.fileSizeBytes,
      folderName:    result.folderName,
      context:       'quote_pdf',
      label:         label || file.name,
      uploadedBy:    session.userId,
    });

    return NextResponse.json(
      {
        success:     true,
        url:         result.url,
        downloadUrl: result.downloadUrl,
        publicId:    result.publicId,
        folderName:  result.folderName,
        filename:    file.name,
        size:        result.fileSizeBytes,
        dbId:        String(doc._id),
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[PDF UPLOAD]', err);
    return NextResponse.json({ success: false, error: err?.message || 'Upload failed' }, { status: 500 });
  }
}
