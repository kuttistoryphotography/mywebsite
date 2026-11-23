
import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";

import connectDB from "@/lib/db";
import FinalPackage from "@/models/FinalPackage";
import FinalPackageShare from "@/models/FinalPackageShare";
import { requireFinalPackageAdmin } from "@/lib/final-package/admin-auth";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: NextRequest,
  context: RouteContext
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

    const packageDocument = await FinalPackage.findById(id);

    if (!packageDocument) {
      return NextResponse.json(
        { success: false, message: "Package not found." },
        { status: 404 }
      );
    }

    if (
      packageDocument.status !== "published" &&
      packageDocument.status !== "confirmed"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Only published or confirmed packages can be shared.",
        },
        { status: 400 }
      );
    }

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
      // An empty request body means the link does not expire.
    }

    const rawToken = randomBytes(32).toString("base64url");

    const tokenHash = createHash("sha256")
      .update(rawToken)
      .digest("hex");

    await FinalPackageShare.create({
      packageId: packageDocument._id,
      tokenHash,
      status: "active",
      expiresAt,
      createdBy: user.userId,
    });

    const shareUrl = `${request.nextUrl.origin}/p/wedding/${rawToken}`;

    return NextResponse.json(
      {
        success: true,
        message: "Wedding package share link created successfully.",
        shareUrl,
        expiresAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create final package share link error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create the share link.",
      },
      { status: 500 }
    );
  }
}
