import connectDB from "@/lib/db";
import resend from "@/lib/resend";
import Notification from "@/models/Notification";
import PhotoSelectionDecision from "@/models/PhotoSelectionDecision";
import PhotoSelectionEvent from "@/models/PhotoSelectionEvent";
import PhotoSelectionPhoto from "@/models/PhotoSelectionPhoto";
import PhotoSelectionSubmission from "@/models/PhotoSelectionSubmission";
import { NextRequest, NextResponse } from "next/server";

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

    const adminUserId = event.createdBy;

    if (adminUserId) {
      await Notification.create({
        userId: adminUserId,
        type: "photo_selection_submitted",
        title: "Photo Selection Submitted",
        description:
          `${event.clientName} submitted a photo selection for ${event.eventName}. ` +
          `Selected: ${selectedPhotos.length}, Rejected: ${rejectedPhotos.length}.`,
        isRead: false,
        relatedEntityType: "photo_selection_event",
        relatedEntityId: String(event._id),
        actionUrl: "/admin?tab=photo-selection",
      });
    }

    try {
      await resend.emails.send({
        from: "KuttiStory Photography <noreply@kuttistoryphotography.com>",
        to: process.env.ADMIN_EMAIL!,
        subject: isResubmission
          ? `🔄 Photo Selection Updated – ${event.eventName}`
          : `📸 New Photo Selection – ${event.eventName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
            <h2>
              ${isResubmission ? "🔄 Photo Selection Updated" : "📸 New Photo Selection Submitted"}
            </h2>

            <p>A photo selection has been ${isResubmission ? "updated" : "submitted"}.</p>

            <table style="border-collapse: collapse; width: 100%;">
              <tr>
                <td style="padding: 8px; font-weight: bold;">Event</td>
                <td style="padding: 8px;">${event.eventName}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Client</td>
                <td style="padding: 8px;">${event.clientName}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Event Code</td>
                <td style="padding: 8px;">${event.eventCode}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Selected</td>
                <td style="padding: 8px;">${selectedPhotos.length}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Rejected</td>
                <td style="padding: 8px;">${rejectedPhotos.length}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Status</td>
                <td style="padding: 8px;">
                  ${isResubmission ? "Updated Selection" : "New Submission"}
                </td>
              </tr>
            </table>

            <p style="margin-top: 24px;">
              Please review the selection in the KuttiStory Admin Panel.
            </p>
          </div>
        `,
      });

    console.log("📧 PHOTO SELECTION EMAIL SENT");
    } catch (emailError) {
      console.error("❌ PHOTO SELECTION EMAIL ERROR:", emailError);
    }
    
    // Send confirmation email to the client
    if (event.clientEmail) {
      try {
        await resend.emails.send({
          from: "KuttiStory Photography <noreply@kuttistoryphotography.com>",
          to: event.clientEmail,
          subject: isResubmission
            ? `Your Photo Selection Has Been Updated – ${event.eventName}`
            : `Your Photo Selection Is Confirmed – ${event.eventName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #222;">
              <h2>
                ${isResubmission ? "Your Photo Selection Has Been Updated" : "Your Photo Selection Has Been Submitted Successfully"}
              </h2>

              <p>Dear ${event.clientName},</p>

              <p>
                ${
                  isResubmission
                    ? "Your updated photo selection has been received successfully."
                    : "Thank you for choosing KuttiStory Photography. We have received your photo selection successfully."
                }
              </p>

              <table style="border-collapse: collapse; width: 100%;">
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Event</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;">${event.eventName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Event Code</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;">${event.eventCode}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Selected Photos</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;">${selectedPhotos.length}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Rejected Photos</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;">${rejectedPhotos.length}</td>
                </tr>
              </table>

              <p style="margin-top: 24px;">
                ${
                  isResubmission
                    ? "Your latest selection will be used for the next stage of processing."
                    : "Our team will review your selection and proceed with the next stage."
                }
              </p>

              <p>Thank you,<br/><strong>KuttiStory Photography</strong></p>
              <p style="font-size: 12px; color: #777;">Capturing Your Best Moments with KuttiStory Photography</p>
            </div>
          `,
        });

        console.log("📧 CLIENT CONFIRMATION EMAIL SENT");
      } catch (clientEmailError) {
        console.error(
          "❌ CLIENT CONFIRMATION EMAIL ERROR:",
          clientEmailError
        );
      }
    }

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