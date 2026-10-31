
import { createHash } from "node:crypto";

const cloudName = process.env.PHOTO_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.PHOTO_CLOUDINARY_API_KEY;
const apiSecret = process.env.PHOTO_CLOUDINARY_API_SECRET;

function getConfig() {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Photo Cloudinary configuration is missing. Check PHOTO_CLOUDINARY_CLOUD_NAME, PHOTO_CLOUDINARY_API_KEY and PHOTO_CLOUDINARY_API_SECRET."
    );
  }

  return { cloudName, apiKey, apiSecret };
}

function makeSignature(
  params: Record<string, string>,
  secret: string
) {
  const stringToSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("sha1")
    .update(stringToSign + secret)
    .digest("hex");
}

function getResourceType(
  mimeType: string
): "image" | "video" | "raw" {
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("image/")) return "image";
  return "raw";
}

export interface PhotoCloudinaryUploadResult {
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

export async function uploadToPhotoCloudinary(
  buffer: Buffer,
  options: {
    fileName: string;
    mimeType: string;
    context?: string;
  }
): Promise<PhotoCloudinaryUploadResult> {
  const config = getConfig();

  const resourceType = getResourceType(options.mimeType);
  const folder = "photo-selection";

  const ext =
    options.fileName.split(".").pop()?.toLowerCase() || "";

  const baseName = options.fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .substring(0, 80);

  const publicId = `${Date.now()}_${baseName}`;
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const signedParams: Record<string, string> = {
    access_mode: "public",
    folder,
    overwrite: "false",
    public_id: publicId,
    timestamp,
  };

  if (resourceType === "raw" && ext) {
    signedParams.format = ext;
  }

  const signature = makeSignature(
    signedParams,
    config.apiSecret
  );

  const formData = new FormData();

  formData.append(
    "file",
    new Blob([new Uint8Array(buffer)], {
      type: options.mimeType,
    }),
    options.fileName
  );

  formData.append("api_key", config.apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);

  for (const [key, value] of Object.entries(signedParams)) {
    formData.append(key, value);
  }

  const endpoint =
    `https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/upload`;

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("[PHOTO CLOUDINARY UPLOAD ERROR]", result);

    throw new Error(
      result?.error?.message || "Photo Cloudinary upload failed"
    );
  }

  if (!result?.secure_url) {
    throw new Error(
      "Photo Cloudinary upload returned no secure URL"
    );
  }

  const downloadUrl =
    resourceType === "image" || resourceType === "video"
      ? result.secure_url.replace(
          "/upload/",
          "/upload/fl_attachment/"
        )
      : result.secure_url;

  console.log("[PHOTO CLOUDINARY SUCCESS]", {
    cloudName: config.cloudName,
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

export async function deleteFromPhotoCloudinary(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image"
): Promise<void> {
  if (!publicId) return;

  const config = getConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const signedParams: Record<string, string> = {
    invalidate: "true",
    public_id: publicId,
    timestamp,
  };

  const signature = makeSignature(
    signedParams,
    config.apiSecret
  );

  const body = new URLSearchParams({
    public_id: publicId,
    timestamp,
    invalidate: "true",
    api_key: config.apiKey,
    signature,
  });

  const endpoint =
    `https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/destroy`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("[PHOTO CLOUDINARY DELETE ERROR]", result);

    throw new Error(
      result?.error?.message || "Photo Cloudinary deletion failed"
    );
  }

  if (
    result?.result !== "ok" &&
    result?.result !== "not found"
  ) {
    throw new Error(
      `Unexpected Photo Cloudinary delete result: ${result?.result}`
    );
  }

  console.log("[PHOTO CLOUDINARY DELETE]", {
    cloudName: config.cloudName,
    publicId,
    result: result.result,
  });
}
