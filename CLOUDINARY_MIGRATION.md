# Google Drive → Cloudinary Migration Guide

This document explains every change made and what you need to do to complete the integration.

---

## What Changed

### New Files
| File | Purpose |
|------|---------|
| `lib/cloudinary.ts` | Server-side upload helper — all uploads go through here |
| `lib/cloudinary-url.ts` | URL helpers for previewing, viewing, and downloading |
| `models/CloudinaryFile.ts` | MongoDB model — stores metadata for every uploaded file |
| `app/api/cloudinary-files/route.ts` | List / delete Cloudinary files (replaces drive-files) |
| `scripts/migrate-drive-to-cloudinary.ts` | One-time migration of existing Drive files |

### Replaced / Updated Files
| File | Change |
|------|--------|
| `lib/google-drive.ts` | Stubbed out — throws if called |
| `lib/drive-url.ts` | Re-exports `lib/cloudinary-url.ts` |
| `lib/media.ts` | Re-exports `lib/cloudinary-url.ts` |
| `models/DriveFile.ts` | Re-exports `CloudinaryFile`; keeps legacy schema readable |
| `models/FileManager.ts` | Added Cloudinary fields; legacy Drive fields kept for DB compat |
| `app/api/upload/route.ts` | Fully rewritten — Cloudinary only |
| `app/api/upload-pdf/route.ts` | Fully rewritten — Cloudinary only |
| `app/api/pdf-proxy/route.ts` | Streams PDFs from Cloudinary raw URLs |
| `app/api/file-manager/upload/route.ts` | Uploads to Cloudinary |
| `app/api/file-manager/files/route.ts` | Returns Cloudinary view + download URLs |
| `app/api/file-manager/client/files/route.ts` | Returns Cloudinary URLs to client |
| `app/api/file-manager/client/download/route.ts` | Redirects to Cloudinary download URL |
| `app/api/file-manager/cleanup/route.ts` | Deletes from Cloudinary + MongoDB |
| `app/api/blog/upload/route.ts` | Uploads blog media to Cloudinary |
| `app/api/quote-pdfs/route.ts` | Uploads quote PDFs to Cloudinary |
| `app/api/photography-categories/[id]/pdfs/route.ts` | Uploads category PDFs to Cloudinary |
| `app/api/auth/google-drive-callback/route.ts` | Returns 410 Gone |
| `components/ui/DriveMedia.tsx` | Uses `<video>` for Cloudinary videos; iframe for legacy |
| `components/admin/sections/albums-section.tsx` | Renamed `uploadToDrive` → `uploadToCloudinary` |
| `components/dashboard/files-section.tsx` | Uses Cloudinary URLs for view/download |
| `app/portfolio/[id]/PortfolioDetailClient.tsx` | Cloudinary-aware video embed |

---

## Setup

### 1. Add environment variables to `.env.local`

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Get these from [Cloudinary Console](https://console.cloudinary.com) → Settings → API Keys.

### 2. Install dependencies

```bash
npm install
```

`googleapis` has been removed. `cloudinary` is already in `package.json`.

### 3. Cloudinary upload preset (optional but recommended)

In Cloudinary Console → Settings → Upload:
- Create an **unsigned upload preset** named `platform_unsigned` for any client-side uploads you want.
- For server-side (all routes in this project), **no preset is needed** — everything uses signed API uploads.

### 4. Migrate existing Google Drive files (one-time)

If you have existing records in MongoDB that still point to Google Drive, run:

```bash
npx ts-node -P tsconfig.json scripts/migrate-drive-to-cloudinary.ts
```

This script:
- Finds `FileDoc`, `QuotePdf`, and `PhotographyCategory.pdfs` records with Drive URLs
- Downloads each file from Drive and re-uploads to Cloudinary
- Updates the MongoDB record with the new Cloudinary `publicId`, `url`, and `downloadUrl`
- Is safe to re-run (skips already-migrated records)

---

## How It Works

### Upload flow (new)
```
Client → POST /api/upload (multipart)
  → lib/cloudinary.ts uploadToCloudinary()
  → Cloudinary CDN
  → returns { url, downloadUrl, publicId }
  → optionally saves CloudinaryFile record to MongoDB
```

### View / Preview
- **Images**: direct Cloudinary CDN URL with `q_auto,f_auto` optimisation
- **Videos**: native `<video src={cloudinaryUrl}>` (no iframe needed)
- **PDFs**: `/api/pdf-proxy?url=<encoded>` → streams with `Content-Type: application/pdf`

### Download
- **Images/Videos**: Cloudinary URL with `fl_attachment` transformation
- **PDFs**: `/api/pdf-proxy?url=<encoded>&download=1` → streams with `Content-Disposition: attachment`

### Backward Compatibility
- Legacy Drive URLs in MongoDB still work — `DriveMedia`, `previewUrl()`, `downloadUrl()` all handle both URL formats
- `lib/drive-url.ts` re-exports everything from `lib/cloudinary-url.ts`
- `models/DriveFile.ts` re-exports `CloudinaryFile`

---

## Key Functions

```ts
// Upload (server-side only)
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';

const result = await uploadToCloudinary(buffer, {
  fileName: 'photo.jpg',
  mimeType: 'image/jpeg',
  context:  'album',   // → uploaded to /albums/ folder on Cloudinary
});
// result.url         → https://res.cloudinary.com/...
// result.downloadUrl → https://res.cloudinary.com/.../fl_attachment/...
// result.publicId    → albums/1234567890_photo

// URL helpers (server + client)
import { previewUrl, downloadUrl, toThumbnailUrl } from '@/lib/cloudinary-url';

previewUrl(url)              // inline viewing URL
downloadUrl(url, 'file.pdf') // forced download URL
toThumbnailUrl(url, 'video') // 400×300 thumbnail

// Component
import { DriveMedia, DriveThumbnail, DriveLightbox } from '@/components/ui/DriveMedia';

<DriveMedia url={url} mediaType="image" className="w-full" />
<DriveMedia url={url} mediaType="video" controls autoPlay muted />
<DriveMedia url={url} mediaType="pdf" className="w-full h-screen" />
```

---

## Cloudinary Folder Structure

| Context | Cloudinary Folder |
|---------|------------------|
| `portfolio` | `/portfolio` |
| `album` | `/albums` |
| `profile` | `/profiles` |
| `quote_pdf` | `/quote-pdfs` |
| `document` | `/documents` |
| `blog` | `/blog` |
| `fm` (file manager) | `/file-manager` |
| `general` | `/general` |

---

## Removing googleapis from the project

`googleapis` has been removed from `package.json`. After running `npm install`, it will no longer be present in `node_modules`. The stub at `lib/google-drive.ts` will log a warning (not throw) if any legacy code accidentally calls `deleteFromDrive`, to prevent crashes during the transition period.
