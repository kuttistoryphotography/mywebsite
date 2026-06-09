import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISupportMessage {
  role: 'user' | 'admin';
  content: string;
  createdAt: Date;
  readAt?: Date;
}

export interface ISupportTicket extends Document {
  ticketNumber: string;
  userId: mongoose.Types.ObjectId;
  subject: string;
  category: 'general' | 'booking' | 'payment' | 'files' | 'technical' | 'other';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  messages: ISupportMessage[];
  adminUnread: number;
  userUnread: number;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SupportMessageSchema = new Schema<ISupportMessage>({
  role:    { type: String, enum: ['user', 'admin'], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  readAt: Date,
});

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    ticketNumber: { type: String, required: true, unique: true },
    userId:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject:      { type: String, required: true },
    category:     { type: String, enum: ['general','booking','payment','files','technical','other'], default: 'general' },
    status:       { type: String, enum: ['open','in_progress','resolved','closed'], default: 'open' },
    priority:     { type: String, enum: ['low','normal','high','urgent'], default: 'normal' },
    messages:     [SupportMessageSchema],
    adminUnread:  { type: Number, default: 0 },
    userUnread:   { type: Number, default: 0 },
    resolvedAt:   Date,
  },
  { timestamps: true }
);

SupportTicketSchema.index({ userId: 1 });
SupportTicketSchema.index({ status: 1 });

const SupportTicket: Model<ISupportTicket> =
  mongoose.models.SupportTicket ||
  mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);

export default SupportTicket;
