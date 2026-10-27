
/**
 * app/api/upload/route.ts
 *
 * Unified file upload endpoint — Cloudinary storage.
 *
 * Supports:
 * - Single and multiple file uploads
 * - Remote URL uploads
 * - Optional CloudinaryFile database records
 * - Diagnostic logging for HTTP 500 errors
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import { CloudinaryFile } from "@/models/CloudinaryFile";
import {
  uploadToCloudinary,
  contextFromString,
  guessMimeType,
} from "@/lib/cloudinary";
import { toThumbnailUrl } from "@/lib/cloudinary-url";

const MAX_SIZE_MB = 50;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

async function handleFile(
  file: File,
  context: string,
  userId?: string,
  label?: string,
  saveToDb = false
): Promise<{
  name: string;
  url: string;
  downloadUrl: string;
  publicId: string;
  mimeType: string;
  bytes: number;
  folderName?: string;
  dbId?: string;
}> {
  console.log("[UPLOAD DEBUG] Validating file", {
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
    context,
  });

  const mimeType = guessMimeType(file.name, file.type);

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`File exceeds ${MAX_SIZE_MB} MB limit`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  console.log("[UPLOAD DEBUG] Starting Cloudinary upload", {
    fileName: file.name,
    mimeType,
    bytes: buffer.length,
    context,
  });

  const result = await uploadToCloudinary(buffer, {
    fileName: file.name,
    mimeType,
    context: contextFromString(context),
  });

  console.log("[UPLOAD DEBUG] Cloudinary upload succeeded", {
    fileName: file.name,
    publicId: result.publicId,
    resourceType: result.resourceType,
  });

  let dbId: string | undefined;

  if (saveToDb) {
    console.log("[UPLOAD DEBUG] Saving upload record to database");

    await connectDB();

    const doc = await CloudinaryFile.create({
      originalName: file.name,
      publicId: result.publicId,
      url: result.url,
      downloadUrl: result.downloadUrl,
      resourceType: result.resourceType,
      format: result.format,
      mimeType: result.mimeType,
      fileSizeBytes: result.fileSizeBytes,
      folderName: result.folderName,
      context: contextFromString(context),
      label: label || file.name,
      uploadedBy: userId,
    });

    dbId = String(doc._id);

    console.log("[UPLOAD DEBUG] Database record saved", { dbId });
  }

  return {
    name: file.name,
    url: result.url,
    downloadUrl: result.downloadUrl,
    publicId: result.publicId,
    mimeType: result.mimeType,
    bytes: result.fileSizeBytes,
    folderName: result.folderName,
    dbId,
  };
}

export async function POST(request: NextRequest) {
  console.log("[UPLOAD DEBUG] POST /api/upload started");

  try {
    // 1. Authentication
    console.log("[UPLOAD DEBUG] Checking session");

    const session = await getCurrentUser();

    console.log("[UPLOAD DEBUG] Session check:", Boolean(session));

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // 2. Request type
    const contentType = request.headers.get("content-type") || "";

    console.log("[UPLOAD DEBUG] Request content type:", contentType);

    // 3. JSON: re-upload a remote URL
    if (contentType.includes("application/json")) {
      console.log("[UPLOAD DEBUG] Processing JSON upload");

      const body = await request.json();
      const { url, context } = body;

      if (typeof url !== "string" || !url.trim()) {
        return NextResponse.json(
          { success: false, error: "A valid URL is required" },
          { status: 400 }
        );
      }

      if (url.includes("res.cloudinary.com")) {
        return NextResponse.json({
          success: true,
          url,
          downloadUrl: url,
          source: "passthrough",
        });
      }

      const resp = await fetch(url);

      if (!resp.ok) {
        throw new Error(
          `Failed to fetch remote URL: HTTP ${resp.status}`
        );
      }

      const buffer = Buffer.from(await resp.arrayBuffer());

      if (buffer.length > MAX_SIZE_MB * 1024 * 1024) {
        throw new Error(`File exceeds ${MAX_SIZE_MB} MB limit`);
      }

      const fileName =
        url.split("/").pop()?.split("?")[0] || "file";

      const mimeType =
        resp.headers.get("content-type")?.split(";")[0] ||
        "application/octet-stream";

      console.log("[UPLOAD DEBUG] Uploading remote URL to Cloudinary", {
        fileName,
        mimeType,
        bytes: buffer.length,
      });

      const result = await uploadToCloudinary(buffer, {
        fileName,
        mimeType,
        context: contextFromString(context || ""),
      });

      return NextResponse.json({
        success: true,
        url: result.url,
        downloadUrl: result.downloadUrl,
        publicId: result.publicId,
        folderName: result.folderName,
        source: "cloudinary",
      });
    }

    // 4. Multipart: file upload
    console.log("[UPLOAD DEBUG] Reading multipart form data");

    const formData = await request.formData();

    const context = (formData.get("context") as string) || "";
    const label = (formData.get("label") as string) || "";
    const saveToDb = formData.get("saveToDb") === "true";

    const singleFile = formData.get("file") as File | null;
    const multiFiles = formData.getAll("files[]") as File[];

    const files = singleFile ? [singleFile] : multiFiles;

    console.log("[UPLOAD DEBUG] Files received:", files.length);

    if (!files.length) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 }
      );
    }

    const results: Awaited<ReturnType<typeof handleFile>>[] = [];
    const errors: { name: string; error: string }[] = [];

    for (const file of files) {
      try {
        if (!(file instanceof File)) {
          throw new Error("Invalid uploaded file");
        }

        const result = await handleFile(
          file,
          context,
          session.userId,
          label,
          saveToDb
        );

        results.push(result);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Upload failed";

        console.error("[UPLOAD DEBUG] File upload failed:", {
          fileName: file?.name,
          message,
          error: err,
        });

        errors.push({
          name: file?.name || "unknown",
          error: message,
        });
      }
    }

    if (!results.length && errors.length) {
      return NextResponse.json(
        {
          success: false,
          errors,
          error: errors[0].error,
        },
        { status: 422 }
      );
    }

    console.log("[UPLOAD DEBUG] Upload request completed", {
      successful: results.length,
      failed: errors.length,
    });

    return NextResponse.json({
      success: true,
      url: results[0]?.url,
      downloadUrl: results[0]?.downloadUrl,
      publicId: results[0]?.publicId,
      folderName: results[0]?.folderName,
      thumbnailUrl: results[0]?.url
        ? toThumbnailUrl(results[0].url)
        : null,
      files: results,
      errors,
      source: "cloudinary",
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Upload failed";

    console.error("[UPLOAD API] Full error:", err);
    console.error("[UPLOAD API] Message:", message);

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
