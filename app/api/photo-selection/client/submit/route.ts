import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";

import PhotoSelectionEvent from "@/models/PhotoSelectionEvent";
import PhotoSelectionPhoto from "@/models/PhotoSelectionPhoto";
import PhotoSelectionDecision from "@/models/PhotoSelectionDecision";
import PhotoSelectionSubmission from "@/models/PhotoSelectionSubmission";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    success: true,
    message:
      "Photo selection updated successfully.",
  });
}

export async function POST(
  request: NextRequest
) {
    console.log("🔥🔥 SUBMIT API REACHED 🔥🔥");
    
  try {
    await connectDB();

    const body = await request.json();

    const eventCode = String(
      body.eventCode || ""
    )
      .trim()
      .toUpperCase();

    const selectedPhotos = Array.isArray(
      body.selectedPhotos
    )
      ? body.selectedPhotos
      : [];

    const rejectedPhotos = Array.isArray(
      body.rejectedPhotos
    )
      ? body.rejectedPhotos
      : [];

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
      });

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid event code",
        },
        { status: 404 }
      );
    }

    const existingSubmission =
      await PhotoSelectionSubmission.findOne({
        eventId: event._id,
      });

    const isResubmission =
      !!existingSubmission;

    if (event.status === "closed") {
      return NextResponse.json(
        {
          success: false,
          error:
            "This photo selection event is closed",
        },
        { status: 403 }
      );
    }

    if (selectedPhotos.length > event.selectionLimit) {
      return NextResponse.json(
        {
          success: false,
          error: `You can select up to ${event.selectionLimit} photos.`,
        },
        { status: 400 }
      );
    }

    if (
      selectedPhotos.length === 0 &&
      rejectedPhotos.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "No photo decisions were submitted",
        },
        { status: 400 }
      );
    }

    /*
     * Get all photos belonging to this event
     */
    const eventPhotos =
      await PhotoSelectionPhoto.find({
        eventId: event._id,
      }).lean();

    const validPhotoIds = new Set(
      eventPhotos.map((photo) =>
        String(photo._id)
      )
    );

    /*
     * Validate selected + rejected IDs
     */
    const allSubmittedPhotos = [
      ...selectedPhotos,
      ...rejectedPhotos,
    ];

    for (const photo of allSubmittedPhotos) {
      const photoId = String(
        photo.id || ""
      );

      if (!validPhotoIds.has(photoId)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "One or more submitted photos are invalid.",
          },
          { status: 400 }
        );
      }
    }

    /*
     * Prevent the same photo from being both
     * selected and rejected.
     */
    const selectedIds = new Set(
      selectedPhotos.map((photo: any) =>
        String(photo.id)
      )
    );

    for (const photo of rejectedPhotos) {
      if (
        selectedIds.has(
          String(photo.id)
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "A photo cannot be both selected and rejected.",
          },
          { status: 400 }
        );
      }
    }

    /*
    * Replace previous decision records
    * with the client's latest final selection.
    */
    await PhotoSelectionDecision.deleteMany({
      eventId: event._id,
    });

    const decisions = [
      ...selectedPhotos.map((photo: any) => ({
        eventId: event._id,
        photoId: photo.id,
        originalFilename:
          photo.filename || "",
        decision: "selected",
        decidedAt: new Date(),
      })),

      ...rejectedPhotos.map((photo: any) => ({
        eventId: event._id,
        photoId: photo.id,
        originalFilename:
          photo.filename || "",
        decision: "rejected",
        decidedAt: new Date(),
      })),
    ];

    if (decisions.length > 0) {
      await PhotoSelectionDecision.insertMany(
        decisions
      );
    }

    /*
    * Create or update final submission record
    */
    await PhotoSelectionSubmission.findOneAndUpdate(
      {
        eventId: event._id,
      },
      {
        $set: {
          selectedCount: selectedPhotos.length,
          rejectedCount: rejectedPhotos.length,
          status: "submitted",
          submittedAt: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
      }
    );

    /*
     * Mark event as submitted
     */
    event.status = "submitted";
    await event.save();

    return NextResponse.json({
      success: true,
      message: isResubmission
        ? "Photo selection updated successfully."
        : "Photo selection submitted successfully.",
      selectedCount:
        selectedPhotos.length,
      rejectedCount:
        rejectedPhotos.length,
    });
    
  } catch (error) {
    console.error(
      "[Photo Selection Client Submit]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to submit photo selection",
      },
      { status: 500 }
    );
  }
}