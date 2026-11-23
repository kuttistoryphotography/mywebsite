
import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";

import connectDB from "@/lib/db";
import FinalPackageShare from "@/models/FinalPackageShare";
import { requireFinalPackageAdmin } from "@/lib/final-package/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
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

    let expiresAt: Date | null = null;

    try {
      const body = await request.json();

      if (body?.expiresAt) {
        const parsedDate = new Date(body.expiresAt);

        if (Number.isNaN(parsedDate.getTime())) {
          return NextResponse.json(
            { success: false, message: "Invalid expiry date." },
            { status: 400 }
          );
        }

        if (parsedDate.getTime() <= Date.now()) {
          return NextResponse.json(
            { success: false, message: "Expiry date must be in the future." },
            { status: 400 }
          );
        }

        expiresAt = parsedDate;
      }
    } catch {
      // No expiry date means the link does not expire.
    }

    const rawToken = randomBytes(32).toString("base64url");

    const tokenHash = createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const createdShare = await FinalPackageShare.create({
        tokenHash,
        status: "active",
        expiresAt,
        createdBy: user.userId,
    });

    const shareUrl = `${request.nextUrl.origin}/p/wedding/${rawToken}`;

    return NextResponse.json(
      {
        success: true,
        message: "Complete wedding catalogue link created.",
        shareId: createdShare._id.toString(),
        shareUrl,
        expiresAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Catalogue share creation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create catalogue share link.",
      },
      { status: 500 }
    );
  }
}
