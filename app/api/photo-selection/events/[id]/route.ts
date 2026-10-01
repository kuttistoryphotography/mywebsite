import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import PhotoSelectionEvent from "@/models/PhotoSelectionEvent";

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
    console.error("[Photo Selection Event GET]", error);

    return NextResponse.json(
      { error: "Failed to fetch photo selection event" },
      { status: 500 }
    );
  }
}