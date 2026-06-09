import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Folder, FileDoc } from '@/models/FileManager';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }
    await connectDB();

    const folders = await Folder.find()
      .populate('clientId', 'firstName lastName email')
      .populate('bookingId', 'bookingNumber eventType eventDate')
      .sort({ createdAt: -1 });

    const folderIds = folders.map((f) => f._id);
    const fileCounts = await FileDoc.aggregate([
      { $match: { folderId: { $in: folderIds } } },
      {
        $group: {
          _id: '$folderId',
          count: { $sum: 1 },
          lastUpload: { $max: '$createdAt' },
          coverImage: { $first: '$cloudinaryUrl' },
        },
      },
    ]);
    const countMap = new Map(fileCounts.map((c) => [String(c._id), c]));

    return NextResponse.json({
      folders: folders.map((f) => {
        const stats = countMap.get(String(f._id));
        const client = f.clientId as any;
        const booking = f.bookingId as any;
        return {
          id: String(f._id),
          folderName: f.name,
          description: f.description || '',
          color: f.color,
          isSharedWithClient: f.isSharedWithClient,
          fileCount: stats?.count || 0,
          lastUploadedAt: stats?.lastUpload || null,
          coverImage: stats?.coverImage || null,
          createdAt: f.createdAt,
          // client info
          assignedClientId: client?._id ? String(client._id) : null,
          assignedClientName: client ? `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email : null,
          assignedClientEmail: client?.email || null,
          // booking info
          assignedBookingId: booking?._id ? String(booking._id) : null,
          assignedBookingNumber: booking?.bookingNumber || null,
          assignedEventType: booking?.eventType || null,
        };
      }),
    });
  } catch (error) {
    console.error('[Folders GET]', error);
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }
    await connectDB();
    const body = await request.json();
    const { folderName, name, clientId, bookingId, description, color, isSharedWithClient } = body;
    const resolvedName = (folderName || name || '').trim();
    if (!resolvedName) return NextResponse.json({ error: 'Folder name required' }, { status: 400 });

    const folder = await Folder.create({
      name: resolvedName,
      clientId: clientId || undefined,
      bookingId: bookingId || undefined,
      description: description || '',
      color: color || '#f59e0b',
      isSharedWithClient: !!isSharedWithClient,
      createdBy: session.userId,
    });

    return NextResponse.json({
      success: true,
      folder: {
        id: String(folder._id),
        folderName: folder.name,
        description: folder.description,
        color: folder.color,
        isSharedWithClient: folder.isSharedWithClient,
        fileCount: 0,
        lastUploadedAt: null,
        coverImage: null,
        createdAt: folder.createdAt,
        assignedClientId: null,
        assignedClientName: null,
        assignedClientEmail: null,
        assignedBookingId: null,
        assignedBookingNumber: null,
        assignedEventType: null,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[Folders POST]', error);
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }
    await connectDB();
    const body = await request.json();
    const { id, folderName, name, description, color, isSharedWithClient, clientId, bookingId } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const update: Record<string, unknown> = {};
    const resolvedName = folderName || name;
    if (resolvedName !== undefined) update.name = resolvedName.trim();
    if (description !== undefined) update.description = description;
    if (color !== undefined) update.color = color;
    if (isSharedWithClient !== undefined) update.isSharedWithClient = isSharedWithClient;
    // Allow setting or clearing clientId and bookingId
    if (clientId !== undefined) update.clientId = clientId || null;
    if (bookingId !== undefined) update.bookingId = bookingId || null;

    await Folder.findByIdAndUpdate(id, update);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Folders PUT]', error);
    return NextResponse.json({ error: 'Failed to update folder' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }
    await connectDB();
    const { searchParams } = new URL(request.url);
    // Accept both ?id= and ?folderId=
    const folderId = searchParams.get('id') || searchParams.get('folderId');
    if (!folderId) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await FileDoc.deleteMany({ folderId });
    await Folder.findByIdAndDelete(folderId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Folders DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
  }
}
