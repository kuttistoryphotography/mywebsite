
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import User from "@/models/User";
import FamilyFriendsLink from "@/models/FamilyFriendsLink";

export const runtime = "nodejs";

function validDriveUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      ["drive.google.com", "docs.google.com"].includes(url.hostname)
    );
  } catch {
    return false;
  }
}

async function requireAdmin() {
  const session = await getCurrentUser();
  return session?.role === "admin" ? session : null;
}

// GET: List all links, optionally filtered by client.
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Admin access required" }, { status: 401 });
    }

    await connectDB();

    const clientId = request.nextUrl.searchParams.get("clientId");
    const filter: Record<string, unknown> = {};

    if (clientId) {
      if (!mongoose.isValidObjectId(clientId)) {
        return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
      }
      filter.clientId = clientId;
    }

    const links = await FamilyFriendsLink.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const clientIds = [...new Set(links.map((link) => String(link.clientId)))];
    const clients = await User.find({ _id: { $in: clientIds } })
      .select("firstName lastName email")
      .lean();

    const clientMap = new Map(
      clients.map((client) => [
        String(client._id),
        {
          name: `${client.firstName || ""} ${client.lastName || ""}`.trim(),
          email: client.email,
        },
      ])
    );

    return NextResponse.json({
      links: links.map((link) => ({
        id: String(link._id),
        clientId: String(link.clientId),
        client: clientMap.get(String(link.clientId)) || null,
        recipientName: link.recipientName,
        driveUrl: link.driveUrl,
        token: link.token,
        status: link.status,
        createdAt: link.createdAt,
        revokedAt: link.revokedAt || null,
      })),
    });
  } catch (error) {
    console.error("Family friends links GET error:", error);
    return NextResponse.json({ error: "Failed to load links" }, { status: 500 });
  }
}

// POST: Create a unique link for one recipient.
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Admin access required" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const clientId = String(body.clientId || "");
    const recipientName = String(body.recipientName || "").trim();
    const driveUrl = String(body.driveUrl || "").trim();

    if (!mongoose.isValidObjectId(clientId)) {
      return NextResponse.json({ error: "Select a valid client" }, { status: 400 });
    }

    if (!recipientName || recipientName.length > 100) {
      return NextResponse.json(
        { error: "Recipient name is required (maximum 100 characters)" },
        { status: 400 }
      );
    }

    if (!validDriveUrl(driveUrl)) {
      return NextResponse.json(
        { error: "Enter a valid HTTPS Google Drive or Google Docs URL" },
        { status: 400 }
      );
    }

    const client = await User.findById(clientId).select("_id role");
    if (!client || client.role !== "client") {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const token = randomBytes(32).toString("hex");

    const link = await FamilyFriendsLink.create({
      clientId: client._id,
      recipientName,
      driveUrl,
      token,
      status: "active",
    });

    const origin = request.nextUrl.origin;

    return NextResponse.json(
      {
        success: true,
        link: {
          id: String(link._id),
          recipientName: link.recipientName,
          token: link.token,
          status: link.status,
          url: `${origin}/family-memories/${link.token}`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Family friends links POST error:", error);
    return NextResponse.json({ error: "Failed to create link" }, { status: 500 });
  }
}

// PATCH: Revoke one link without affecting other links.
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Admin access required" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const id = String(body.id || "");

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid link ID" }, { status: 400 });
    }

    const link = await FamilyFriendsLink.findByIdAndUpdate(
      id,
      { $set: { status: "revoked", revokedAt: new Date() } },
      { new: true }
    );

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Link revoked",
      id: String(link._id),
      status: link.status,
    });
  } catch (error) {
    console.error("Family friends links PATCH error:", error);
    return NextResponse.json({ error: "Failed to revoke link" }, { status: 500 });
  }
}
