import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { deleteFromCloudinary } from "@/lib/cloudinary";

import PhotoSelectionEvent from "@/models/PhotoSelectionEvent";
import PhotoSelectionPhoto from "@/models/PhotoSelectionPhoto";
import PhotoSelectionDecision from "@/models/PhotoSelectionDecision";
import PhotoSelectionSubmission from "@/models/PhotoSelectionSubmission";
import { FileDoc } from "@/models/FileManager";
import { CloudinaryFile } from "@/models/CloudinaryFile";

export const runtime = "nodejs";

/* =========================================================
   GET PHOTO SELECTION EVENT
========================================================= */

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid event ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const event = await PhotoSelectionEvent.findById(id).lean();

    if (!event) {
      return NextResponse.json(
        { error: "Photo Selection event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      event: {
        id: String(event._id),
        eventCode: event.eventCode,
        eventName: event.eventName,
        clientName: event.clientName,

        clientId: event.clientId
          ? String(event.clientId)
          : null,

        bookingId: event.bookingId
          ? String(event.bookingId)
          : null,

        folderId: event.folderId
          ? String(event.folderId)
          : null,

        totalPhotos: event.totalPhotos,
        selectionLimit: event.selectionLimit,
        status: event.status,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "[Photo Selection Event GET]",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to fetch photo selection event",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE PHOTO SELECTION EVENT
========================================================= */

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid event ID" },
        { status: 400 }
      );
    }

    await connectDB();

    /* -------------------------------------------------------
       FIND EVENT
    ------------------------------------------------------- */

    const event = await PhotoSelectionEvent.findById(id);

    if (!event) {
      return NextResponse.json(
        {
          error: "Photo Selection event not found",
        },
        { status: 404 }
      );
    }

    /* -------------------------------------------------------
       FIND ALL PHOTOS
    ------------------------------------------------------- */

    const photos = await PhotoSelectionPhoto.find({
      eventId: event._id,
    }).lean();

    /* -------------------------------------------------------
       GET FILE MANAGER IDS
    ------------------------------------------------------- */

    const fileIds = photos
      .map((photo) => photo.fileId)
      .filter(Boolean);

    /* -------------------------------------------------------
       FIND FILE MANAGER RECORDS
    ------------------------------------------------------- */

    const fileDocs =
      fileIds.length > 0
        ? await FileDoc.find({
            _id: {
              $in: fileIds,
            },
          }).lean()
        : [];

    /* -------------------------------------------------------
       DELETE CLOUDINARY FILES
    ------------------------------------------------------- */

    for (const file of fileDocs) {
      if (!file.cloudinaryPublicId) {
        continue;
      }

      try {
        await deleteFromCloudinary(
          file.cloudinaryPublicId,
          file.resourceType || "image"
        );
      } catch (error) {
        /*
         * Continue deleting the database records even if
         * one Cloudinary deletion fails.
         */

        console.error(
          "[Photo Selection] Cloudinary delete failed:",
          file.cloudinaryPublicId,
          error
        );
      }
    }

    /* -------------------------------------------------------
       DELETE CLOUDINARY REGISTRY RECORDS
    ------------------------------------------------------- */

    if (fileIds.length > 0) {
      await CloudinaryFile.deleteMany({
        refModel: "FileDoc",
        refId: {
          $in: fileIds,
        },
      });
    }

    /* -------------------------------------------------------
       DELETE FILE MANAGER RECORDS
    ------------------------------------------------------- */

    if (fileIds.length > 0) {
      await FileDoc.deleteMany({
        _id: {
          $in: fileIds,
        },
      });
    }

    /* -------------------------------------------------------
       DELETE CLIENT DECISIONS
    ------------------------------------------------------- */

    await PhotoSelectionDecision.deleteMany({
      eventId: event._id,
    });

    /* -------------------------------------------------------
       DELETE SUBMISSION
    ------------------------------------------------------- */

    await PhotoSelectionSubmission.deleteMany({
      eventId: event._id,
    });

    /* -------------------------------------------------------
       DELETE PHOTO SELECTION PHOTOS
    ------------------------------------------------------- */

    await PhotoSelectionPhoto.deleteMany({
      eventId: event._id,
    });

    /* -------------------------------------------------------
       DELETE EVENT
    ------------------------------------------------------- */

    await PhotoSelectionEvent.deleteOne({
      _id: event._id,
    });

    /* -------------------------------------------------------
       SUCCESS
    ------------------------------------------------------- */

    return NextResponse.json({
      success: true,

      message:
        "Photo Selection event deleted successfully",

      deletedEvent: {
        id: String(event._id),
        eventCode: event.eventCode,
        eventName: event.eventName,
        clientName: event.clientName,
      },

      deletedPhotos: photos.length,

      deletedFiles: fileDocs.length,
    });
  } catch (error) {
    console.error(
      "[Photo Selection Event DELETE]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete Photo Selection event",
      },
      { status: 500 }
    );
  }
}