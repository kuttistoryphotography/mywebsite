import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITimelineEntry {
  stage: string;
  status: 'completed' | 'current' | 'pending';
  notes?: string;
  completedBy?: mongoose.Types.ObjectId;
  startedAt?: Date;
  completedAt?: Date;
}

export interface IBooking extends Document {
  bookingNumber: string;
  userId: mongoose.Types.ObjectId;
  quoteId?: mongoose.Types.ObjectId;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  serviceName?: string;
  eventType?: string;
  eventDate?: Date;
  eventTime?: string;
  eventLocation?: string;
  eventCity?: string;
  guestCount?: number;
  specialRequests?: string;
  howDidYouHear?: string;
  estimatedPrice?: number;
  depositAmount?: number;
  depositPaid: boolean;
  totalPaid: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  status: 'pending' | 'confirmed' | 'in_progress' | 'cancelled' | 'completed';
  currentStage: string;
  timeline: ITimelineEntry[];
  pdfUrl?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TimelineEntrySchema = new Schema<ITimelineEntry>({
  stage: { type: String, required: true },
  status: { type: String, enum: ['completed', 'current', 'pending'], default: 'pending' },
  notes: String,
  completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  startedAt: Date,
  completedAt: Date,
});

const BookingSchema = new Schema<IBooking>(
  {
    bookingNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    quoteId: { type: Schema.Types.ObjectId, ref: 'Quote' },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    clientPhone: String,
    serviceName: String,
    eventType: String,
    eventDate: Date,
    eventTime: String,
    eventLocation: String,
    eventCity: String,
    guestCount: Number,
    specialRequests: String,
    howDidYouHear: String,
    estimatedPrice: Number,
    depositAmount: Number,
    depositPaid: { type: Boolean, default: false },
    totalPaid: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },
    status: { type: String, enum: ['pending', 'in_progress', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
    currentStage: { type: String, default: 'processing' },
    timeline: [TimelineEntrySchema],
    pdfUrl: String,
    completedAt: Date,
  },
  { timestamps: true }
);

BookingSchema.index({ userId: 1 });
BookingSchema.index({ bookingNumber: 1 });
BookingSchema.index({ status: 1 });

const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;
