/**
 * app/api/auth/drive-callback/route.ts
 *
 * @deprecated Google Drive has been removed. This route returns a 410 Gone.
 */
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Google Drive integration has been removed. This application now uses Cloudinary for storage.' },
    { status: 410 }
  );
}
