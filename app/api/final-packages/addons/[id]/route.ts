
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import FinalPackageAddon from "@/models/FinalPackageAddon";
import { requireFinalPackageAdmin } from "@/lib/final-package/admin-auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { response } = await requireFinalPackageAdmin();

    if (response) return response;

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid add-on ID." },
        { status: 400 }
      );
    }

    await connectDB();

    const body = await request.json();

    const allowedFields = [
      "name",
      "description",
      "category",
      "defaultPrice",
      "isActive",
      "sortOrder",
    ];

    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid fields provided." },
        { status: 400 }
      );
    }

    if (
      "name" in updates &&
      (typeof updates.name !== "string" || !updates.name.trim())
    ) {
      return NextResponse.json(
        { success: false, message: "Add-on name cannot be empty." },
        { status: 400 }
      );
    }

    if (
      "defaultPrice" in updates &&
      (
        typeof updates.defaultPrice !== "number" ||
        !Number.isFinite(updates.defaultPrice) ||
        updates.defaultPrice < 0
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid add-on price." },
        { status: 400 }
      );
    }

    if (
      "isActive" in updates &&
      typeof updates.isActive !== "boolean"
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid active status." },
        { status: 400 }
      );
    }

    if (
      "sortOrder" in updates &&
      (
        typeof updates.sortOrder !== "number" ||
        !Number.isFinite(updates.sortOrder)
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid display order." },
        { status: 400 }
      );
    }

    const addon = await FinalPackageAddon.findByIdAndUpdate(
      id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!addon) {
      return NextResponse.json(
        { success: false, message: "Add-on service not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Add-on service updated successfully.",
      addon,
    });
  } catch (error) {
    console.error("Final Package addon PATCH error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update add-on service." },
      { status: 500 }
    );
  }
}
