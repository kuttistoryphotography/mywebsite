/**
 * app/api/file-manager/cleanup/route.ts
 *
 * Admin-only: delete files from Cloudinary AND MongoDB.
 *
 * DELETE ?id=<mongoId>     — delete a single file
 * DELETE ?all=true         — delete ALL files in the file-manager
 */
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { FileDoc } from '@/models/FileManager';
import { CloudinaryFile } from '@/models/CloudinaryFile';
import { getCurrentUser } from '@/lib/auth';
import { deleteFromCloudinary } from '@/lib/cloudinary';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const fileId    = searchParams.get('id');
    const deleteAll = searchParams.get('all') === 'true';

    if (deleteAll) {
      const files = await FileDoc.find({});
      await Promise.allSettled(
        files
          .filter((f) => f.cloudinaryPublicId)
          .map((f) => deleteFromCloudinary(f.cloudinaryPublicId!, f.resourceType as any))
      );
      await FileDoc.deleteMany({});
      await CloudinaryFile.deleteMany({ context: 'fm' }).catch(() => {});
      return NextResponse.json({ success: true, deleted: files.length });
    }

    if (!fileId) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const file = await FileDoc.findById(fileId);
    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 });

    if (file.cloudinaryPublicId) {
      try { await deleteFromCloudinary(file.cloudinaryPublicId, file.resourceType as any); } catch {}
    }

    await FileDoc.findByIdAndDelete(fileId);
    await CloudinaryFile.findOneAndDelete({ publicId: file.cloudinaryPublicId }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
