// lib/blog-cloudinary.ts

import crypto from "crypto";
import type { CloudinaryUploadResult } from "@/lib/cloudinary";

const cloudName = process.env.BLOG_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.BLOG_CLOUDINARY_API_KEY;
const apiSecret = process.env.BLOG_CLOUDINARY_API_SECRET;

function validateBlogCloudinaryConfig() {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Missing BLOG_CLOUDINARY_CLOUD_NAME, BLOG_CLOUDINARY_API_KEY, or BLOG_CLOUDINARY_API_SECRET."
    );
  }
}

function getResourceType(
  mimeType: string
): "image" | "video" | "raw" {
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("image/")) return "image";
  return "raw";
}

/**
 * Cloudinary signature:
 * Sort parameters alphabetically, join as key=value,
 * append API secret, then SHA-1 hash.
 */
function generateSignature(
  params: Record<string, string | number | boolean>
): string {
  validateBlogCloudinaryConfig();

  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(sortedParams + apiSecret)
    .digest("hex");
}

/**
 * Upload directly to the Blog Cloudinary account.
 * Does not use or modify the shared Cloudinary SDK configuration.
 */
export async function uploadToBlogCloudinary(
  buffer: Buffer,
  options: {
    fileName: string;
    mimeType: string;
    context: "blog";
  }
): Promise<CloudinaryUploadResult> {
  validateBlogCloudinaryConfig();

  const resourceType = getResourceType(options.mimeType);
  const timestamp = Math.floor(Date.now() / 1000);

  const ext = options.fileName.split(".").pop()?.toLowerCase() || "";

  const baseName = options.fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .substring(0, 80);

  const publicId = `${Date.now()}_${baseName}`;
  const folder = "blog";

  const signedParams: Record<string, string | number | boolean> = {
    timestamp,
    folder,
    public_id: publicId,
    overwrite: false,
    access_mode: "public",
  };

  const signature = generateSignature(signedParams);

  const formData = new FormData();

  formData.append("file", new Blob([new Uint8Array(buffer)], {
    type: options.mimeType,
  }));

  formData.append("api_key", apiKey!);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);
  formData.append("public_id", publicId);
  formData.append("overwrite", "false");
  formData.append("access_mode", "public");

  if (resourceType === "raw" && ext) {
    formData.append("format", ext);
  }

  const uploadUrl =
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  console.log("[BLOG CLOUDINARY UPLOAD]", {
    cloudName,
    fileName: options.fileName,
    resourceType,
    folder,
    size: buffer.length,
  });

  const response = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("[BLOG CLOUDINARY ERROR]", result);

    throw new Error(
      result?.error?.message || "Blog Cloudinary upload failed."
    );
  }

  if (!result?.secure_url) {
    throw new Error("Cloudinary returned no secure URL.");
  }

  const downloadUrl =
    resourceType === "image" || resourceType === "video"
      ? result.secure_url.replace(
          "/upload/",
          "/upload/fl_attachment/"
        )
      : result.secure_url;

  console.log("[BLOG CLOUDINARY SUCCESS]", {
    cloudName,
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

/**
 * Delete directly from the Blog Cloudinary account.
 */
export async function deleteFromBlogCloudinary(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image"
): Promise<void> {
  if (!publicId) return;

  validateBlogCloudinaryConfig();

  const timestamp = Math.floor(Date.now() / 1000);

  const signedParams = {
    timestamp,
    public_id: publicId,
    invalidate: true,
  };

  const signature = generateSignature(signedParams);

  const formData = new FormData();

  formData.append("public_id", publicId);
  formData.append("timestamp", String(timestamp));
  formData.append("api_key", apiKey!);
  formData.append("signature", signature);
  formData.append("invalidate", "true");

  const deleteUrl =
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`;

  const response = await fetch(deleteUrl, {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("[BLOG CLOUDINARY DELETE ERROR]", result);

    throw new Error(
      result?.error?.message || "Blog Cloudinary deletion failed."
    );
  }

  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(
      `Cloudinary delete returned: ${result.result}`
    );
  }

  console.log("[BLOG CLOUDINARY DELETE]", {
    cloudName,
    publicId,
    result: result.result,
  });
}