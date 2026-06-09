/**
 * app/api/file-manager/upload/route.ts
 *
 * Admin-only: upload files to client file-manager folders.
 * Backed by Cloudinary. Saves metadata to MongoDB.
 */
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { FileDoc, Folder } from '@/models/FileManager';
import { CloudinaryFile } from '@/models/CloudinaryFile';
import { getCurrentUser } from '@/lib/auth';
import { uploadToCloudinary, guessMimeType } from '@/lib/cloudinary';

const MAX_FILES   = 10;
const MAX_SIZE_MB = 50;

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const formData = await request.formData();
    const folderId = formData.get('folderId') as string;
    const files    = formData.getAll('files') as File[];

    if (!folderId) return NextResponse.json({ error: 'folderId required' }, { status: 400 });
    if (!files.length) return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Max ${MAX_FILES} files per upload` }, { status: 400 });
    }

    await connectDB();
    const folder   = await Folder.findById(folderId);
    const clientId = folder?.clientId || undefined;

    const uploadedFiles: any[] = [];
    const errors:        any[] = [];

    for (const file of files) {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        errors.push({ name: file.name, error: `Exceeds ${MAX_SIZE_MB} MB limit` });
        continue;
      }
      try {
        const mimeType = guessMimeType(file.name, file.type);
        const buffer   = Buffer.from(await file.arrayBuffer());
        const ext      = file.name.split('.').pop()?.toLowerCase() || '';

        const result = await uploadToCloudinary(buffer, {
          fileName: file.name,
          mimeType,
          context:  'fm',
        });

        // Save to FileManager FileDoc
        const fileDoc = await FileDoc.create({
          originalName:        file.name,
          fileName:            file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'file',
          fileType:            ext,
          mimeType,
          fileSize:            result.fileSizeBytes,
          cloudinaryPublicId:  result.publicId,
          cloudinaryUrl:       result.url,
          cloudinaryDownloadUrl: result.downloadUrl,
          resourceType:        result.resourceType,
          folderId,
          clientId,
          isSharedWithClient:  folder?.isSharedWithClient ?? false,
          uploadedBy:          session.userId,
        });

        // Also save a CloudinaryFile record for platform-wide reference
        await CloudinaryFile.create({
          originalName:  file.name,
          publicId:      result.publicId,
          url:           result.url,
          downloadUrl:   result.downloadUrl,
          resourceType:  result.resourceType,
          format:        result.format,
          mimeType,
          fileSizeBytes: result.fileSizeBytes,
          folderName:    result.folderName,
          context:       'fm',
          label:         file.name,
          refModel:      'FileDoc',
          refId:         fileDoc._id,
          uploadedBy:    session.userId,
        });

        uploadedFiles.push({
          id:                 String(fileDoc._id),
          folderId:           String(folderId),
          fileName:           file.name,
          filePath:           result.url,
          downloadUrl:        result.downloadUrl,
          publicId:           result.publicId,
          resourceType:       result.resourceType,
          fileType:           mimeType,
          fileSize:           result.fileSizeBytes,
          uploadedAt:         fileDoc.createdAt,
          isSharedWithClient: fileDoc.isSharedWithClient,
        });
      } catch (err: any) {
        errors.push({ name: file.name, error: err.message });
      }
    }

    return NextResponse.json(
      { success: true, files: uploadedFiles, errors, uploadedCount: uploadedFiles.length },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[FM upload error]', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
