import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import PhotoSelectionEvent from "@/models/PhotoSelectionEvent";

export async function POST(request: NextRequest) {
  try {
    // Admin authentication
    const session = await getCurrentUser();

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();

    const {
      eventCode,
      eventName,
      clientName,
      clientId,
      bookingId,
      folderId,
      selectionLimit,
    } = body;

    // Required fields
    if (!eventCode || !eventName || !clientName) {
      return NextResponse.json(
        {
          error: "Event code, event name and client name are required",
        },
        { status: 400 }
      );
    }

    // Clean values
    const cleanEventCode = String(eventCode).trim().toUpperCase();
    const cleanEventName = String(eventName).trim();
    const cleanClientName = String(clientName).trim();

    // Check duplicate event code
    const existingEvent = await PhotoSelectionEvent.findOne({
      eventCode: cleanEventCode,
    });

    if (existingEvent) {
      return NextResponse.json(
        {
          error: "Event code already exists",
        },
        { status: 409 }
      );
    }

    // Optional ObjectId validation
    if (clientId && !mongoose.Types.ObjectId.isValid(clientId)) {
      return NextResponse.json(
        { error: "Invalid clientId" },
        { status: 400 }
      );
    }

    if (bookingId && !mongoose.Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json(
        { error: "Invalid bookingId" },
        { status: 400 }
      );
    }

    if (folderId && !mongoose.Types.ObjectId.isValid(folderId)) {
      return NextResponse.json(
        { error: "Invalid folderId" },
        { status: 400 }
      );
    }

    const event = await PhotoSelectionEvent.create({
      eventCode: cleanEventCode,
      eventName: cleanEventName,
      clientName: cleanClientName,

      clientId: clientId || undefined,
      bookingId: bookingId || undefined,
      folderId: folderId || undefined,

      totalPhotos: 0,
      selectionLimit:
        typeof selectionLimit === "number" && selectionLimit > 0
          ? selectionLimit
          : 250,

      status: "active",

      createdBy: session.userId,
    });

    return NextResponse.json(
      {
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
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Photo Selection Event POST]", error);

    return NextResponse.json(
      {
        error: "Failed to create photo selection event",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getCurrentUser();

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 401 }
      );
    }

    await connectDB();

    const events = await PhotoSelectionEvent.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      events: events.map((event) => ({
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
      })),
    });
  } catch (error) {
    console.error("[Photo Selection Event GET]", error);

    return NextResponse.json(
      {
        error: "Failed to fetch photo selection events",
      },
      { status: 500 }
    );
  }
}