/**
 * lib/cloudinary.ts
 *
 * Cloudinary upload helper — supports both small (buffer) and large (chunked) uploads.
 *
 * Required env vars:
 *   CLOUDINARY_CLOUD_NAME   — your cloud name
 *   CLOUDINARY_API_KEY      — API key
 *   CLOUDINARY_API_SECRET   — API secret
 *
 * Supports: images, videos, PDFs, documents up to 2 GB
 */

import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

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
  return 'raw';
}

export interface CloudinaryUploadResult {
  publicId:      string;
  url:           string;
  downloadUrl:   string;
  resourceType:  'image' | 'video' | 'raw';
  format:        string;
  mimeType:      string;
  fileSizeBytes: number;
  width?:        number;
  height?:       number;
  duration?:     number;
  folderName:    string;
  originalName:  string;
}

/**
 * Upload a file buffer to Cloudinary.
 * For files > 95 MB, automatically switches to chunked upload_large.
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

  const baseName = options.fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 80);

  const publicIdBase = `${Date.now()}_${baseName}`;

  const uploadOptions: any = {
    folder,
    public_id:     publicIdBase,
    resource_type: resourceType,
    overwrite:     false,
    access_mode:   'public',
    chunk_size:    50 * 1024 * 1024, // 50 MB chunks
    timeout:       600000,            // 10 min timeout
  };

  if (resourceType === 'raw') {
    uploadOptions.format = ext || undefined;
  }

  // Use upload_large for files >= 95 MB (Cloudinary's recommended threshold)
  const USE_LARGE = buffer.length >= 95 * 1024 * 1024;

  const result = await new Promise<any>((resolve, reject) => {
    if (USE_LARGE) {
      // upload_large uses streams and handles chunking automatically
      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);

      cloudinary.uploader.upload_large_stream(
        { ...uploadOptions, chunk_size: 50 * 1024 * 1024 },
        (error, res) => {
          if (error) reject(error);
          else resolve(res);
        }
      ).end(buffer);
    } else {
      const stream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, res) => {
          if (error) reject(error);
          else resolve(res);
        }
      );
      stream.end(buffer);
    }
  });

  // Build download URL
  let downloadUrl: string;
  if (resourceType === 'image' || resourceType === 'video') {
    downloadUrl = result.secure_url.replace('/upload/', '/upload/fl_attachment/');
  } else {
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
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<void> {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
  } catch (err: any) {
    if (!err?.message?.includes('not found')) throw err;
  }
}

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

export function guessMimeType(filename: string, declared?: string): string {
  if (declared && declared !== 'application/octet-stream') return declared;
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    webp: 'image/webp', gif: 'image/gif',  svg: 'image/svg+xml',
    avif: 'image/avif',
    mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
    avi: 'video/x-msvideo', mkv: 'video/x-matroska',
    m4v: 'video/mp4', flv: 'video/x-flv', wmv: 'video/x-ms-wmv',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return map[ext] || 'application/octet-stream';
}

export { cloudinary };
