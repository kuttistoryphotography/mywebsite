
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/db";
import FinalPackageShare from "@/models/FinalPackageShare";
import { requireFinalPackageAdmin } from "@/lib/final-package/admin-auth";

export const dynamic = "force-dynamic";

// List all catalogue share links
export async function GET() {
  try {
    const { user, response } = await requireFinalPackageAdmin();

    if (response) return response;

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    await connectDB();

    const shares = await FinalPackageShare.find()
      .select("_id status expiresAt createdAt revokedAt")
      .sort({ createdAt: -1 })
      .lean();

    const shareHistory = shares.map((share) => ({
      id: share._id.toString(),
      status:
        share.status === "revoked"
          ? "revoked"
          : share.expiresAt &&
              new Date(share.expiresAt).getTime() <= Date.now()
            ? "expired"
            : "active",
      createdAt: share.createdAt,
      expiresAt: share.expiresAt,
      revokedAt: share.revokedAt,
    }));

    return NextResponse.json({
      success: true,
      shares: shareHistory,
      total: shareHistory.length,
    });
  } catch (error) {
    console.error("Catalogue share history error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load share history." },
      { status: 500 }
    );
  }
}

// Revoke an individual catalogue link
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { user, response } = await requireFinalPackageAdmin();

    if (response) return response;

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid share ID." },
        { status: 400 }
      );
    }

    const share = await FinalPackageShare.findById(id);

    if (!share) {
      return NextResponse.json(
        { success: false, message: "Share link not found." },
        { status: 404 }
      );
    }

    if (share.status === "revoked") {
      return NextResponse.json({
        success: true,
        message: "This link has already been revoked.",
      });
    }

    share.status = "revoked";
    share.revokedAt = new Date();

    await share.save();

    return NextResponse.json({
      success: true,
      message: "Catalogue share link revoked successfully.",
    });
  } catch (error) {
    console.error("Revoke catalogue share error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to revoke catalogue link." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { user, response } = await requireFinalPackageAdmin();

    if (response) return response;

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid share ID." },
        { status: 400 }
      );
    }

    const share = await FinalPackageShare.findById(id);

    if (!share) {
      return NextResponse.json(
        { success: false, message: "Share link not found." },
        { status: 404 }
      );
    }

    if (share.status === "revoked") {
      return NextResponse.json({
        success: true,
        message: "This link has already been revoked.",
      });
    }

    share.status = "revoked";
    share.revokedAt = new Date();

    await share.save();

    return NextResponse.json({
      success: true,
      message: "Catalogue share link revoked successfully.",
    });
  } catch (error) {
    console.error("Revoke catalogue share error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to revoke catalogue link." },
      { status: 500 }
    );
  }
}
