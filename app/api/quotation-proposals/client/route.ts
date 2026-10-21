
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import QuotationProposal from "@/models/QuotationProposal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentUser();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please log in to view your quotations." },
        { status: 401 }
      );
    }

    if (!session.email) {
      return NextResponse.json(
        { success: false, message: "Your account email is unavailable." },
        { status: 400 }
      );
    }

    await connectDB();

    const clientEmail = session.email.trim().toLowerCase();

    const quotations = await QuotationProposal.find({
      clientEmail,
      status: "published",
    })
      .select("_id quoteNumber title totalAmount createdAt validityDate")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      quotations: quotations.map((quotation) => ({
        id: String(quotation._id),
        quoteNumber: quotation.quoteNumber,
        title: quotation.title,
        totalAmount: quotation.totalAmount,
        createdAt: quotation.createdAt,
        validityDate: quotation.validityDate ?? null,
        publicToken: null,
      })),
    });
  } catch (error) {
    console.error("Client quotations API error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load quotations." },
      { status: 500 }
    );
  }
}
