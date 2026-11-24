
import { NextRequest, NextResponse } from "next/server";
import { createDecipheriv } from "crypto";
import mongoose from "mongoose";

import connectDB from "@/lib/db";
import FinalPackageShare from "@/models/FinalPackageShare";
import { requireFinalPackageAdmin } from "@/lib/final-package/admin-auth";

export const dynamic = "force-dynamic";

function decryptToken(encryptedToken: string) {
  const keyHex = process.env.FINAL_PACKAGE_TOKEN_ENCRYPTION_KEY;

  if (!keyHex || !/^[a-fA-F0-9]{64}$/.test(keyHex)) {
    throw new Error("Invalid catalogue token encryption key.");
  }

  const [ivEncoded, tagEncoded, encryptedEncoded] =
    encryptedToken.split(".");

  if (!ivEncoded || !tagEncoded || !encryptedEncoded) {
    throw new Error("Invalid encrypted catalogue token.");
  }

  const key = Buffer.from(keyHex, "hex");
  const iv = Buffer.from(ivEncoded, "base64url");
  const authTag = Buffer.from(tagEncoded, "base64url");
  const encrypted = Buffer.from(encryptedEncoded, "base64url");

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
}

export async function GET(
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

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid share ID." },
        { status: 400 }
      );
    }

    await connectDB();

    const share = await FinalPackageShare.findById(id)
      .select("+tokenEncrypted");

    if (!share) {
      return NextResponse.json(
        { success: false, message: "Share link not found." },
        { status: 404 }
      );
    }

    if (share.status !== "active") {
      return NextResponse.json(
        { success: false, message: "This share link is not active." },
        { status: 410 }
      );
    }

    if (share.expiresAt && share.expiresAt.getTime() <= Date.now()) {
      return NextResponse.json(
        { success: false, message: "This share link has expired." },
        { status: 410 }
      );
    }

    if (!share.tokenEncrypted) {
      return NextResponse.json(
        {
          success: false,
          message: "This older link cannot be recovered. Generate a new link.",
        },
        { status: 410 }
      );
    }

    const rawToken = decryptToken(share.tokenEncrypted);
    const shareUrl = `${request.nextUrl.origin}/p/wedding/${rawToken}`;

    return NextResponse.json({
      success: true,
      shareUrl,
    });
  } catch (error) {
    console.error("Catalogue copy link error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve catalogue link." },
      { status: 500 }
    );
  }
}
