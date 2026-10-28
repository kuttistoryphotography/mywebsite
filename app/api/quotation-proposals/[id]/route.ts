
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

function calculateTotals(
  events: any[],
  discount: number,
  gstRate: number = 0,
  additionalDiscountPercent: number = 0
) {
  const subtotal = events.reduce(
    (sum, event) =>
      sum +
      (event.services || []).reduce(
        (eventSum: number, service: any) =>
          eventSum +
          Math.max(0, Number(service.quantity) || 0) *
            Math.max(
              0,
              Number(service.unitPrice ?? service.price) || 0
            ),
        0
      ),
    0
  );

  const fixedDiscount = Math.min(
    subtotal,
    Math.max(0, Number(discount) || 0)
  );

  const safeDiscountPercent = Math.min(
    100,
    Math.max(0, Number(additionalDiscountPercent) || 0)
  );

  const additionalDiscountAmount = Math.round(
    ((subtotal - fixedDiscount) * safeDiscountPercent) / 100
  );

  const taxableAmount = Math.max(
    0,
    subtotal - fixedDiscount - additionalDiscountAmount
  );

  const safeGstRate = Math.min(
    100,
    Math.max(0, Number(gstRate) || 0)
  );

  const gstAmount = Math.round(
    (taxableAmount * safeGstRate) / 100
  );

  return {
    subtotal,
    discount: fixedDiscount,
    gstRate: safeGstRate,
    gstAmount,
    additionalDiscountPercent: safeDiscountPercent,
    additionalDiscountAmount,
    totalAmount: taxableAmount + gstAmount,
  };
}

// Update an existing quotation, revoke a link, or restore a link.
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

    let body: any;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    await connectDB();

    // Preserve existing revoke and restore behavior.
    if (body.action === "revoke" || body.action === "restore") {
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
    }

    // All other PATCH requests must explicitly request editing.
    if (body.action !== "edit") {
      return NextResponse.json(
        { success: false, error: "Invalid quotation update action." },
        { status: 400 }
      );
    }

    const clientName =
      typeof body.clientName === "string" ? body.clientName.trim() : "";

    const clientEmail =
      typeof body.clientEmail === "string"
        ? body.clientEmail.trim().toLowerCase()
        : "";

    const clientPhone =
      typeof body.clientPhone === "string"
        ? body.clientPhone.trim()
        : "";

    const title = typeof body.title === "string" ? body.title.trim() : "";

    if (
      !clientName ||
      !title ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Enter a valid client name, email, and quotation title.",
        },
        { status: 400 }
      );
    }

    if (
      clientName.length > 200 ||
      clientEmail.length > 254 ||
      clientPhone.length > 50 ||
      title.length > 200
    ) {
      return NextResponse.json(
        { success: false, error: "One or more fields are too long." },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(body.events) ||
      body.events.length === 0 ||
      body.events.length > 30
    ) {
      return NextResponse.json(
        { success: false, error: "Add between 1 and 30 events." },
        { status: 400 }
      );
    }

    const events = body.events.map((event: any) => {
      if (
        !event ||
        typeof event.eventName !== "string" ||
        !event.eventName.trim() ||
        event.eventName.length > 200 ||
        !Array.isArray(event.services) ||
        event.services.length === 0 ||
        event.services.length > 100
      ) {
        throw new Error(
          "Each event needs a name and between 1 and 100 services."
        );
      }

      if (
        event.eventDate &&
        Number.isNaN(Date.parse(event.eventDate))
      ) {
        throw new Error("An event has an invalid date.");
      }

      const services = event.services.map((service: any) => {
        const name =
          typeof service.name === "string" ? service.name.trim() : "";

        const quantity = Number(service.quantity);
        const unitPrice = Number(service.unitPrice);

        if (
          !name ||
          name.length > 200 ||
          !Number.isInteger(quantity) ||
          quantity < 1 ||
          quantity > 10000 ||
          !Number.isFinite(unitPrice) ||
          unitPrice < 0 ||
          unitPrice > 1_000_000_000
        ) {
          throw new Error("One or more service items have invalid values.");
        }

        return {
          name,
          description:
            typeof service.description === "string"
              ? service.description.trim().slice(0, 2000)
              : "",
          quantity,
          unitPrice,
          total: quantity * unitPrice,
        };
      });

      return {
        eventName: event.eventName.trim().slice(0, 200),
        eventDate: event.eventDate
          ? new Date(event.eventDate)
          : undefined,
        venue:
          typeof event.venue === "string"
            ? event.venue.trim().slice(0, 500)
            : "",
        services,
      };
    });

    const discount = Number(body.discount ?? 0);

    if (
      !Number.isFinite(discount) ||
      discount < 0 ||
      discount > 1_000_000_000
    ) {
      return NextResponse.json(
        { success: false, error: "Enter a valid discount amount." },
        { status: 400 }
      );
    }

    const gstRate = Number(body.gstRate ?? 0);

    const additionalDiscountPercent = Number(
      body.additionalDiscountPercent ?? 0
    );

    if (
      !Number.isFinite(gstRate) ||
      gstRate < 0 ||
      gstRate > 100 ||
      !Number.isFinite(additionalDiscountPercent) ||
      additionalDiscountPercent < 0 ||
      additionalDiscountPercent > 100
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid GST or discount percentage." },
        { status: 400 }
      );
    }

    const totals = calculateTotals(
      events,
      discount,
      gstRate,
      additionalDiscountPercent
    );

    if (discount > totals.subtotal) {
      return NextResponse.json(
        { success: false, error: "Discount cannot exceed the subtotal." },
        { status: 400 }
      );
    }

    const paymentTerms = Array.isArray(body.paymentTerms)
      ? body.paymentTerms.slice(0, 20).map((term: any) => {
          const percentage =
            term.percentage === "" || term.percentage == null
              ? undefined
              : Number(term.percentage);

          const amount =
            term.amount === "" || term.amount == null
              ? undefined
              : Number(term.amount);

          if (
            (percentage !== undefined &&
              (!Number.isFinite(percentage) ||
                percentage < 0 ||
                percentage > 100)) ||
            (amount !== undefined &&
              (!Number.isFinite(amount) || amount < 0))
          ) {
            throw new Error("A payment term has an invalid amount.");
          }

          if (
            term.dueDate &&
            Number.isNaN(Date.parse(term.dueDate))
          ) {
            throw new Error("A payment term has an invalid due date.");
          }

          return {
            label:
              typeof term.label === "string"
                ? term.label.trim().slice(0, 200)
                : "",
            percentage,
            amount,
            dueDate: term.dueDate
              ? new Date(term.dueDate)
              : undefined,
          };
        })
      : [];

    const termsAndConditions = Array.isArray(body.termsAndConditions)
      ? body.termsAndConditions
          .filter((item: unknown) => typeof item === "string")
          .slice(0, 100)
          .map((item: string) => item.trim().slice(0, 2000))
      : [];

    const deliverables = Array.isArray(body.deliverables)
      ? body.deliverables
          .filter((item: unknown) => typeof item === "string")
          .slice(0, 100)
          .map((item: string) => item.trim().slice(0, 500))
      : [];

    if (
      body.pageDesign !== undefined &&
      (!body.pageDesign ||
        typeof body.pageDesign !== "object" ||
        Array.isArray(body.pageDesign))
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid quotation page design." },
        { status: 400 }
      );
    }

    const update: Record<string, unknown> = {
      clientName: clientName.slice(0, 200),
      clientEmail,
      clientPhone: clientPhone.slice(0, 50),
      title: title.slice(0, 200),
      introduction:
        typeof body.introduction === "string"
          ? body.introduction.trim().slice(0, 5000)
          : "",
      events,
      deliverables,
      ...totals,
      paymentTerms,
      termsAndConditions,
      validityDate:
        body.validityDate &&
        !Number.isNaN(Date.parse(body.validityDate))
          ? new Date(body.validityDate)
          : undefined,
      status: body.status === "published" ? "published" : "draft",
    };

    // Only replace pageDesign when the builder supplies it.
    // Keep the entire nested gallery categories/photos payload intact.
    if (body.pageDesign !== undefined) {
      update.pageDesign = body.pageDesign;
    }

    // Do not modify publicToken, quoteNumber, createdBy, or linkRevoked.
    const quotation = await QuotationProposal.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    ).select("+publicToken");

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: "Quotation not found." },
        { status: 404 }
      );
    }

    const clientUrl = quotation.publicToken
      ? `${request.nextUrl.origin}/quotation/${quotation.publicToken}`
      : null;

    return NextResponse.json({
      success: true,
      message: "Quotation updated successfully.",
      proposal: {
        id: String(quotation._id),
        quoteNumber: quotation.quoteNumber,
        status: quotation.status,
        clientUrl:
          quotation.status === "published" ? clientUrl : null,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update quotation.";

    console.error("Quotation PATCH error:", error);

    const validationErrors = [
      "Each event needs a name",
      "An event has an invalid date",
      "One or more service items have invalid values",
      "A payment term has an invalid amount",
      "A payment term has an invalid due date",
    ];

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: validationErrors.some((item) => message.includes(item))
          ? 400
          : 500,
      }
    );
  }
}

// Permanently delete a quotation.
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


export async function GET(
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

    const quotation = await QuotationProposal.findById(id)
      .select("+publicToken")
      .lean();

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: "Quotation not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      proposal: {
        ...quotation,
        id: String(quotation._id),
        clientUrl: `${_request.nextUrl.origin}/quotation/${quotation.publicToken}`,
      },
    });
  } catch (error) {
    console.error("Quotation GET error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to load quotation." },
      { status: 500 }
    );
  }
}
