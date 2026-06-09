import mongoose, { Document, Model, Schema } from 'mongoose';

/**
 * PhotographyCategory — admin-managed photography service categories.
 *
 * Each category (e.g. Wedding Photography, Baby Shoots, Food, Ads) can have
 * any number of PDF pricing documents attached. When a user requests a quote
 * for a category, ALL active PDFs for that category are emailed via Drive links.
 */

export interface ICategoryPdf {
  driveFileId:      string;
  driveWebViewLink?: string;
  driveDownloadLink?: string;
  fileName:         string;
  fileSizeBytes?:   number;
  label?:           string;   // optional display label for this PDF
  uploadedAt:       Date;
}

export interface IPhotographyCategory extends Document {
  name:        string;   // e.g. "Wedding Photography"
  slug:        string;   // e.g. "wedding-photography"
  description?: string;
  isActive:    boolean;
  sortOrder:   number;
  pdfs:        ICategoryPdf[];
  createdAt:   Date;
  updatedAt:   Date;
}

const CategoryPdfSchema = new Schema<ICategoryPdf>(
  {
    driveFileId:       { type: String, required: true },
    driveWebViewLink:  String,
    driveDownloadLink: String,
    fileName:          { type: String, required: true },
    fileSizeBytes:     Number,
    label:             String,
    uploadedAt:        { type: Date, default: Date.now },
  },
  { _id: true }
);

const PhotographyCategorySchema = new Schema<IPhotographyCategory>(
  {
    name:        { type: String, required: true, trim: true },
    slug:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: String,
    isActive:    { type: Boolean, default: true },
    sortOrder:   { type: Number, default: 0 },
    pdfs:        [CategoryPdfSchema],
  },
  { timestamps: true }
);

PhotographyCategorySchema.index({ slug: 1 });
PhotographyCategorySchema.index({ isActive: 1, sortOrder: 1 });

const PhotographyCategory: Model<IPhotographyCategory> =
  mongoose.models.PhotographyCategory ||
  mongoose.model<IPhotographyCategory>('PhotographyCategory', PhotographyCategorySchema);

export default PhotographyCategory;
