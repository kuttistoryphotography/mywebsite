import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IQuote extends Document {
  quoteNumber: string;
  userId: mongoose.Types.ObjectId;
  serviceType: string;
  eventDate?: Date;
  eventLocation?: string;
  description?: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  status: 'quote_requested' | 'under_review' | 'quote_reviewed' | 'requoted' | 'deal_closed' | 'rejected';
  quotedPrice?: number;
  adminNotes?: string;
  requoteReason?: string;
  requoteCount: number;
  lastAction?: string;
  actionTakenAt?: Date;
  pdfUrl?: string;
  whatsappSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuoteSchema = new Schema<IQuote>(
  {
    quoteNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    serviceType: { type: String, required: true },
    eventDate: Date,
    eventLocation: String,
    description: String,
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    clientPhone: String,
    status: {
      type: String,
      enum: ['quote_requested', 'under_review', 'quote_reviewed', 'requoted', 'deal_closed', 'rejected'],
      default: 'quote_requested',
    },
    quotedPrice: Number,
    adminNotes: String,
    requoteReason: String,
    requoteCount: { type: Number, default: 0 },
    lastAction: String,
    actionTakenAt: Date,
    pdfUrl: String,
    whatsappSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

QuoteSchema.index({ userId: 1 });
QuoteSchema.index({ status: 1 });
QuoteSchema.index({ quoteNumber: 1 });

const Quote: Model<IQuote> =
  mongoose.models.Quote || mongoose.model<IQuote>('Quote', QuoteSchema);

export default Quote;
