import mongoose, { Document, Model, Schema } from 'mongoose';
import { MediaType } from '@/lib/media';

// ─── MediaItem sub-schema ─────────────────────────────────────────────────────
// Every image / video / PDF stored in a portfolio must carry an explicit
// mediaType because Google Drive URLs are identical for all file types.

export interface IPortfolioMedia {
  url: string;
  mediaType: MediaType;

  // SEO
  alt?: string;
  caption?: string;
  aiText?: string;

  sortOrder: number;
  driveFileId?: string;
}

export interface IPortfolioSEO {
  seoTitle?: string;
  metaDescription?: string;

  focusKeywords?: string[];
  geoKeywords?: string[];

  aeoQuestions?: string[];

  aiDescription?: string;

  canonicalUrl?: string;

  schemaType?: string;

  robots?: string;
}

const PortfolioMediaSchema = new Schema<IPortfolioMedia>({
  url: {
    type: String,
    required: true,
  },

  mediaType: {
    type: String,
    enum: ['image', 'video', 'pdf'],
    required: true,
    default: 'image',
  },

  alt: {
    type: String,
    default: "",
  },

  caption: {
    type: String,
    default: "",
  },

  aiText: {
    type: String,
    default: "",
  },

  sortOrder: {
    type: Number,
    default: 0,
  },

  driveFileId: String,
}, { _id: false });


// ─── Portfolio item ───────────────────────────────────────────────────────────

export interface IPortfolioItem extends Document {
  title:           string;
  slug:            string;
  category:        string;
  description?:    string;

  /** Cover media — stores url + explicit mediaType */
  coverImage?:     string;
  coverMediaType:  MediaType;

  /**
   * Gallery items — typed MediaItem array.
   * LEGACY: `images: string[]` is kept as a virtual/alias for backward compat.
   */
  media:           IPortfolioMedia[];
  imageCount:      number;   // total media count (images + videos + pdfs)

  tags:            string[];
  featured:        boolean;
  published:       boolean;
  eventDate?:      Date;
  location?:       string;
  clientName?:     string;
  metaTitle?:      string;
  metaDescription?: string;
  ogImage?:        string;
  focusKeywords: string[];

  // New SEO Object
  seo?: IPortfolioSEO;

  viewCount: number;
  sortOrder:       number;
  createdBy?:      mongoose.Types.ObjectId;
  createdAt:       Date;
  updatedAt:       Date;
}

const PortfolioItemSchema = new Schema<IPortfolioItem>(
  {
    title:           { type: String, required: true },
    slug:            { type: String, required: true, unique: true },
    category:        { type: String, required: true },
    description:     String,

    coverImage:      String,
    coverMediaType:  { type: String, enum: ['image', 'video', 'pdf'], default: 'image' },

    media:           { type: [PortfolioMediaSchema], default: [] },
    imageCount:      { type: Number, default: 0 },

    tags:            [String],
    featured:        { type: Boolean, default: false },
    published:       { type: Boolean, default: false },
    eventDate:       Date,
    location:        String,
    clientName:      String,
    metaTitle:       String,
    metaDescription: String,
    ogImage:         String,
    focusKeywords:   [String],
    seo: {
      seoTitle: {
        type: String,
        default: "",
      },

      metaDescription: {
        type: String,
        default: "",
      },

      focusKeywords: {
        type: [String],
        default: [],
      },

      geoKeywords: {
        type: [String],
        default: [],
      },

      aeoQuestions: {
        type: [String],
        default: [],
      },

      aiDescription: {
        type: String,
        default: "",
      },

      canonicalUrl: {
        type: String,
        default: "",
      },

      schemaType: {
        type: String,
        default: "ImageGallery",
      },

      robots: {
        type: String,
        default: "index,follow",
      },
    },
    viewCount:       { type: Number, default: 0 },
    sortOrder:       { type: Number, default: 0 },
    createdBy:       { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

PortfolioItemSchema.index({ slug: 1 });
PortfolioItemSchema.index({ category: 1 });
PortfolioItemSchema.index({ published: 1 });
PortfolioItemSchema.index({ featured: 1 });

// ── Virtual: `images` (legacy string[]) ──────────────────────────────────────
// Old code that reads `item.images` gets an array of URL strings.
PortfolioItemSchema.virtual('images').get(function () {
  return (this.media || []).map((m: IPortfolioMedia) => m.url);
});

const PortfolioItem: Model<IPortfolioItem> =
  mongoose.models.PortfolioItem ||
  mongoose.model<IPortfolioItem>('PortfolioItem', PortfolioItemSchema);

export default PortfolioItem;
