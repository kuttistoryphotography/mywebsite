
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import QuotationProposal from "@/models/QuotationProposal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();

    if (!session?.email) {
      return NextResponse.json(
        { success: false, message: "Please log in to view this quotation." },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!id || !/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json(
        { success: false, message: "Quotation not found." },
        { status: 404 }
      );
    }

    await connectDB();

    const quotation = await QuotationProposal.findOne({
      _id: id,
      clientEmail: session.email.trim().toLowerCase(),
      status: "published",
    })
      .select("publicToken")
      .lean();

    if (!quotation?.publicToken) {
      return NextResponse.json(
        { success: false, message: "Quotation not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, token: quotation.publicToken },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("Client quotation access error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to open quotation." },
      { status: 500 }
    );
  }
}
