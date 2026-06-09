import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMonthlyQuote extends Document {
  text: string;
  author?: string;
  month: number;   // 1-12
  year: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MonthlyQuoteSchema = new Schema<IMonthlyQuote>(
  {
    text: { type: String, required: true },
    author: String,
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

MonthlyQuoteSchema.index({ month: 1, year: 1 });
MonthlyQuoteSchema.index({ isActive: 1 });

const MonthlyQuote: Model<IMonthlyQuote> =
  mongoose.models.MonthlyQuote ||
  mongoose.model<IMonthlyQuote>('MonthlyQuote', MonthlyQuoteSchema);

export default MonthlyQuote;
