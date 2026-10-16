
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";

import PhotoSelectionEvent from "@/models/PhotoSelectionEvent";
import PhotoSelectionPhoto from "@/models/PhotoSelectionPhoto";
import { getCloudinaryImageUrl } from "@/lib/cloudinary";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

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

    const event = await PhotoSelectionEvent.findOne({
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

    const requestedPage = Number(
      searchParams.get("page") || 1
    );

    const requestedLimit = Number(
      searchParams.get("limit") || DEFAULT_LIMIT
    );

    const page =
      Number.isSafeInteger(requestedPage) &&
      requestedPage > 0
        ? requestedPage
        : 1;

    const limit =
      Number.isSafeInteger(requestedLimit) &&
      requestedLimit > 0
        ? Math.min(requestedLimit, MAX_LIMIT)
        : DEFAULT_LIMIT;

    const [totalPhotos, photos] = await Promise.all([
      PhotoSelectionPhoto.countDocuments({
        eventId: event._id,
      }),

      PhotoSelectionPhoto.find({
        eventId: event._id,
      })
        .sort({ sequence: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select(
          "_id photoId originalFilename thumbnailUrl previewUrl cloudinaryUrl sequence"
        )
        .lean(),
    ]);

    return NextResponse.json({
      success: true,

      event: {
        id: String(event._id),
        eventCode: event.eventCode,
        eventName: event.eventName,
        clientName: event.clientName,
        totalPhotos,
        selectionLimit: event.selectionLimit,
        status: event.status,
      },

      pagination: {
        page,
        limit,
        totalPhotos,
        totalPages: Math.ceil(totalPhotos / limit),
        hasMore: page * limit < totalPhotos,
      },

      photos: photos.map((photo) => {
        const originalUrl =
          photo.cloudinaryUrl ||
          photo.previewUrl ||
          photo.thumbnailUrl ||
          null;

        const thumbnailSource =
          photo.thumbnailUrl || originalUrl;

        const previewSource =
          photo.previewUrl || originalUrl;

        return {
          id: String(photo._id),
          photoId: photo.photoId,
          originalFilename: photo.originalFilename,

          thumbnailUrl: getCloudinaryImageUrl(
            thumbnailSource,
            { width: 180 }
          ),

          previewUrl: getCloudinaryImageUrl(
            previewSource,
            { width: 1600 }
          ),

          sequence: photo.sequence,
        };
      }),
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
