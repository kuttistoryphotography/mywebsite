/**
 * lib/google-drive.ts
 *
 * @deprecated Google Drive has been fully replaced by Cloudinary.
 * This file is kept as a stub to prevent build errors from any imports
 * that were not caught during migration.
 *
 * All functions throw an error if called — they should not be.
 */

export type UploadContext =
  | 'portfolio' | 'album' | 'profile' | 'quote_pdf'
  | 'document'  | 'blog'  | 'fm'      | 'general';

export function contextFromString(s?: string): UploadContext {
  const map: Record<string, UploadContext> = {
    portfolio: 'portfolio', album: 'album', profile: 'profile',
    quote: 'quote_pdf', quote_pdf: 'quote_pdf', document: 'document',
    blog: 'blog', fm: 'fm',
  };
  return map[s || ''] || 'general';
}

export function guessMimeType(filename: string, declared?: string): string {
  if (declared && declared !== 'application/octet-stream') return declared;
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml',
    mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
    pdf: 'application/pdf', doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return map[ext] || 'application/octet-stream';
}

const REMOVED_MSG = 'Google Drive has been removed. Use lib/cloudinary.ts instead.';

export async function uploadToDrive(): Promise<never> { throw new Error(REMOVED_MSG); }
export async function deleteFromDrive(): Promise<void> { console.warn(REMOVED_MSG); }
export async function downloadFromDrive(): Promise<never> { throw new Error(REMOVED_MSG); }
export async function getDriveFileMeta(): Promise<never> { throw new Error(REMOVED_MSG); }
export async function createDriveFolder(): Promise<never> { throw new Error(REMOVED_MSG); }
export function getAuthUrl(): string { throw new Error(REMOVED_MSG); }
export async function exchangeCodeForTokens(): Promise<never> { throw new Error(REMOVED_MSG); }
export async function isDriveAuthorised(): Promise<boolean> { return false; }
export function createOAuthClient(): never { throw new Error(REMOVED_MSG); }
