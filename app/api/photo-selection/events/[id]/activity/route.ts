
import connectDB from "@/lib/db";
import PhotoSelectionActivity from "@/models/PhotoSelectionActivity";
import PhotoSelectionEvent from "@/models/PhotoSelectionEvent";
import { getCurrentUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid event ID" },
        { status: 400 }
      );
    }

    const event = await PhotoSelectionEvent.findById(id);

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    const activities = await PhotoSelectionActivity.find({
      eventId: event._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error("PHOTO SELECTION ACTIVITY API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch activity history",
      },
      { status: 500 }
    );
  }
}
