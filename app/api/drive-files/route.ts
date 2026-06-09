/**
 * app/api/drive-files/route.ts
 *
 * @deprecated Kept for URL backward compatibility.
 * Now proxies to /api/cloudinary-files logic.
 *
 * List Cloudinary files stored in MongoDB.
 */
export { GET, DELETE } from '@/app/api/cloudinary-files/route';
