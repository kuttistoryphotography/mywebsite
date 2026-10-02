import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/db";
import PhotoSelectionEvent from "@/models/PhotoSelectionEvent";
import PhotoSelectionPhoto from "@/models/PhotoSelectionPhoto";
import PhotoSelectionDecision from "@/models/PhotoSelectionDecision";

import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const session = await getCurrentUser();

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await context.params;

    const event =
      await PhotoSelectionEvent.findById(id).lean();

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error: "Photo selection event not found",
        },
        { status: 404 }
      );
    }

    const decisions =
      await PhotoSelectionDecision.find({
        eventId: event._id,
      })
        .sort({ decidedAt: 1 })
        .lean();

    const photos =
      await PhotoSelectionPhoto.find({
        eventId: event._id,
      })
        .lean();

    const photoMap = new Map(
      photos.map((photo) => [
        String(photo._id),
        photo,
      ])
    );

    const selected = decisions
      .filter(
        (decision) =>
          decision.decision === "selected"
      )
      .map((decision) => {
        const photo = photoMap.get(
          String(decision.photoId)
        );

        return {
          id: String(decision.photoId),
          originalFilename:
            decision.originalFilename ||
            photo?.originalFilename ||
            "",
          thumbnailUrl:
            photo?.thumbnailUrl ||
            photo?.cloudinaryUrl ||
            null,
          previewUrl:
            photo?.previewUrl ||
            photo?.cloudinaryUrl ||
            null,
          sequence: photo?.sequence ?? null,
          decidedAt: decision.decidedAt,
        };
      });

    const rejected = decisions
      .filter(
        (decision) =>
          decision.decision === "rejected"
      )
      .map((decision) => {
        const photo = photoMap.get(
          String(decision.photoId)
        );

        return {
          id: String(decision.photoId),
          originalFilename:
            decision.originalFilename ||
            photo?.originalFilename ||
            "",
          thumbnailUrl:
            photo?.thumbnailUrl ||
            photo?.cloudinaryUrl ||
            null,
          previewUrl:
            photo?.previewUrl ||
            photo?.cloudinaryUrl ||
            null,
          sequence: photo?.sequence ?? null,
          decidedAt: decision.decidedAt,
        };
      });

    return NextResponse.json({
      success: true,

      event: {
        id: String(event._id),
        eventCode: event.eventCode,
        eventName: event.eventName,
        clientName: event.clientName,
        status: event.status,
        selectionLimit: event.selectionLimit,
      },

      selected,
      rejected,

      counts: {
        selected: selected.length,
        rejected: rejected.length,
      },
    });
  } catch (error) {
    console.error(
      "[Photo Selection Admin Selection]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load photo selection",
      },
      { status: 500 }
    );
  }
}