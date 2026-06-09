import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  rating: number;           // 1–5
  category: string;         // 'wedding' | 'outdoor' | 'baby-shoot' | etc.
  title: string;
  body: string;
  approved: boolean;        // admin approves before public display
  featured: boolean;        // show in testimonial hero
  serviceDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName:    { type: String, required: true },
    userEmail:   { type: String, required: true },
    userAvatar:  { type: String },
    rating:      { type: Number, required: true, min: 1, max: 5 },
    category:    { type: String, required: true },
    title:       { type: String, required: true },
    body:        { type: String, required: true },
    approved:    { type: Boolean, default: false },
    featured:    { type: Boolean, default: false },
    serviceDate: { type: Date },
  },
  { timestamps: true }
);

ReviewSchema.index({ category: 1, approved: 1 });
ReviewSchema.index({ userId: 1 });

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
