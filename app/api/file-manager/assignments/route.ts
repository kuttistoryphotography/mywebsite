import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { FileDoc, Folder } from '@/models/FileManager';
import { getCurrentUser } from '@/lib/auth';
import User from '@/models/User';
import Booking from '@/models/Booking';

// GET — fetch all users + their bookings for the assign dropdown
export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }
    await connectDB();

    const [users, bookings] = await Promise.all([
      User.find({ role: { $ne: 'admin' } }).select('firstName lastName email').sort({ firstName: 1 }),
      Booking.find().select('userId bookingNumber eventType eventDate').sort({ createdAt: -1 }),
    ]);

    return NextResponse.json({
      users: users.map((u) => ({
        id: String(u._id),
        first_name: u.firstName || '',
        last_name: u.lastName || '',
        email: u.email,
      })),
      bookings: bookings.map((b) => ({
        id: String(b._id),
        user_id: String(b.userId),
        booking_number: b.bookingNumber,
        event_type: b.eventType || null,
        event_date: b.eventDate || null,
      })),
    });
  } catch (error) {
    console.error('[Assignments GET]', error);
    return NextResponse.json({ error: 'Failed to load assignments data' }, { status: 500 });
  }
}

// POST — bulk assign files to a client or update sharing
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }
    await connectDB();
    const body = await request.json();
    const { fileIds, folderId, clientId, isSharedWithClient } = body;

    if (folderId) {
      // Assign/update whole folder
      const update: Record<string, unknown> = {};
      if (clientId !== undefined) update.clientId = clientId || null;
      if (isSharedWithClient !== undefined) update.isSharedWithClient = isSharedWithClient;
      await Folder.findByIdAndUpdate(folderId, update);
      // Propagate clientId and sharing to all files in folder
      await FileDoc.updateMany({ folderId }, update);
      return NextResponse.json({ success: true });
    }

    if (!fileIds?.length) return NextResponse.json({ error: 'fileIds or folderId required' }, { status: 400 });
    const update: Record<string, unknown> = {};
    if (clientId !== undefined) update.clientId = clientId;
    if (isSharedWithClient !== undefined) update.isSharedWithClient = isSharedWithClient;
    await FileDoc.updateMany({ _id: { $in: fileIds } }, update);
    return NextResponse.json({ success: true, updated: fileIds.length });
  } catch (error) {
    console.error('[Assignments POST]', error);
    return NextResponse.json({ error: 'Failed to assign files' }, { status: 500 });
  }
}
