
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import FinalPackageTemplate from "@/models/FinalPackageTemplate";
import { requireFinalPackageAdmin } from "@/lib/final-package/admin-auth";

const VALID_CATEGORIES = ["basic", "standard", "premium", "vip"];

export async function GET(request: NextRequest) {
  try {
    const { response } = await requireFinalPackageAdmin();

    if (response) return response;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get("eventType");

    const filter: Record<string, string> = {};

    if (eventType) {
      if (!["wedding", "engagement"].includes(eventType)) {
        return NextResponse.json(
          { success: false, message: "Invalid event type." },
          { status: 400 }
        );
      }

      filter.eventType = eventType;
    }

    const templates = await FinalPackageTemplate.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error("Final Package templates GET error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve package templates." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireFinalPackageAdmin();

    if (response) return response;

    await connectDB();

    const body = await request.json();

    const templateCode =
      typeof body.templateCode === "string"
        ? body.templateCode.trim().toUpperCase()
        : "";

    const packageName =
      typeof body.packageName === "string"
        ? body.packageName.trim()
        : "";

    const category =
      typeof body.category === "string"
        ? body.category.trim().toLowerCase()
        : "";

    const eventType =
      typeof body.eventType === "string"
        ? body.eventType.trim().toLowerCase()
        : "wedding";

    if (!["wedding", "engagement"].includes(eventType)) {
      return NextResponse.json(
        { success: false, message: "Invalid event type." },
        { status: 400 }
      );
    }
    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const basePrice = Number(body.basePrice);

    if (!templateCode || !packageName || !category) {
      return NextResponse.json(
        {
          success: false,
          message: "Template code, package name and category are required.",
        },
        { status: 400 }
      );
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { success: false, message: "Invalid package category." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(basePrice) || basePrice < 0) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid package price." },
        { status: 400 }
      );
    }

    const existingTemplate = await FinalPackageTemplate.findOne({
      templateCode,
    });

    if (existingTemplate) {
      return NextResponse.json(
        { success: false, message: "This template code already exists." },
        { status: 409 }
      );
    }

    const services = Array.isArray(body.services)
      ? body.services
      : [];

    const deliverables = Array.isArray(body.deliverables)
      ? body.deliverables
      : [];

    const template = await FinalPackageTemplate.create({
      templateCode,
      packageName,
      category,
      eventType,
      description,
      basePrice,
      services,
      deliverables,
      isActive: body.isActive !== false,
      sortOrder: Number.isFinite(Number(body.sortOrder))
        ? Number(body.sortOrder)
        : 0,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Package template created successfully.",
        template,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Final Package templates POST error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to create package template." },
      { status: 500 }
    );
  }
}
