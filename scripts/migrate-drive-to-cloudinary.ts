#!/usr/bin/env ts-node
/**
 * scripts/migrate-drive-to-cloudinary.ts
 *
 * ONE-TIME migration: finds existing MongoDB records that still reference
 * Google Drive URLs and re-uploads the files to Cloudinary, then updates
 * the DB records in-place.
 *
 * Supported models:
 *   - FileDoc         (file-manager files)
 *   - PhotographyCategory.pdfs
 *   - QuotePdf
 *   - DriveFile (legacy)
 *
 * Usage:
 *   npx ts-node -P tsconfig.json scripts/migrate-drive-to-cloudinary.ts
 *
 * Env vars required (same as .env.local):
 *   MONGODB_URI
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *
 * The script is safe to re-run — it skips records that already have
 * a cloudinaryPublicId or a res.cloudinary.com URL.
 */

import mongoose from 'mongoose';
import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure:     true,
});

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error('MONGODB_URI is not set');

// ─── helpers ──────────────────────────────────────────────────────────────────

function isDriveUrl(url: string) {
  return url && (url.includes('drive.google.com') || url.includes('lh3.googleusercontent.com'));
}
function isCloudinaryUrl(url: string) {
  return url && url.includes('res.cloudinary.com');
}

async function fetchBuffer(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const mime = res.headers.get('content-type')?.split(';')[0] || 'application/octet-stream';
  return { buffer: Buffer.from(await res.arrayBuffer()), mimeType: mime };
}

function toDirectDriveDownload(viewUrl: string): string {
  const id = viewUrl.match(/\/d\/([^/?#]+)/)?.[1] || viewUrl.match(/[?&]id=([^&]+)/)?.[1];
  if (!id) throw new Error(`Could not extract Drive file ID from: ${viewUrl}`);
  return `https://drive.google.com/uc?export=download&id=${id}`;
}

function guessResourceType(mime: string): 'image' | 'video' | 'raw' {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  return 'raw';
}

async function uploadBufferToCloudinary(
  buffer: Buffer,
  mimeType: string,
  folder: string,
  fileName: string
): Promise<{ publicId: string; url: string; downloadUrl: string; resourceType: 'image'|'video'|'raw' }> {
  const resourceType = guessResourceType(mimeType);
  const baseName = fileName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 80);

  const result: any = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id: `${Date.now()}_${baseName}`, resource_type: resourceType, access_mode: 'public' },
      (err, r) => (err ? reject(err) : resolve(r))
    );
    stream.end(buffer);
  });

  let downloadUrl: string;
  if (resourceType === 'image') downloadUrl = result.secure_url.replace('/upload/', '/upload/fl_attachment/');
  else if (resourceType === 'video') downloadUrl = result.secure_url.replace('/upload/', '/upload/fl_attachment/');
  else downloadUrl = result.secure_url;

  return { publicId: result.public_id, url: result.secure_url, downloadUrl, resourceType };
}

// ─── migration runners ────────────────────────────────────────────────────────

async function migrateFileDocs() {
  const db = mongoose.connection.db!;
  const col = db.collection('filedocs');
  const docs = await col.find({
    $or: [
      { driveUrl: { $regex: 'drive.google.com' } },
      { driveWebViewLink: { $regex: 'drive.google.com' } },
    ],
    cloudinaryPublicId: { $exists: false },
  }).toArray();

  console.log(`\nFileDoc: ${docs.length} records to migrate`);

  let ok = 0, fail = 0;
  for (const doc of docs) {
    const viewUrl = doc.driveWebViewLink || doc.driveUrl;
    try {
      const dlUrl = toDirectDriveDownload(viewUrl);
      const { buffer, mimeType } = await fetchBuffer(dlUrl);
      const r = await uploadBufferToCloudinary(buffer, mimeType, 'file-manager', doc.originalName || doc.fileName || 'file');
      await col.updateOne({ _id: doc._id }, {
        $set: {
          cloudinaryPublicId:    r.publicId,
          cloudinaryUrl:         r.url,
          cloudinaryDownloadUrl: r.downloadUrl,
          resourceType:          r.resourceType,
        }
      });
      ok++;
      console.log(`  ✓ FileDoc ${doc._id} → ${r.url}`);
    } catch (e: any) {
      fail++;
      console.error(`  ✗ FileDoc ${doc._id}: ${e.message}`);
    }
  }
  console.log(`FileDoc done: ${ok} ok, ${fail} failed`);
}

async function migrateQuotePdfs() {
  const db = mongoose.connection.db!;
  const col = db.collection('quotepdfs');
  const docs = await col.find({
    $or: [
      { driveFileId: { $exists: true, $ne: '' } },
      { driveWebViewLink: { $regex: 'drive.google.com' } },
    ],
    publicId: { $exists: false },
  }).toArray();

  console.log(`\nQuotePdf: ${docs.length} records to migrate`);

  let ok = 0, fail = 0;
  for (const doc of docs) {
    const viewUrl = doc.driveWebViewLink;
    if (!viewUrl || !isDriveUrl(viewUrl)) { console.log(`  skip ${doc._id}: no valid Drive URL`); continue; }
    try {
      const dlUrl = toDirectDriveDownload(viewUrl);
      const { buffer, mimeType } = await fetchBuffer(dlUrl);
      const r = await uploadBufferToCloudinary(buffer, 'application/pdf', 'quote-pdfs', doc.fileName || 'quote.pdf');
      await col.updateOne({ _id: doc._id }, {
        $set: { publicId: r.publicId, url: r.url, downloadUrl: r.downloadUrl }
      });
      ok++;
      console.log(`  ✓ QuotePdf ${doc._id} → ${r.url}`);
    } catch (e: any) {
      fail++;
      console.error(`  ✗ QuotePdf ${doc._id}: ${e.message}`);
    }
  }
  console.log(`QuotePdf done: ${ok} ok, ${fail} failed`);
}

async function migratePhotographyCategoryPdfs() {
  const db = mongoose.connection.db!;
  const col = db.collection('photographycategories');
  const docs = await col.find({ 'pdfs.0': { $exists: true } }).toArray();

  console.log(`\nPhotographyCategory PDFs: checking ${docs.length} categories`);
  let ok = 0, fail = 0;

  for (const cat of docs) {
    let modified = false;
    const updatedPdfs = await Promise.all((cat.pdfs || []).map(async (pdf: any) => {
      if (pdf.publicId || isCloudinaryUrl(pdf.url || '')) return pdf;
      const viewUrl = pdf.driveWebViewLink;
      if (!viewUrl || !isDriveUrl(viewUrl)) return pdf;
      try {
        const dlUrl = toDirectDriveDownload(viewUrl);
        const { buffer } = await fetchBuffer(dlUrl);
        const r = await uploadBufferToCloudinary(buffer, 'application/pdf', 'quote-pdfs', pdf.fileName || pdf.label || 'pdf');
        modified = true; ok++;
        console.log(`  ✓ Cat ${cat._id} pdf ${pdf._id} → ${r.url}`);
        return { ...pdf, publicId: r.publicId, url: r.url, downloadUrl: r.downloadUrl };
      } catch (e: any) {
        fail++;
        console.error(`  ✗ Cat ${cat._id} pdf ${pdf._id}: ${e.message}`);
        return pdf;
      }
    }));
    if (modified) await col.updateOne({ _id: cat._id }, { $set: { pdfs: updatedPdfs } });
  }
  console.log(`PhotographyCategory PDFs done: ${ok} ok, ${fail} failed`);
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Connecting to MongoDB…');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.\n');
  console.log('=== Google Drive → Cloudinary Migration ===');

  await migrateFileDocs();
  await migrateQuotePdfs();
  await migratePhotographyCategoryPdfs();

  console.log('\n=== Migration complete ===');
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
