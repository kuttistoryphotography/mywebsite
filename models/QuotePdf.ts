import mongoose, { Document, Model, Schema } from 'mongoose';

/**
 * QuotePdf — admin-managed PDF library.
 *
 * Each document represents ONE pricing-tier PDF for a specific service type.
 * e.g. serviceType = "wedding", tier = "premium" → the premium wedding PDF.
 *
 * When a user submits a quote request the system looks up all tiers for
 * their serviceType and emails those PDFs automatically.
 */

export type PricingTier = 'budget_friendly' | 'premium' | 'low_cost' | 'customizable';

export const PRICING_TIERS: PricingTier[] = [
  'budget_friendly',
  'premium',
  'low_cost',
  'customizable',
];

export const PRICING_TIER_LABELS: Record<PricingTier, string> = {
  budget_friendly: 'Budget Friendly',
  premium:         'Premium',
  low_cost:        'Low Cost',
  customizable:    'Customizable',
};

export interface IQuotePdf extends Document {
  serviceType:  string;   // e.g. "wedding", "food", "outdoor"  (lowercase, trimmed)
  tier:         PricingTier;
  label:        string;   // human-readable tier label
  fileName:     string;   // original file name for email attachment
  driveFileId:  string;   // Google Drive file ID
  driveWebViewLink?: string; // https://drive.google.com/file/d/…/view
  driveDownloadLink?: string; // direct download link
  fileSizeBytes?: number;
  isActive:     boolean;
  uploadedBy?:  mongoose.Types.ObjectId;
  createdAt:    Date;
  updatedAt:    Date;
}

const QuotePdfSchema = new Schema<IQuotePdf>(
  {
    serviceType:       { type: String, required: true, lowercase: true, trim: true },
    tier:              { type: String, required: true, enum: PRICING_TIERS },
    label:             { type: String, required: true },
    fileName:          { type: String, required: true },
    driveFileId:       { type: String, required: true },
    driveWebViewLink:  String,
    driveDownloadLink: String,
    fileSizeBytes:     Number,
    isActive:          { type: Boolean, default: true },
    uploadedBy:        { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Only one active PDF per serviceType+tier combination
QuotePdfSchema.index({ serviceType: 1, tier: 1 });
QuotePdfSchema.index({ serviceType: 1, isActive: 1 });

const QuotePdf: Model<IQuotePdf> =
  mongoose.models.QuotePdf ||
  mongoose.model<IQuotePdf>('QuotePdf', QuotePdfSchema);

export default QuotePdf;