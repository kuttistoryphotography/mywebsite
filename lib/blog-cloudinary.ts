
import { v2 as cloudinary } from "cloudinary";
import type { CloudinaryUploadResult } from "@/lib/cloudinary";

const cloudName = process.env.BLOG_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.BLOG_CLOUDINARY_API_KEY;
const apiSecret = process.env.BLOG_CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error(
    "[BLOG CLOUDINARY CONFIG] Missing BLOG_CLOUDINARY_CLOUD_NAME, BLOG_CLOUDINARY_API_KEY, or BLOG_CLOUDINARY_API_SECRET"
  );
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

function getResourceType(
  mimeType: string
): "image" | "video" | "raw" {
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("image/")) return "image";
  return "raw";
}

export async function uploadToBlogCloudinary(
  buffer: Buffer,
  options: {
    fileName: string;
    mimeType: string;
    context: "blog";
  }
): Promise<CloudinaryUploadResult> {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Blog Cloudinary environment variables are missing."
    );
  }

  const resourceType = getResourceType(options.mimeType);

  const ext =
    options.fileName.split(".").pop()?.toLowerCase() || "";

  const baseName = options.fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .substring(0, 80);

  const publicId = `${Date.now()}_${baseName}`;

  const folder = "blog";

  const uploadOptions: Record<string, unknown> = {
    folder,
    public_id: publicId,
    resource_type: resourceType,
    overwrite: false,
    access_mode: "public",
  };

  if (resourceType === "raw" && ext) {
    uploadOptions.format = ext;
  }

  console.log("[BLOG CLOUDINARY UPLOAD]", {
    fileName: options.fileName,
    mimeType: options.mimeType,
    resourceType,
    folder,
    size: buffer.length,
  });

  const result = await new Promise<any>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error("[BLOG CLOUDINARY ERROR]", error);
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
      "Blog Cloudinary upload completed without a secure URL."
    );
  }

  const downloadUrl =
    resourceType === "image" || resourceType === "video"
      ? result.secure_url.replace(
          "/upload/",
          "/upload/fl_attachment/"
        )
      : result.secure_url;

  console.log("[BLOG CLOUDINARY SUCCESS]", {
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

export async function deleteFromBlogCloudinary(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image"
): Promise<void> {
  if (!publicId) return;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Blog Cloudinary environment variables are missing."
    );
  }

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
  } catch (error: any) {
    if (!error?.message?.includes("not found")) {
      throw error;
    }
  }
}
