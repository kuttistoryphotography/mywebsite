import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";

import PhotoSelectionEvent from "@/models/PhotoSelectionEvent";
import PhotoSelectionPhoto from "@/models/PhotoSelectionPhoto";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest
) {
  try {
    await connectDB();

    const { searchParams } =
      new URL(request.url);

    const eventCode = searchParams
      .get("code")
      ?.trim()
      .toUpperCase();

    if (!eventCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Event code is required",
        },
        { status: 400 }
      );
    }

    const event =
      await PhotoSelectionEvent.findOne({
        eventCode,
      }).lean();

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid event code",
        },
        { status: 404 }
      );
    }

    if (event.status === "closed") {
      return NextResponse.json(
        {
          success: false,
          error: "This photo selection event is closed",
        },
        { status: 403 }
      );
    }

    const photos =
      await PhotoSelectionPhoto.find({
        eventId: event._id,
      })
        .sort({ sequence: 1 })
        .lean();

    return NextResponse.json({
      success: true,

      event: {
        id: String(event._id),
        eventCode: event.eventCode,
        eventName: event.eventName,
        clientName: event.clientName,
        totalPhotos: photos.length,
        selectionLimit: event.selectionLimit,
        status: event.status,
      },

      photos: photos.map((photo) => ({
        id: String(photo._id),
        photoId: photo.photoId,
        originalFilename: photo.originalFilename,

        thumbnailUrl:
          photo.thumbnailUrl ||
          photo.cloudinaryUrl ||
          null,

        previewUrl:
          photo.previewUrl ||
          photo.cloudinaryUrl ||
          null,

        sequence: photo.sequence,
      })),
    });
  } catch (error) {
    console.error(
      "[Photo Selection Client Event]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load event",
      },
      { status: 500 }
    );
  }
}