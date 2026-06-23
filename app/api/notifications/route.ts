import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Notification from '@/models/Notification';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    console.log("SESSION:", session);
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true' || searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    const filter: Record<string, unknown> = { userId: session.userId };
    if (unreadOnly) filter.isRead = false;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit);
      console.log("SESSION USER ID:", session.userId);

      console.log("FILTER:", filter);

    const allNotifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(
      "LATEST DB NOTIFICATIONS:",
      allNotifications.map((n) => ({
        title: n.title,
        userId: String(n.userId),
        createdAt: n.createdAt,
      }))
    );
      

      console.log(
        "NOTIFICATIONS:",
        notifications.map((n) => ({
          id: String(n._id),
          title: n.title,
          userId: String(n.userId),
        }))
      );

      console.log("SESSION USER ID:", session.userId);
      console.log("NOTIFICATIONS FOUND:", notifications.length);
      console.log(
        notifications.map((n) => ({
          title: n.title,
          type: n.type,
          isRead: n.isRead,
          userId: String(n.userId),
        }))
      );

    const unreadCount = await Notification.countDocuments({ userId: session.userId, isRead: false });

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        // Provide both camelCase and snake_case for compatibility
        id: String(n._id),
        type: n.type,
        title: n.title,
        description: n.description,
        isRead: n.isRead,
        is_read: n.isRead,
        relatedEntityType: n.relatedEntityType,
        related_entity_type: n.relatedEntityType,
        relatedEntityId: n.relatedEntityId,
        related_entity_id: n.relatedEntityId,
        actionUrl: n.actionUrl,
        action_url: n.actionUrl,
        createdAt: n.createdAt,
        created_at: n.createdAt,
      })),
      unreadCount,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await connectDB();
    const body = await request.json();

    // Support both payload formats:
    // { id, markAllRead } — original format
    // { action: 'mark-read', notificationId } — bell/dashboard format
    // { action: 'mark-all-read' } — bell/dashboard format
    const { id, markAllRead, action, notificationId } = body;

    const shouldMarkAll = markAllRead || action === 'mark-all-read';
    const targetId = id || notificationId;

    if (shouldMarkAll) {
      await Notification.updateMany({ userId: session.userId, isRead: false }, { isRead: true });
    } else if (targetId) {
      await Notification.findOneAndUpdate(
        { _id: String(targetId), userId: session.userId },
        { isRead: true }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await connectDB();
    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId) return NextResponse.json({ error: 'notificationId required' }, { status: 400 });

    await Notification.findOneAndDelete({ _id: String(notificationId), userId: session.userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
