/**
 * lib/cloudinary-url.ts
 *
 * Cloudinary URL helpers for previewing, viewing, and downloading files.
 *
 * Works with:
 *  - Cloudinary image/video/raw URLs (res.cloudinary.com)
 *  - Legacy Google Drive URLs (for backward compatibility with old DB records)
 */

export type MediaType = 'image' | 'video' | 'pdf';

// ─── Type detection ───────────────────────────────────────────────────────────

export function isCloudinaryUrl(url: string): boolean {
  return !!url && url.includes('res.cloudinary.com');
}

export function isDriveUrl(url: string): boolean {
  return !!url && (
    url.includes('drive.google.com') ||
    url.includes('lh3.googleusercontent.com')
  );
}

export function isCloudinaryRaw(url: string): boolean {
  return isCloudinaryUrl(url) && url.includes('/raw/upload/');
}

export function isCloudinaryVideo(url: string): boolean {
  return isCloudinaryUrl(url) && url.includes('/video/upload/');
}

// ─── Preview URL (view inline in browser) ────────────────────────────────────

/**
 * Returns a URL that opens the file inline for viewing.
 * - Cloudinary image → direct URL
 * - Cloudinary video → direct URL (use in <video> or iframe embed)
 * - Cloudinary PDF (raw) → /api/pdf-proxy for inline rendering
 * - Legacy Drive → embed /preview URL
 */
export function previewUrl(url: string): string {
  if (!url) return url;

  // Cloudinary
  if (isCloudinaryUrl(url)) {
    const clean = url.replace(/\/(fl_attachment(:[^/]+)?|fl_inline)\//g, '');
    // Raw PDF → proxy for inline
    if (clean.includes('/raw/upload/')) {
      return `/api/pdf-proxy?${new URLSearchParams({ url: clean })}`;
    }
    // Image PDF → inline
    if (clean.includes('/image/upload/') && /\.pdf($|\?)/i.test(clean)) {
      return clean.replace('/image/upload/', '/image/upload/fl_inline/');
    }
    return clean;
  }

  // Legacy Drive: /view → /preview
  if (isDriveUrl(url)) {
    return url.replace(/\/view(\?.*)?$/, '/preview');
  }

  return url;
}

// ─── Download URL (force download) ───────────────────────────────────────────

/**
 * Returns a URL that forces a file download in the browser.
 * - Cloudinary images/videos → fl_attachment transformation
 * - Cloudinary raw (PDF) → proxy with download=1
 * - Legacy Drive → export=download
 */
export function downloadUrl(url: string, filename?: string): string {
  if (!url) return url;

  // Cloudinary
  if (isCloudinaryUrl(url)) {
    const clean = url.replace(/\/(fl_attachment(:[^/]+)?|fl_inline)\//g, '');
    const safeName = filename?.replace(/[^a-zA-Z0-9._-]/g, '_') ?? null;
    const flag = safeName ? `fl_attachment:${safeName}` : 'fl_attachment';

    if (clean.includes('/image/upload/'))  return clean.replace('/image/upload/',  `/image/upload/${flag}/`);
    if (clean.includes('/video/upload/'))  return clean.replace('/video/upload/',  `/video/upload/${flag}/`);
    if (clean.includes('/raw/upload/')) {
      const p = new URLSearchParams({ url: clean, download: '1' });
      if (safeName) p.set('filename', safeName);
      return `/api/pdf-proxy?${p}`;
    }
    if (clean.includes('/upload/')) return clean.replace('/upload/', `/upload/${flag}/`);
    return clean;
  }

  // Legacy Drive
  if (isDriveUrl(url)) {
    if (url.includes('export=download')) return url;
    const idMatch = url.match(/\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/);
    if (idMatch) {
      const params = new URLSearchParams({ export: 'download', id: idMatch[1] });
      if (filename) params.set('name', filename);
      return `https://drive.google.com/uc?${params}`;
    }
    return url;
  }

  return url;
}

// ─── Thumbnail URL ────────────────────────────────────────────────────────────

/**
 * Returns a thumbnail-sized URL for any media:
 * - Cloudinary images/videos → c_fill,w_400,h_300 transformation
 * - Cloudinary raw (PDF) → placeholder
 * - Legacy Drive → lh3 CDN at 400px
 */
export function toThumbnailUrl(url: string, mediaType: MediaType = 'image'): string {
  if (!url) return PLACEHOLDER_SVG[mediaType];

  if (isCloudinaryUrl(url)) {
    if (mediaType === 'pdf' || url.includes('/raw/upload/')) {
      return PLACEHOLDER_SVG.pdf;
    }
    const type = url.includes('/video/upload/') ? 'video' : 'image';
    const transformation = 'c_fill,w_400,h_300,q_auto,f_auto';
    return url.replace(`/${type}/upload/`, `/${type}/upload/${transformation}/`);
  }

  // Legacy Drive
  if (isDriveUrl(url)) {
    const idMatch = url.match(/\/d\/([^/?#]+)/) || url.match(/[?&]id=([^&]+)/);
    if (idMatch) return `https://lh3.googleusercontent.com/d/${idMatch[1]}=w400`;
  }

  return PLACEHOLDER_SVG[mediaType];
}

// ─── Image URL ────────────────────────────────────────────────────────────────

/**
 * Returns a full-size image URL with quality/format optimisation.
 * For legacy Drive URLs, uses lh3 CDN.
 */
export function toImageUrl(url: string, widthPx = 1600): string {
  if (!url) return url;

  if (isCloudinaryUrl(url) && url.includes('/image/upload/')) {
    return url.replace('/image/upload/', `/image/upload/w_${widthPx},q_auto,f_auto/`);
  }

  // Legacy Drive
  if (isDriveUrl(url)) {
    const idMatch = url.match(/\/d\/([^/?#]+)/) || url.match(/[?&]id=([^&]+)/);
    if (idMatch) return `https://lh3.googleusercontent.com/d/${idMatch[1]}=w${widthPx}`;
  }

  return url;
}

// ─── Video / Preview embed URL ────────────────────────────────────────────────

/**
 * Returns a URL for embedding video in an <iframe> or <video> src.
 * Cloudinary videos → direct URL (use in <video> tag).
 * Legacy Drive → /preview embed URL.
 */
export function toVideoUrl(url: string): string {
  if (!url) return url;
  if (isCloudinaryUrl(url)) return url;
  // Legacy Drive
  return toPreviewUrl(url);
}

/**
 * Returns an embed/preview URL for iframes (video + PDF).
 * Cloudinary raw PDF → proxy.
 * Legacy Drive → /preview.
 */
export function toPreviewUrl(url: string): string {
  return previewUrl(url);
}

/**
 * Autoplay embed URL for videos.
 * Cloudinary: add autoplay=1 query param (works with <video autoplay>).
 */
export function toAutoplayUrl(url: string): string {
  if (!url) return url;
  if (isCloudinaryUrl(url)) return url; // use autoplay attr on <video> element
  // Legacy Drive
  const idMatch = url.match(/\/d\/([^/?#]+)/) || url.match(/[?&]id=([^&]+)/);
  if (idMatch) return `https://drive.google.com/file/d/${idMatch[1]}/preview?autoplay=1`;
  return url;
}

/**
 * Returns download URL — alias for downloadUrl for backward compat.
 */
export function toDownloadUrl(url: string, filename?: string): string {
  return downloadUrl(url, filename);
}

// ─── Guess media type ─────────────────────────────────────────────────────────

export function guessMediaType(urlOrMime = ''): MediaType {
  const s = urlOrMime.toLowerCase();
  if (
    s.startsWith('video/') ||
    /\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/.test(s) ||
    s.includes('/video/upload/')
  ) return 'video';
  if (
    s === 'application/pdf' ||
    /\.pdf(\?|$)/.test(s) ||
    s.includes('/raw/upload/')
  ) return 'pdf';
  return 'image';
}

// ─── MediaItem ────────────────────────────────────────────────────────────────

export interface MediaItem {
  url:           string;
  mediaType:     MediaType;
  caption?:      string;
  sortOrder?:    number;
  /** Cloudinary public_id — stored for deletion/transformation */
  publicId?:     string;
}

export function makeMediaItem(
  url: string,
  mediaType: MediaType,
  opts: { caption?: string; sortOrder?: number; publicId?: string } = {}
): MediaItem {
  return {
    url,
    mediaType,
    caption:   opts.caption,
    sortOrder: opts.sortOrder ?? 0,
    publicId:  opts.publicId,
  };
}

export function stringsToMediaItems(
  urls: string[],
  typeOverrides: Record<string, MediaType> = {}
): MediaItem[] {
  return urls.map((url, i) => ({
    url,
    mediaType: typeOverrides[url] ?? guessMediaType(url),
    sortOrder: i,
  }));
}

export function renderSrc(item: MediaItem, imageWidth = 1600): string {
  switch (item.mediaType) {
    case 'video': return toVideoUrl(item.url);
    case 'pdf':   return toPreviewUrl(item.url);
    default:      return toImageUrl(item.url, imageWidth);
  }
}

export function thumbnailSrc(item: MediaItem): string {
  return toThumbnailUrl(item.url, item.mediaType);
}

// ─── Backward-compat aliases ──────────────────────────────────────────────────
export const cloudinaryPreviewUrl  = previewUrl;
export const cloudinaryDownloadUrl = downloadUrl;

/**
 * toDirectImageUrl — returns a displayable image URL for any source:
 * Cloudinary images get q_auto,f_auto optimisation.
 * Legacy Drive URLs get the lh3 CDN format.
 * Falls back to the raw URL if neither.
 *
 * Alias of toImageUrl for backward compatibility.
 */
export function toDirectImageUrl(url: string, widthPx = 800): string {
  return toImageUrl(url, widthPx);
}

// ─── Placeholders ─────────────────────────────────────────────────────────────
const PLACEHOLDER_SVG: Record<MediaType, string> = {
  image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%2327272a' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' fill='%2352525b' font-size='40' text-anchor='middle' dominant-baseline='middle'%3E%F0%9F%96%BC%EF%B8%8F%3C/text%3E%3C/svg%3E",
  video: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%2318181b' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' fill='%2352525b' font-size='40' text-anchor='middle' dominant-baseline='middle'%3E%E2%96%B6%EF%B8%8F%3C/text%3E%3C/svg%3E",
  pdf:   "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%231c1917' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' fill='%2352525b' font-size='40' text-anchor='middle' dominant-baseline='middle'%3E%F0%9F%93%84%3C/text%3E%3C/svg%3E",
};