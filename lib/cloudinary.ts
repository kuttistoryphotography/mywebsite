/**
 * lib/cloudinary.ts
 *
 * Cloudinary upload helper — replaces Google Drive entirely.
 *
 * Required env vars:
 *   CLOUDINARY_CLOUD_NAME   — your cloud name
 *   CLOUDINARY_API_KEY      — API key
 *   CLOUDINARY_API_SECRET   — API secret
 *
 * Supports: images, videos, PDFs, documents
 * All uploads are made public and stored in context-based folders.
 */

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure:     true,
});

export type UploadContext =
  | 'portfolio' | 'album' | 'profile' | 'quote_pdf'
  | 'document'  | 'blog'  | 'fm'      | 'general';

/** Map context → Cloudinary folder */
function getFolder(context: UploadContext): string {
  const map: Record<UploadContext, string> = {
    portfolio: 'portfolio',
    album:     'albums',
    profile:   'profiles',
    quote_pdf: 'quote-pdfs',
    document:  'documents',
    blog:      'blog',
    fm:        'file-manager',
    general:   'general',
  };
  return map[context] || 'general';
}

/** Determine Cloudinary resource_type from MIME type */
function getResourceType(mimeType: string): 'image' | 'video' | 'raw' {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('image/')) return 'image';
  // PDF, docx, etc → raw
  return 'raw';
}

export interface CloudinaryUploadResult {
  publicId:      string;
  url:           string;   // secure_url (direct CDN URL)
  downloadUrl:   string;   // URL with fl_attachment for forced download
  resourceType:  'image' | 'video' | 'raw';
  format:        string;
  mimeType:      string;
  fileSizeBytes: number;
  width?:        number;
  height?:       number;
  duration?:     number;   // video only, seconds
  folderName:    string;
  originalName:  string;
}

/**
 * Upload a file buffer to Cloudinary.
 * Returns metadata needed to store in MongoDB and render in the frontend.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    fileName:  string;
    mimeType:  string;
    context:   UploadContext;
  }
): Promise<CloudinaryUploadResult> {
  const resourceType = getResourceType(options.mimeType);
  const folder       = getFolder(options.context);
  const ext          = options.fileName.split('.').pop()?.toLowerCase() || '';

  // Build a clean public_id (no extension for image/video; keep for raw)
  const baseName = options.fileName
    .replace(/\.[^.]+$/, '')                  // strip extension
    .replace(/[^a-zA-Z0-9._-]/g, '_')        // safe chars only
    .substring(0, 80);

  const publicIdBase = `${folder}/${Date.now()}_${baseName}`;

  const result = await new Promise<any>((resolve, reject) => {
    const uploadOptions: any = {
      folder,
      public_id:     `${Date.now()}_${baseName}`,
      resource_type: resourceType,
      overwrite:     false,
      // Make all files publicly accessible
      access_mode:   'public',
    };

    // For raw (PDF/doc), preserve the original format
    if (resourceType === 'raw') {
      uploadOptions.format = ext || undefined;
    }

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });

  // Build download URL:
  // • image/video → use fl_attachment transformation
  // • raw (PDF/doc) → append ?response-content-disposition=attachment
  let downloadUrl: string;
  if (resourceType === 'image') {
    downloadUrl = result.secure_url.replace('/upload/', '/upload/fl_attachment/');
  } else if (resourceType === 'video') {
    downloadUrl = result.secure_url.replace('/upload/', '/upload/fl_attachment/');
  } else {
    // raw — just use the secure_url directly (browsers download raw files)
    downloadUrl = result.secure_url;
  }

  return {
    publicId:      result.public_id,
    url:           result.secure_url,
    downloadUrl,
    resourceType,
    format:        result.format || ext,
    mimeType:      options.mimeType,
    fileSizeBytes: result.bytes || buffer.length,
    width:         result.width,
    height:        result.height,
    duration:      result.duration,
    folderName:    folder,
    originalName:  options.fileName,
  };
}

/**
 * Delete a file from Cloudinary by public_id.
 * Silently ignores not-found errors.
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<void> {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
  } catch (err: any) {
    // Ignore not found
    if (!err?.message?.includes('not found')) throw err;
  }
}

/**
 * Map a context string from the upload API to a typed UploadContext.
 */
export function contextFromString(s?: string): UploadContext {
  const map: Record<string, UploadContext> = {
    portfolio: 'portfolio',
    album:     'album',
    profile:   'profile',
    quote:     'quote_pdf',
    quote_pdf: 'quote_pdf',
    document:  'document',
    blog:      'blog',
    fm:        'fm',
  };
  return map[s || ''] || 'general';
}

/**
 * Infer MIME type from extension when the browser doesn't send one.
 */
export function guessMimeType(filename: string, declared?: string): string {
  if (declared && declared !== 'application/octet-stream') return declared;
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    webp: 'image/webp', gif: 'image/gif',  svg: 'image/svg+xml',
    avif: 'image/avif',
    mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return map[ext] || 'application/octet-stream';
}

export { cloudinary };
