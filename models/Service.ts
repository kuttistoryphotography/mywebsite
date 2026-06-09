import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IService extends Document {
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  coverImage?: string;
  images: string[];
  price?: string;
  features: string[];
  isActive: boolean;
  sortOrder: number;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    shortDescription: String,
    coverImage: String,
    images: [String],
    price: String,
    features: [String],
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    icon: String,
  },
  { timestamps: true }
);

ServiceSchema.index({ slug: 1 });
ServiceSchema.index({ isActive: 1 });

const Service: Model<IService> =
  mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema);

export default Service;
