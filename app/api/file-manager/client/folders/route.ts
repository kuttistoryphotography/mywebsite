import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Folder, FileDoc } from '@/models/FileManager';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await connectDB();

    // Folders assigned to this client that are shared
    const folders = await Folder.find({
      clientId: session.userId,
      isSharedWithClient: true,
    })
      .populate('bookingId', 'bookingNumber eventType eventDate status')
      .sort({ createdAt: -1 });

    const folderIds = folders.map((f) => f._id);
    const fileCounts = await FileDoc.aggregate([
      { $match: { folderId: { $in: folderIds } } },
      {
        $group: {
          _id: '$folderId',
          count: { $sum: 1 },
          coverImage: { $first: '$cloudinaryUrl' },
        },
      },
    ]);
    const countMap = new Map(fileCounts.map((c) => [String(c._id), c]));

    return NextResponse.json({
      folders: folders.map((f) => {
        const stats = countMap.get(String(f._id));
        const booking = f.bookingId as any;
        return {
          id: String(f._id),
          folderName: f.name,
          description: f.description || '',
          bookingNumber: booking?.bookingNumber || '—',
          serviceType: booking?.eventType || null,
          eventDate: booking?.eventDate || null,
          status: booking?.status || 'completed',
          fileCount: stats?.count || 0,
          coverImage: stats?.coverImage || null,
          createdAt: f.createdAt,
        };
      }),
    });
  } catch (error) {
    console.error('[Client Folders GET]', error);
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
  }
}
