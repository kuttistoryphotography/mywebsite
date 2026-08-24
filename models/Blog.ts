import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IGalleryStory {
  label: string;
  title: string;
  text: string;
}

export interface IBlog extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  galleryImages: string[];
  galleryStories: IGalleryStory[];
  imageAlt?: string;
  category: string;
  tags: string[];
  published: boolean;
  status: string;
  isFeatured: boolean;
  publishedAt?: Date;
  authorId?: mongoose.Types.ObjectId;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  focusKeywords: string[];
  schemaType: string;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    title:           { type: String, required: true },
    slug:            { type: String, required: true, unique: true },
    content:         { type: String, required: true },
    excerpt:                 String,
    coverImage:              String,
    galleryImages:   { type: [String], default: [] },
    galleryStories: {
      type: [
        {
          label: { type: String, default: "" },
          title: { type: String, default: "" },
          text: { type: String, default: "" },
        },
      ],
      default: [],
    },
    imageAlt:        { type: String,  default: "", },
    category:        { type: String, default: 'General' },
    tags:            [String],
    published:       { type: Boolean, default: false },
    status:          { type: String, default: 'draft', enum: ['draft', 'published', 'archived'] },
    isFeatured:      { type: Boolean, default: false },
    publishedAt:     Date,
    authorId:        { type: Schema.Types.ObjectId, ref: 'User' },
    metaTitle:       String,
    metaDescription: String,
    ogImage:         String,
    canonicalUrl:    String,
    focusKeywords:   [String],
    schemaType:      { type: String, default: 'Article' },
    viewCount:       { type: Number, default: 0 },
  },
  { timestamps: true }
);

BlogSchema.index({ slug: 1 });
BlogSchema.index({ published: 1 });
BlogSchema.index({ status: 1 });

const Blog: Model<IBlog> =
  mongoose.models.Blog || mongoose.model<IBlog>('Blog', BlogSchema);

export default Blog;
