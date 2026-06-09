import mongoose, { Document, Model, Schema } from 'mongoose';

export type NotificationType =
  | 'quote_requested' | 'quote_responded' | 'quote_accepted' | 'quote_rejected'
  | 'booking_confirmed' | 'booking_cancelled' | 'booking_updated'
  | 'payment_received' | 'message' | 'system' | 'payment_rejected' | 'payment_verified';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  description: string;
  isRead: boolean;
  relatedEntityType?: string;
  relatedEntityId?: string;
  actionUrl?: string;
  adminId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['quote_requested','quote_responded','quote_accepted','quote_rejected',
             'booking_confirmed','booking_cancelled','booking_updated',
             'payment_received','message','system', 'payment_rejected', 'payment_verified'],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    relatedEntityType: String,
    relatedEntityId: String,
    actionUrl: String,
    adminId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1 });
NotificationSchema.index({ isRead: 1 });

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
