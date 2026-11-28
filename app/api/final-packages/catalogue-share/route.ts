
import { NextRequest, NextResponse } from "next/server";
import {
  randomBytes,
  createHash,
  createCipheriv,
} from "crypto";

import connectDB from "@/lib/db";
import FinalPackageShare from "@/models/FinalPackageShare";
import { requireFinalPackageAdmin } from "@/lib/final-package/admin-auth";
import FinalPackageSettings from "@/models/FinalPackageSettings";

export const dynamic = "force-dynamic";

function encryptToken(token: string) {
  const keyHex = process.env.FINAL_PACKAGE_TOKEN_ENCRYPTION_KEY;

  if (!keyHex || !/^[a-fA-F0-9]{64}$/.test(keyHex)) {
    throw new Error("Invalid catalogue token encryption key.");
  }

  const key = Buffer.from(keyHex, "hex");
  const iv = randomBytes(12);

  const cipher = createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

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
      let body: Record<string, unknown> = {};

      try {
        body = await request.json();
      } catch {
        // Empty request body is allowed.
      }

      if (body.expiresAt) {
        const parsedDate = new Date(String(body.expiresAt));

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

      const eventType =
        body.eventType === "engagement"
          ? "engagement"
          : body.eventType === "reception"
            ? "reception"
            : "wedding";

      const currentSettings = await FinalPackageSettings.findOne().lean();

      const layout =
        body.layout &&
        typeof body.layout === "object" &&
        !Array.isArray(body.layout)
          ? body.layout
          : currentSettings?.layout || null;

    const rawToken = randomBytes(32).toString("base64url");

    const tokenHash = createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const tokenEncrypted = encryptToken(rawToken);

    const createdShare = await FinalPackageShare.create({
      tokenHash,
      tokenEncrypted,
      status: "active",
      expiresAt,
      createdBy: user.userId,
      eventType,
      layout,
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
