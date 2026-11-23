
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import FinalPackageTemplate from "@/models/FinalPackageTemplate";
import { requireFinalPackageAdmin } from "@/lib/final-package/admin-auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const VALID_CATEGORIES = ["basic", "standard", "premium", "vip"];

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
        { success: false, message: "Invalid template ID." },
        { status: 400 }
      );
    }

    await connectDB();

    const body = await request.json();

    const allowedFields = [
      "packageName",
      "category",
      "description",
      "basePrice",
      "services",
      "deliverables",
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
      "packageName" in updates &&
      (
        typeof updates.packageName !== "string" ||
        !updates.packageName.trim()
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Package name cannot be empty." },
        { status: 400 }
      );
    }

    if (
      "category" in updates &&
      (
        typeof updates.category !== "string" ||
        !VALID_CATEGORIES.includes(updates.category)
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid package category." },
        { status: 400 }
      );
    }

    if (
      "basePrice" in updates &&
      (
        typeof updates.basePrice !== "number" ||
        !Number.isFinite(updates.basePrice) ||
        updates.basePrice < 0
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid package price." },
        { status: 400 }
      );
    }

    if (
      "services" in updates &&
      (
        !Array.isArray(updates.services) ||
        !updates.services.every(
          (item) =>
            typeof item === "object" &&
            item !== null &&
            typeof item.name === "string"
        )
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid package services." },
        { status: 400 }
      );
    }

    if (
      "deliverables" in updates &&
      (
        !Array.isArray(updates.deliverables) ||
        !updates.deliverables.every(
          (item) =>
            typeof item === "object" &&
            item !== null &&
            typeof item.name === "string"
        )
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid package deliverables." },
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

    const template = await FinalPackageTemplate.findByIdAndUpdate(
      id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!template) {
      return NextResponse.json(
        { success: false, message: "Package template not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Package template updated successfully.",
      template,
    });
  } catch (error) {
    console.error("Final Package template PATCH error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update package template." },
      { status: 500 }
    );
  }
}
