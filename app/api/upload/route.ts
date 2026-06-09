/**
 * app/api/upload/route.ts
 *
 * Unified file upload endpoint — Cloudinary storage.
 *
 * POST multipart/form-data
 *   file      — single file
 *   files[]   — multiple files
 *   context   — "portfolio" | "album" | "profile" | "quote" | "document" | "blog" | "fm"
 *   saveToDb  — "true" to persist a CloudinaryFile DB record (optional)
 *   label     — human label for the DB record (optional)
 *
 * POST application/json
 *   { url, context }  — re-upload a remote URL to Cloudinary
 *
 * Returns:
 *   { success, url, downloadUrl, publicId, folderName, files[], errors[] }
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/db';
import { CloudinaryFile } from '@/models/CloudinaryFile';
import { uploadToCloudinary, contextFromString, guessMimeType } from '@/lib/cloudinary';
import { toThumbnailUrl } from '@/lib/cloudinary-url';

const MAX_SIZE_MB = 50;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'image/avif', 'image/svg+xml',
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

async function handleFile(
  file: File,
  context: string,
  userId?: string,
  label?: string,
  saveToDb = false
): Promise<{
  name: string; url: string; downloadUrl: string;
  publicId: string; mimeType: string; bytes: number; folderName?: string;
  dbId?: string;
}> {
  const mimeType = guessMimeType(file.name, file.type);

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`File exceeds ${MAX_SIZE_MB} MB limit`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadToCloudinary(buffer, {
    fileName: file.name,
    mimeType,
    context:  contextFromString(context),
  });

  let dbId: string | undefined;
  if (saveToDb) {
    await connectDB();
    const doc = await CloudinaryFile.create({
      originalName:   file.name,
      publicId:       result.publicId,
      url:            result.url,
      downloadUrl:    result.downloadUrl,
      resourceType:   result.resourceType,
      format:         result.format,
      mimeType:       result.mimeType,
      fileSizeBytes:  result.fileSizeBytes,
      folderName:     result.folderName,
      context:        contextFromString(context),
      label:          label || file.name,
      uploadedBy:     userId,
    });
    dbId = String(doc._id);
  }

  return {
    name:        file.name,
    url:         result.url,
    downloadUrl: result.downloadUrl,
    publicId:    result.publicId,
    mimeType:    result.mimeType,
    bytes:       result.fileSizeBytes,
    folderName:  result.folderName,
    dbId,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';

    // ── JSON: re-upload from URL ──────────────────────────────────────────────
    if (contentType.includes('application/json')) {
      const { url, context } = await request.json();
      if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

      // If already a Cloudinary URL, pass through
      if (url.includes('res.cloudinary.com')) {
        return NextResponse.json({ success: true, url, downloadUrl: url, source: 'passthrough' });
      }

      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Failed to fetch remote URL: ${resp.status}`);

      const buffer   = Buffer.from(await resp.arrayBuffer());
      const fileName = url.split('/').pop()?.split('?')[0] || 'file';
      const mimeType = resp.headers.get('content-type')?.split(';')[0] || 'application/octet-stream';

      const result = await uploadToCloudinary(buffer, {
        fileName, mimeType, context: contextFromString(context),
      });

      return NextResponse.json({
        success:     true,
        url:         result.url,
        downloadUrl: result.downloadUrl,
        publicId:    result.publicId,
        folderName:  result.folderName,
        source:      'cloudinary',
      });
    }

    // ── Multipart: file upload ────────────────────────────────────────────────
    const formData  = await request.formData();
    const context   = (formData.get('context')  as string) || '';
    const label     = (formData.get('label')    as string) || '';
    const saveToDb  = formData.get('saveToDb')  === 'true';

    const singleFile = formData.get('file')       as File | null;
    const multiFiles = formData.getAll('files[]') as File[];
    const files      = singleFile ? [singleFile] : multiFiles;

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const results: any[] = [];
    const errors:  any[] = [];

    for (const file of files) {
      try {
        const r = await handleFile(file, context, session.userId, label, saveToDb);
        results.push(r);
      } catch (err: any) {
        errors.push({ name: file.name, error: err?.message || 'Upload failed' });
      }
    }

    if (!results.length && errors.length) {
      return NextResponse.json(
        { success: false, errors, error: errors[0]?.error },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success:      true,
      url:          results[0]?.url,
      downloadUrl:  results[0]?.downloadUrl,
      publicId:     results[0]?.publicId,
      folderName:   results[0]?.folderName,
      thumbnailUrl: results[0]?.url ? toThumbnailUrl(results[0].url) : null,
      files:        results,
      errors,
      source:       'cloudinary',
    });
  } catch (err: any) {
    console.error('[UPLOAD API]', err);
    return NextResponse.json({ success: false, error: err?.message || 'Upload failed' }, { status: 500 });
  }
}
