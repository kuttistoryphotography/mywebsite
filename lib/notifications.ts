import connectDB from './db';
import Notification, { NotificationType } from '@/models/Notification';
import User from '@/models/User';

interface NotificationData {
  type: NotificationType;
  title: string;
  description: string;
  relatedEntityType?: string;
  relatedEntityId?: string | number;
  actionUrl?: string;
  adminId?: string;
}

export async function createNotification(userId: string, data: NotificationData) {
  await connectDB();
  return Notification.create({
    userId,
    ...data,
    relatedEntityId: String(data.relatedEntityId || ''),
  });
}

export async function createBulkNotifications(userIds: string[], data: NotificationData) {
  await connectDB();
  const notifications = userIds.map((userId) => ({
    userId,
    ...data,
    relatedEntityId: String(data.relatedEntityId || ''),
  }));
  return Notification.insertMany(notifications);
}

export async function getAdminUserIds(): Promise<string[]> {
  await connectDB();
  const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
  return admins.map((a) => String(a._id));
}
