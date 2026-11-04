// app/api/cloudinary-files/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { CloudinaryFile } from "@/models/CloudinaryFile";
import { getCurrentUser } from "@/lib/auth";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { deleteFromBlogCloudinary } from "@/lib/blog-cloudinary";

export const dynamic = "force-dynamic";

/**
 * GET — List Cloudinary files
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const context = searchParams.get("context");
    const search = searchParams.get("search") || "";
    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") || 50), 1),
      100
    );

    const filter: Record<string, any> = {};

    if (context && context !== "all") {
      filter.context = context;
    }

    if (search.trim()) {
      filter.$or = [
        { originalName: { $regex: search.trim(), $options: "i" } },
        { publicId: { $regex: search.trim(), $options: "i" } },
        { folderName: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [files, total] = await Promise.all([
      CloudinaryFile.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CloudinaryFile.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      files,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[Cloudinary Files GET]", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch Cloudinary files" },
      { status: 500 }
    );
  }
}

/**
 * DELETE — Delete Cloudinary file and MongoDB record
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const id = body.id;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "File ID is required" },
        { status: 400 }
      );
    }

    const doc = await CloudinaryFile.findById(id);

    if (!doc) {
      return NextResponse.json(
        { success: false, message: "File not found" },
        { status: 404 }
      );
    }

    if (doc.publicId) {
      const blogCloudName = process.env.BLOG_CLOUDINARY_CLOUD_NAME;

      const isBlogCloudinary =
        !!blogCloudName &&
        typeof doc.url === "string" &&
        doc.url.includes(`res.cloudinary.com/${blogCloudName}/`);

      if (isBlogCloudinary) {
        await deleteFromBlogCloudinary(
          doc.publicId,
          doc.resourceType as "image" | "video" | "raw"
        );
      } else {
        await deleteFromCloudinary(
          doc.publicId,
          doc.resourceType as "image" | "video" | "raw"
        );
      }
    }

    await CloudinaryFile.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("[Cloudinary Files DELETE]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete Cloudinary file",
      },
      { status: 500 }
    );
  }
}