/**
 * models/FileManager.ts
 *
 * Folder + File models for the admin client file-manager.
 * All storage is backed by Cloudinary.
 */

import mongoose, { Document, Model, Schema } from 'mongoose';

// ─── Folder ───────────────────────────────────────────────────────────────────

export interface IFolder extends Document {
  name:               string;
  clientId?:          mongoose.Types.ObjectId;
  bookingId?:         mongoose.Types.ObjectId;
  parentFolderId?:    mongoose.Types.ObjectId;
  description?:       string;
  color?:             string;
  isSharedWithClient: boolean;
  createdBy?:         mongoose.Types.ObjectId;
  createdAt:          Date;
  updatedAt:          Date;
}

const FolderSchema = new Schema<IFolder>(
  {
    name:               { type: String, required: true, trim: true },
    clientId:           { type: Schema.Types.ObjectId, ref: 'User' },
    bookingId:          { type: Schema.Types.ObjectId, ref: 'Booking' },
    parentFolderId:     { type: Schema.Types.ObjectId, ref: 'Folder' },
    description:        String,
    color:              { type: String, default: '#6366f1' },
    isSharedWithClient: { type: Boolean, default: false },
    createdBy:          { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Folder: Model<IFolder> =
  mongoose.models.Folder || mongoose.model<IFolder>('Folder', FolderSchema);

// ─── File ─────────────────────────────────────────────────────────────────────

export interface IFile extends Document {
  originalName:          string;
  fileName:              string;
  fileType:              string;
  mimeType:              string;
  fileSize:              number;

  /** Cloudinary public_id */
  cloudinaryPublicId?:   string;
  /** Direct Cloudinary CDN URL */
  cloudinaryUrl?:        string;
  /** Download URL (with fl_attachment or proxy) */
  cloudinaryDownloadUrl?: string;
  /** Cloudinary resource type */
  resourceType?:         'image' | 'video' | 'raw';

  // Legacy Google Drive fields — kept so old documents still deserialise
  driveFileId?:          string;
  driveUrl?:             string;
  driveWebViewLink?:     string;
  driveFolderName?:      string;

  folderId?:             mongoose.Types.ObjectId;
  clientId?:             mongoose.Types.ObjectId;
  bookingId?:            mongoose.Types.ObjectId;
  isSharedWithClient:    boolean;
  downloadCount:         number;
  uploadedBy?:           mongoose.Types.ObjectId;
  createdAt:             Date;
  updatedAt:             Date;
}

const FileSchema = new Schema<IFile>(
  {
    originalName:          { type: String, required: true },
    fileName:              { type: String, required: true },
    fileType:              { type: String, required: true },
    mimeType:              { type: String, required: true },
    fileSize:              { type: Number, required: true },

    cloudinaryPublicId:    String,
    cloudinaryUrl:         String,
    cloudinaryDownloadUrl: String,
    resourceType:          { type: String, enum: ['image', 'video', 'raw'] },

    // Legacy — kept for backward compatibility
    driveFileId:           String,
    driveUrl:              String,
    driveWebViewLink:      String,
    driveFolderName:       String,

    folderId:              { type: Schema.Types.ObjectId, ref: 'Folder' },
    clientId:              { type: Schema.Types.ObjectId, ref: 'User' },
    bookingId:             { type: Schema.Types.ObjectId, ref: 'Booking' },
    isSharedWithClient:    { type: Boolean, default: false },
    downloadCount:         { type: Number, default: 0 },
    uploadedBy:            { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

FileSchema.index({ folderId: 1 });
FileSchema.index({ clientId: 1 });
FileSchema.index({ cloudinaryPublicId: 1 });

export const FileDoc: Model<IFile> =
  mongoose.models.FileDoc || mongoose.model<IFile>('FileDoc', FileSchema);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Return the best available URL for viewing/downloading a file.
 * Prefers Cloudinary; falls back to legacy Drive.
 */
export function getFileUrl(file: IFile): string {
  return file.cloudinaryUrl || file.driveUrl || '';
}

/**
 * Return the download URL (forces browser download).
 */
export function getFileDownloadUrl(file: IFile): string {
  return file.cloudinaryDownloadUrl || file.driveUrl || '';
}

/**
 * Return the view/preview URL.
 * For PDFs (raw), returns the pdf-proxy route.
 */
export function getFileViewLink(file: IFile): string {
  if (file.resourceType === 'raw' || file.mimeType === 'application/pdf') {
    const url = file.cloudinaryUrl || file.driveUrl || '';
    if (url) return `/api/pdf-proxy?${new URLSearchParams({ url })}`;
  }
  return file.cloudinaryUrl || file.driveWebViewLink || '';
}

/**
 * Return an inline-preview URL.
 * Same as getFileViewLink for Cloudinary (images/videos render directly).
 */
export function getFilePreviewLink(file: IFile): string {
  return getFileViewLink(file);
}
