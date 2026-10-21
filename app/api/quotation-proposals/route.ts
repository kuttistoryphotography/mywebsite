
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import QuotationProposal from "@/models/QuotationProposal";

export const runtime = "nodejs";

function isAdmin(session: Awaited<ReturnType<typeof getCurrentUser>>) {
  return Boolean(session && session.role === "admin");
}

function calculateTotals(events: any[], discount: number) {
  const subtotal = events.reduce(
    (sum, event) =>
      sum +
      (event.services || []).reduce(
        (eventSum: number, service: any) =>
          eventSum + Number(service.quantity) * Number(service.unitPrice),
        0
      ),
    0
  );

  return {
    subtotal,
    discount,
    totalAmount: Math.max(0, subtotal - discount),
  };
}

export async function GET() {
  try {
    const session = await getCurrentUser();

    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await connectDB();

    const proposals = await QuotationProposal.find()
      .sort({ createdAt: -1 })
      .select("-publicToken")
      .lean();

    return NextResponse.json({ proposals });
  } catch (error) {
    console.error("Quotation proposal GET error:", error);
    return NextResponse.json(
      { error: "Failed to load quotations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();

    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();

    const clientName =
      typeof body.clientName === "string" ? body.clientName.trim() : "";
    const clientEmail =
      typeof body.clientEmail === "string"
        ? body.clientEmail.trim().toLowerCase()
        : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";

    if (!clientName || !clientEmail || !title) {
      return NextResponse.json(
        { error: "Client name, email, and quotation title are required." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      return NextResponse.json(
        { error: "Enter a valid client email address." },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(body.events) ||
      body.events.length === 0 ||
      body.events.length > 30
    ) {
      return NextResponse.json(
        { error: "Add between 1 and 30 events." },
        { status: 400 }
      );
    }

    const events = body.events.map((event: any) => {
      if (
        typeof event.eventName !== "string" ||
        !event.eventName.trim() ||
        !Array.isArray(event.services) ||
        event.services.length === 0
      ) {
        throw new Error("Each event needs a name and at least one service.");
      }

      const services = event.services.map((service: any) => {
        const name =
          typeof service.name === "string" ? service.name.trim() : "";
        const quantity = Number(service.quantity);
        const unitPrice = Number(service.unitPrice);

        if (
          !name ||
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

      const eventDate =
        event.eventDate && !Number.isNaN(Date.parse(event.eventDate))
          ? new Date(event.eventDate)
          : undefined;

      return {
        eventName: event.eventName.trim().slice(0, 200),
        eventDate,
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
        { error: "Enter a valid discount amount." },
        { status: 400 }
      );
    }

    const totals = calculateTotals(events, discount);

    if (discount > totals.subtotal) {
      return NextResponse.json(
        { error: "Discount cannot exceed the subtotal." },
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

          return {
            label:
              typeof term.label === "string"
                ? term.label.trim().slice(0, 200)
                : "",
            percentage,
            amount,
            dueDate:
              term.dueDate && !Number.isNaN(Date.parse(term.dueDate))
                ? new Date(term.dueDate)
                : undefined,
          };
        })
      : [];

    const status = body.status === "published" ? "published" : "draft";

    const quoteNumber = `KSQ-${new Date().getFullYear()}-${randomBytes(4)
      .toString("hex")
      .toUpperCase()}`;

    const publicToken = randomBytes(32).toString("hex");

    const proposal = await QuotationProposal.create({
      quoteNumber,
      publicToken,
      clientName: clientName.slice(0, 200),
      clientEmail,
      clientPhone:
        typeof body.clientPhone === "string"
          ? body.clientPhone.trim().slice(0, 50)
          : "",
      title: title.slice(0, 200),
      introduction:
        typeof body.introduction === "string"
          ? body.introduction.trim().slice(0, 5000)
          : "",
      events,
      deliverables: Array.isArray(body.deliverables)
        ? body.deliverables
            .filter((item: unknown) => typeof item === "string")
            .slice(0, 100)
            .map((item: string) => item.trim().slice(0, 500))
        : [],
      ...totals,
      paymentTerms,
      termsAndConditions: Array.isArray(body.termsAndConditions)
        ? body.termsAndConditions
            .filter((item: unknown) => typeof item === "string")
            .slice(0, 100)
            .map((item: string) => item.trim().slice(0, 2000))
        : [],
      validityDate:
        body.validityDate && !Number.isNaN(Date.parse(body.validityDate))
          ? new Date(body.validityDate)
          : undefined,
      status,
      createdBy: new mongoose.Types.ObjectId(session!.userId),
    });

    const origin = request.nextUrl.origin;
    const clientUrl = `${origin}/quotation/${publicToken}`;

    return NextResponse.json(
      {
        success: true,
        proposal: {
          id: String(proposal._id),
          quoteNumber: proposal.quoteNumber,
          status: proposal.status,
          clientUrl: status === "published" ? clientUrl : null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      !error.message.includes("duplicate key")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Quotation proposal POST error:", error);
    return NextResponse.json(
      { error: "Failed to create quotation" },
      { status: 500 }
    );
  }
}
