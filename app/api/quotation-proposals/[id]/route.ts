
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import QuotationProposal from "@/models/QuotationProposal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authorizeAdmin() {
  const session = await getCurrentUser();
  return Boolean(session && session.role === "admin");
}

// Revoke or restore a shared quotation link
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await authorizeAdmin())) {
      return NextResponse.json(
        { success: false, error: "Not authorized." },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid quotation ID." },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (!["revoke", "restore"].includes(body.action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action." },
        { status: 400 }
      );
    }

    await connectDB();

    const quotation = await QuotationProposal.findByIdAndUpdate(
      id,
      { $set: { linkRevoked: body.action === "revoke" } },
      { new: true, runValidators: true }
    ).select("_id linkRevoked");

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: "Quotation not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      linkRevoked: quotation.linkRevoked,
      message:
        body.action === "revoke"
          ? "Quotation link revoked."
          : "Quotation link restored.",
    });
  } catch (error) {
    console.error("Quotation link update error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to update quotation link." },
      { status: 500 }
    );
  }
}

// Permanently delete a quotation
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await authorizeAdmin())) {
      return NextResponse.json(
        { success: false, error: "Not authorized." },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid quotation ID." },
        { status: 400 }
      );
    }

    await connectDB();

    const quotation = await QuotationProposal.findByIdAndDelete(id);

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: "Quotation not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Quotation deleted successfully.",
    });
  } catch (error) {
    console.error("Quotation deletion error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to delete quotation." },
      { status: 500 }
    );
  }
}
