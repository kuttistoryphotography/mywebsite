/**
 * models/CloudinaryFile.ts
 *
 * Platform-wide Cloudinary file registry.
 *
 * Every file uploaded to Cloudinary — images, videos, PDFs, documents —
 * gets a record here. This lets admin and user panels look up, preview,
 * and download any file without hitting Cloudinary's API each time.
 *
 * context values:
 *   portfolio | album | profile | quote_pdf | document | blog | fm | general
 */

import mongoose, { Document, Model, Schema } from 'mongoose';

export type CloudinaryContext =
  | 'portfolio' | 'album' | 'profile' | 'quote_pdf'
  | 'document'  | 'blog'  | 'fm'      | 'general';

export interface ICloudinaryFile extends Document {
  /** Original filename as uploaded */
  originalName:    string;
  /** Cloudinary public_id (used for transformations and deletion) */
  publicId:        string;
  /** Direct CDN URL — https://res.cloudinary.com/... */
  url:             string;
  /** Download URL (with fl_attachment or proxy for PDFs) */
  downloadUrl:     string;
  /** Cloudinary resource type: image | video | raw */
  resourceType:    'image' | 'video' | 'raw';
  /** File format / extension */
  format:          string;
  /** MIME type */
  mimeType:        string;
  /** File size in bytes */
  fileSizeBytes:   number;
  /** Cloudinary folder name */
  folderName:      string;
  /** Upload context (which section of the platform) */
  context:         CloudinaryContext;
  /** Human-readable label (defaults to originalName) */
  label:           string;
  /** Optional: the MongoDB model name this file belongs to */
  refModel?:       string;
  /** Optional: the MongoDB document _id this file belongs to */
  refId?:          mongoose.Types.ObjectId;
  /** Who uploaded it */
  uploadedBy?:     mongoose.Types.ObjectId;
  createdAt:       Date;
  updatedAt:       Date;
}

const CloudinaryFileSchema = new Schema<ICloudinaryFile>(
  {
    originalName:  { type: String, required: true },
    publicId:      { type: String, required: true, unique: true },
    url:           { type: String, required: true },
    downloadUrl:   { type: String, required: true },
    resourceType:  { type: String, enum: ['image', 'video', 'raw'], default: 'image' },
    format:        { type: String, default: '' },
    mimeType:      { type: String, required: true },
    fileSizeBytes: { type: Number, default: 0 },
    folderName:    { type: String, default: '' },
    context:       {
      type: String,
      enum: ['portfolio','album','profile','quote_pdf','document','blog','fm','general'],
      default: 'general',
    },
    label:     { type: String, default: '' },
    refModel:  String,
    refId:     { type: Schema.Types.ObjectId },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

CloudinaryFileSchema.index({ context: 1, createdAt: -1 });
CloudinaryFileSchema.index({ refModel: 1, refId: 1 });
CloudinaryFileSchema.index({ uploadedBy: 1 });

export const CloudinaryFile: Model<ICloudinaryFile> =
  mongoose.models.CloudinaryFile ||
  mongoose.model<ICloudinaryFile>('CloudinaryFile', CloudinaryFileSchema);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Return a preview URL for inline viewing.
 * Images/videos: direct URL. PDFs (raw): proxy route.
 */
export function cloudinaryPreviewUrl(file: ICloudinaryFile): string {
  if (file.resourceType === 'raw') {
    return `/api/pdf-proxy?${new URLSearchParams({ url: file.url })}`;
  }
  return file.url;
}

/**
 * Return the download URL.
 */
export function cloudinaryDownloadUrl(file: ICloudinaryFile): string {
  return file.downloadUrl || file.url;
}
