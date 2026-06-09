import mongoose, { Document, Model, Schema } from 'mongoose';
import { MediaType } from '@/lib/media';

// ─── AlbumMedia sub-schema ────────────────────────────────────────────────────
// mediaType is REQUIRED — Drive URLs look identical for images, videos, and PDFs.

export interface IAlbumMedia {
  url:          string;
  mediaType:    MediaType;   // "image" | "video" | "pdf" — REQUIRED
  caption?:     string;
  sortOrder:    number;
  driveFileId?: string;
}

const AlbumMediaSchema = new Schema<IAlbumMedia>({
  url:         { type: String, required: true },
  mediaType:   { type: String, enum: ['image', 'video', 'pdf'], required: true, default: 'image' },
  caption:     String,
  sortOrder:   { type: Number, default: 0 },
  driveFileId: String,
}, { _id: false });

// ─── Album ────────────────────────────────────────────────────────────────────

export interface IAlbum extends Document {
  title:          string;
  slug:           string;
  category:       string;
  /** Cover image URL (Drive) */
  coverImage?:    string;
  /** Explicit type for the cover — required for Drive */
  coverMediaType: MediaType;
  description?:   string;
  media:          IAlbumMedia[];
  published:      boolean;
  sortOrder:      number;
  createdBy?:     mongoose.Types.ObjectId;
  createdAt:      Date;
  updatedAt:      Date;
}

const AlbumSchema = new Schema<IAlbum>(
  {
    title:          { type: String, required: true },
    slug:           { type: String, required: true, unique: true },
    category:       { type: String, required: true },
    coverImage:     String,
    coverMediaType: { type: String, enum: ['image', 'video', 'pdf'], default: 'image' },
    description:    String,
    media:          { type: [AlbumMediaSchema], default: [] },
    published:      { type: Boolean, default: false },
    sortOrder:      { type: Number, default: 0 },
    createdBy:      { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

AlbumSchema.index({ slug: 1 });
AlbumSchema.index({ category: 1 });
AlbumSchema.index({ published: 1 });

const Album: Model<IAlbum> =
  mongoose.models.Album || mongoose.model<IAlbum>('Album', AlbumSchema);

export default Album;
