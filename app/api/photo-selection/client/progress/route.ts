
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/db";
import PhotoSelectionEvent from "@/models/PhotoSelectionEvent";
import PhotoSelectionPhoto from "@/models/PhotoSelectionPhoto";
import PhotoSelectionProgress from "@/models/PhotoSelectionProgress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeCode(value: string | null) {
  return value?.trim().toUpperCase() || "";
}

function normalizeIds(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;

  const ids: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") return null;

    const id = item.trim();

    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    if (!ids.includes(id)) ids.push(id);
  }

  return ids;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const code = normalizeCode(
      request.nextUrl.searchParams.get("code")
    );

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Event code is required" },
        { status: 400 }
      );
    }

    const event = await PhotoSelectionEvent.findOne({
      eventCode: code,
    })
      .select("_id status selectionLimit")
      .lean();

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Invalid event code" },
        { status: 404 }
      );
    }

    const progress = await PhotoSelectionProgress.findOne({
      eventId: event._id,
    })
      .select("selectedPhotoIds rejectedPhotoIds savedAt")
      .lean();

    return NextResponse.json({
      success: true,
      progress: {
        selectedPhotoIds: (progress?.selectedPhotoIds ?? []).map(
          (id) => String(id)
        ),
        rejectedPhotoIds: (progress?.rejectedPhotoIds ?? []).map(
          (id) => String(id)
        ),
        savedAt: progress?.savedAt ?? null,
      },
    });
  } catch (error) {
    console.error("[Photo Selection Progress GET]", error);

    return NextResponse.json(
      { success: false, error: "Failed to load saved progress" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const code = normalizeCode(
      typeof body.code === "string" ? body.code : null
    );

    const selectedIds = normalizeIds(body.selectedPhotoIds);
    const rejectedIds = normalizeIds(body.rejectedPhotoIds);

    if (!code || !selectedIds || !rejectedIds) {
      return NextResponse.json(
        {
          success: false,
          error: "Event code and valid photo ID arrays are required",
        },
        { status: 400 }
      );
    }

    const overlap = selectedIds.some((id) =>
      rejectedIds.includes(id)
    );

    if (overlap) {
      return NextResponse.json(
        {
          success: false,
          error: "A photo cannot be both selected and rejected",
        },
        { status: 400 }
      );
    }

    const event = await PhotoSelectionEvent.findOne({
      eventCode: code,
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Invalid event code" },
        { status: 404 }
      );
    }

    if (event.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          error: "This event no longer accepts progress changes",
        },
        { status: 403 }
      );
    }

    if (selectedIds.length > event.selectionLimit) {
      return NextResponse.json(
        {
          success: false,
          error: `You can select up to ${event.selectionLimit} photos`,
        },
        { status: 400 }
      );
    }

    const allIds = [...new Set([...selectedIds, ...rejectedIds])];

    if (allIds.length > 0) {
      const validPhotoCount = await PhotoSelectionPhoto.countDocuments({
        eventId: event._id,
        _id: {
          $in: allIds.map(
            (id) => new mongoose.Types.ObjectId(id)
          ),
        },
      });

      if (validPhotoCount !== allIds.length) {
        return NextResponse.json(
          {
            success: false,
            error: "One or more photos do not belong to this event",
          },
          { status: 400 }
        );
      }
    }

    const savedAt = new Date();

    await PhotoSelectionProgress.findOneAndUpdate(
      { eventId: event._id },
      {
        $set: {
          selectedPhotoIds: selectedIds.map(
            (id) => new mongoose.Types.ObjectId(id)
          ),
          rejectedPhotoIds: rejectedIds.map(
            (id) => new mongoose.Types.ObjectId(id)
          ),
          savedAt,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Progress saved successfully",
      savedAt,
    });
  } catch (error) {
    console.error("[Photo Selection Progress POST]", error);

    return NextResponse.json(
      { success: false, error: "Failed to save progress" },
      { status: 500 }
    );
  }
}
