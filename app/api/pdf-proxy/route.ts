/**
 * app/api/pdf-proxy/route.ts
 *
 * PDF Proxy — streams PDFs from Cloudinary or legacy sources
 * with correct Content-Type so browsers render them inline or download.
 *
 * GET /api/pdf-proxy?url=<encoded-url>&download=1&filename=file.pdf
 * GET /api/pdf-proxy?publicId=<cloudinary-public-id>&download=1&filename=file.pdf
 */
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUrl   = searchParams.get('url');
    const publicId = searchParams.get('publicId');
    const download = searchParams.get('download') === '1';
    const filename = searchParams.get('filename') || 'document.pdf';

    let targetUrl = rawUrl || '';

    // If publicId provided, build Cloudinary raw URL
    if (!targetUrl && publicId) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      targetUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}`;
    }

    if (!targetUrl) {
      return NextResponse.json({ error: 'url or publicId parameter required' }, { status: 400 });
    }

    // Only allow Cloudinary or legacy Drive/Cloudinary URLs
    const isCloudinary = targetUrl.includes('res.cloudinary.com');
    const isDrive      = targetUrl.includes('drive.google.com');

    if (!isCloudinary && !isDrive) {
      return NextResponse.json(
        { error: 'Only Cloudinary or Google Drive URLs are supported' },
        { status: 403 }
      );
    }

    // For Drive legacy URLs, convert to direct download
    if (isDrive && targetUrl.includes('/view')) {
      const idMatch = targetUrl.match(/\/d\/([^/]+)/);
      if (idMatch) targetUrl = `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
    }

    const upstream = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!upstream.ok) {
      return NextResponse.json({ error: `Upstream returned ${upstream.status}` }, { status: 502 });
    }
    const buffer = Buffer.from(await upstream.arrayBuffer());

    const disposition = download
      ? `attachment; filename="${filename}"`
      : `inline; filename="${filename}"`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': disposition,
        'Cache-Control':       'private, max-age=3600',
      },
    });
  } catch (err: any) {
    console.error('[pdf-proxy]', err);
    return NextResponse.json({ error: 'Proxy failed' }, { status: 500 });
  }
}
