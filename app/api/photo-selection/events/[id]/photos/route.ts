export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { uploadToCloudinary, guessMimeType } from "@/lib/cloudinary";

import { FileDoc } from "@/models/FileManager";
import { CloudinaryFile } from "@/models/CloudinaryFile";

import PhotoSelectionEvent from "@/models/PhotoSelectionEvent";
import PhotoSelectionPhoto from "@/models/PhotoSelectionPhoto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // --------------------------------------------------
    // ADMIN AUTH
    // --------------------------------------------------

    const session = await getCurrentUser();

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // EVENT ID
    // --------------------------------------------------

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid event ID" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // DATABASE
    // --------------------------------------------------

    await connectDB();

    const event = await PhotoSelectionEvent.findById(id);

    if (!event) {
      return NextResponse.json(
        { error: "Photo Selection event not found" },
        { status: 404 }
      );
    }

    if (event.status === "closed") {
      return NextResponse.json(
        { error: "This Photo Selection event is closed" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // FORM DATA
    // --------------------------------------------------

    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Photo file is required" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    const MAX_SIZE_MB = 50;

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        {
          error: `Image must be smaller than ${MAX_SIZE_MB}MB`,
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // FILE INFORMATION
    // --------------------------------------------------

    const originalName = file.name;

    const mimeType = guessMimeType(
      originalName,
      file.type
    );

    const extension =
      originalName.split(".").pop()?.toLowerCase() || "";

    const safeFileName =
      originalName.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      ) || "photo";

    const buffer = Buffer.from(
      await file.arrayBuffer()
    );

    // --------------------------------------------------
    // UPLOAD TO CLOUDINARY
    // --------------------------------------------------

    const cloudinaryResult =
      await uploadToCloudinary(buffer, {
        fileName: originalName,
        mimeType,
        context: "fm",
      });

    // --------------------------------------------------
    // CREATE FILE MANAGER RECORD
    // --------------------------------------------------

    const fileDoc = await FileDoc.create({
      originalName,

      fileName: safeFileName,

      fileType: extension,

      mimeType,

      fileSize:
        cloudinaryResult.fileSizeBytes,

      cloudinaryPublicId:
        cloudinaryResult.publicId,

      cloudinaryUrl:
        cloudinaryResult.url,

      cloudinaryDownloadUrl:
        cloudinaryResult.downloadUrl,

      resourceType:
        cloudinaryResult.resourceType,

      folderId:
        event.folderId || undefined,

      clientId:
        event.clientId || undefined,

      bookingId:
        event.bookingId || undefined,

      isSharedWithClient: false,

      uploadedBy:
        session.userId,
    });

    // --------------------------------------------------
    // CLOUDINARY REGISTRY
    // --------------------------------------------------

    await CloudinaryFile.create({
      originalName,

      publicId:
        cloudinaryResult.publicId,

      url:
        cloudinaryResult.url,

      downloadUrl:
        cloudinaryResult.downloadUrl,

      resourceType:
        cloudinaryResult.resourceType,

      format:
        cloudinaryResult.format,

      mimeType,

      fileSizeBytes:
        cloudinaryResult.fileSizeBytes,

      folderName:
        cloudinaryResult.folderName,

      context: "fm",

      label: originalName,

      refModel: "FileDoc",

      refId: fileDoc._id,

      uploadedBy:
        session.userId,
    });

    // --------------------------------------------------
    // NEXT PHOTO SEQUENCE
    // --------------------------------------------------

    const lastPhoto =
      await PhotoSelectionPhoto.findOne({
        eventId: event._id,
      })
        .sort({ sequence: -1 })
        .lean();

    const sequence =
      typeof lastPhoto?.sequence === "number"
        ? lastPhoto.sequence + 1
        : 0;

    // --------------------------------------------------
    // CREATE PHOTO SELECTION RECORD
    // --------------------------------------------------

    const photoId =
      new mongoose.Types.ObjectId().toString();

    const photo =
      await PhotoSelectionPhoto.create({
        photoId,

        eventId:
          event._id,

        // IMPORTANT:
        // This is now a REAL FileDoc ID.
        fileId:
          fileDoc._id,

        // Preserve editor's original filename.
        originalFilename:
          originalName,

        cloudinaryPublicId:
          cloudinaryResult.publicId,

        cloudinaryUrl:
          cloudinaryResult.url,

        thumbnailUrl:
          cloudinaryResult.url,

        previewUrl:
          cloudinaryResult.url,

        sequence,
      });

    // --------------------------------------------------
    // UPDATE EVENT PHOTO COUNT
    // --------------------------------------------------

    event.totalPhotos =
      await PhotoSelectionPhoto.countDocuments({
        eventId: event._id,
      });

    await event.save();

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        photo: {
          id: String(photo._id),

          photoId:
            photo.photoId,

          fileId:
            String(fileDoc._id),

          originalFilename:
            photo.originalFilename,

          cloudinaryPublicId:
            photo.cloudinaryPublicId,

          cloudinaryUrl:
            photo.cloudinaryUrl,

          thumbnailUrl:
            photo.thumbnailUrl,

          previewUrl:
            photo.previewUrl,

          sequence:
            photo.sequence,
        },

        totalPhotos:
          event.totalPhotos,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "[Photo Selection Upload]",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload photo",
      },
      { status: 500 }
    );
  }
}