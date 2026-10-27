
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import QuotationProposal from "@/models/QuotationProposal";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.json(
        { success: false, message: "Quotation not found." },
        { status: 404 }
      );
    }

    await connectDB();

    const quotation = await QuotationProposal.findOne({
      publicToken: token,
      status: "published",
      linkRevoked: { $ne: true },
    })
      .select("-publicToken -createdBy -__v")
      .lean();

    if (!quotation) {
      return NextResponse.json(
        { success: false, message: "Quotation not found or no longer available." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, quotation },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Public quotation GET error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load quotation right now." },
      { status: 500 }
    );
  }
}
