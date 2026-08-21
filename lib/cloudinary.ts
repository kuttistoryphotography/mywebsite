import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error(
    "[CLOUDINARY CONFIG] Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET"
  );
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export type UploadContext =
  | "portfolio"
  | "album"
  | "profile"
  | "quote_pdf"
  | "document"
  | "blog"
  | "fm"
  | "general";

function getFolder(context: UploadContext): string {
  const map: Record<UploadContext, string> = {
    portfolio: "portfolio",
    album: "albums",
    profile: "profiles",
    quote_pdf: "quote-pdfs",
    document: "documents",
    blog: "blog",
    fm: "file-manager",
    general: "general",
  };

  return map[context] || "general";
}

function getResourceType(
  mimeType: string
): "image" | "video" | "raw" {
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("image/")) return "image";
  return "raw";
}

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  downloadUrl: string;
  resourceType: "image" | "video" | "raw";
  format: string;
  mimeType: string;
  fileSizeBytes: number;
  width?: number;
  height?: number;
  duration?: number;
  folderName: string;
  originalName: string;
}

export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    fileName: string;
    mimeType: string;
    context: UploadContext;
  }
): Promise<CloudinaryUploadResult> {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary environment variables are missing. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET."
    );
  }

  const resourceType = getResourceType(options.mimeType);
  const folder = getFolder(options.context);

  const ext =
    options.fileName.split(".").pop()?.toLowerCase() || "";

  const baseName = options.fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .substring(0, 80);

  const publicIdBase = `${Date.now()}_${baseName}`;

  console.log("[CLOUDINARY UPLOAD]", {
    fileName: options.fileName,
    mimeType: options.mimeType,
    context: options.context,
    folder,
    resourceType,
    size: buffer.length,
  });

  const uploadOptions: any = {
    folder,
    public_id: publicIdBase,
    resource_type: resourceType,
    overwrite: false,
    access_mode: "public",
  };

  if (resourceType === "raw" && ext) {
    uploadOptions.format = ext;
  }

  const result = await new Promise<any>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error("[CLOUDINARY ERROR]", error);
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });

  if (!result?.secure_url) {
    throw new Error(
      "Cloudinary upload completed but no secure URL was returned"
    );
  }

  const downloadUrl =
    resourceType === "image" || resourceType === "video"
      ? result.secure_url.replace(
          "/upload/",
          "/upload/fl_attachment/"
        )
      : result.secure_url;

  console.log("[CLOUDINARY SUCCESS]", {
    publicId: result.public_id,
    url: result.secure_url,
  });

  return {
    publicId: result.public_id,
    url: result.secure_url,
    downloadUrl,
    resourceType,
    format: result.format || ext,
    mimeType: options.mimeType,
    fileSizeBytes: result.bytes || buffer.length,
    width: result.width,
    height: result.height,
    duration: result.duration,
    folderName: folder,
    originalName: options.fileName,
  };
}

export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image"
): Promise<void> {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
  } catch (err: any) {
    if (!err?.message?.includes("not found")) {
      throw err;
    }
  }
}

export function contextFromString(s?: string): UploadContext {
  const map: Record<string, UploadContext> = {
    portfolio: "portfolio",
    album: "album",
    profile: "profile",
    quote: "quote_pdf",
    quote_pdf: "quote_pdf",
    document: "document",
    blog: "blog",
    fm: "fm",
  };

  return map[s || ""] || "general";
}

export function guessMimeType(
  filename: string,
  declared?: string
): string {
  if (
    declared &&
    declared !== "application/octet-stream"
  ) {
    return declared;
  }

  const ext =
    filename.split(".").pop()?.toLowerCase() || "";

  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
    avif: "image/avif",

    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    m4v: "video/mp4",
    flv: "video/x-flv",
    wmv: "video/x-ms-wmv",

    pdf: "application/pdf",
    doc: "application/msword",
    docx:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };

  return map[ext] || "application/octet-stream";
}

export { cloudinary };