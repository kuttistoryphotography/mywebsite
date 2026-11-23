
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import FinalPackageAddon from "@/models/FinalPackageAddon";
import { requireFinalPackageAdmin } from "@/lib/final-package/admin-auth";

export async function GET() {
  try {
    const { response } = await requireFinalPackageAdmin();

    if (response) return response;

    await connectDB();

    const addons = await FinalPackageAddon.find()
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      addons,
    });
  } catch (error) {
    console.error("Final Package addons GET error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve add-on services." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { response } = await requireFinalPackageAdmin();

    if (response) return response;

    await connectDB();

    const body = await request.json();

    const addonCode =
      typeof body.addonCode === "string"
        ? body.addonCode.trim().toUpperCase()
        : "";

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const category =
      typeof body.category === "string"
        ? body.category.trim()
        : "Other";

    const defaultPrice = Number(body.defaultPrice);
    const sortOrder = Number(body.sortOrder ?? 0);

    if (!addonCode || !name) {
      return NextResponse.json(
        {
          success: false,
          message: "Add-on code and name are required.",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(defaultPrice) || defaultPrice < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid add-on price.",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(sortOrder)) {
      return NextResponse.json(
        { success: false, message: "Invalid display order." },
        { status: 400 }
      );
    }

    const existingAddon = await FinalPackageAddon.findOne({
      addonCode,
    });

    if (existingAddon) {
      return NextResponse.json(
        { success: false, message: "This add-on code already exists." },
        { status: 409 }
      );
    }

    const addon = await FinalPackageAddon.create({
      addonCode,
      name,
      description,
      category,
      defaultPrice,
      isActive: body.isActive !== false,
      sortOrder,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Add-on service created successfully.",
        addon,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Final Package addons POST error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to create add-on service." },
      { status: 500 }
    );
  }
}
