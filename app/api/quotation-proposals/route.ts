
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import QuotationProposal from "@/models/QuotationProposal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAdmin(
  session: Awaited<ReturnType<typeof getCurrentUser>>
) {
  return Boolean(session && session.role === "admin");
}


function createDefaultPageDesign() {
  return {
    brandName: "Kutti Story Photography",
    tagline: "Capturing Life, One Story at a Time.",
    logoUrl: "",
    backgroundColor: "#f5f1e9",
    accentColor: "#c6a66b",
    textColor: "#242424",
    fontFamily: "serif",
    sections: [
      {
        id: "hero",
        type: "hero",
        visible: true,
        title: "Your Wedding Story",
        subtitle: "A timeless celebration of your love",
        body: "Every beautiful beginning deserves to be remembered.",
        layout: "cover",
        backgroundColor: "#242424",
        textColor: "#ffffff",
        images: [],
      },
      {
        id: "story",
        type: "story",
        visible: true,
        title: "Your Story, Beautifully Told",
        subtitle: "A celebration of your journey",
        body: "We believe every wedding has a unique story. Our team captures the emotions, traditions and little moments that make your celebration unforgettable.",
        layout: "centered",
        backgroundColor: "#f5f1e9",
        textColor: "#242424",
        images: [],
      },
      {
        id: "gallery",
        type: "gallery",
        visible: true,
        title: "Stories Through Our Lens",
        subtitle: "A glimpse into our visual storytelling",
        body: "",
        layout: "masonry",
        backgroundColor: "#ffffff",
        textColor: "#242424",
        images: [],
      },
      {
        id: "events",
        type: "event",
        visible: true,
        title: "Your Wedding Celebrations",
        subtitle: "Every moment, thoughtfully captured",
        body: "",
        layout: "cards",
        backgroundColor: "#f5f1e9",
        textColor: "#242424",
        images: [],
      },
      {
        id: "services",
        type: "services",
        visible: true,
        title: "Photography & Cinematic Films",
        subtitle: "Coverage tailored to your celebration",
        body: "",
        layout: "cards",
        backgroundColor: "#ffffff",
        textColor: "#242424",
        images: [],
      },
      {
        id: "deliverables",
        type: "deliverables",
        visible: true,
        title: "Your Memories, Preserved",
        subtitle: "The final collection you'll receive",
        body: "",
        layout: "grid",
        backgroundColor: "#f5f1e9",
        textColor: "#242424",
        images: [],
      },
      {
        id: "pricing",
        type: "pricing",
        visible: true,
        title: "Your Investment",
        subtitle: "A clear overview of your collection",
        body: "",
        layout: "premium-card",
        backgroundColor: "#242424",
        textColor: "#ffffff",
        images: [],
      },
      {
        id: "payment",
        type: "custom",
        visible: true,
        title: "Your Celebration, Our Commitment",
        subtitle: "Thank You for Choosing Kutti Story Photography",
        body: "",
        layout: "centered",
        backgroundColor: "#ffffff",
        textColor: "#242424",
        images: [],
      },
      {
        id: "terms",
        type: "terms",
        visible: true,
        title: "Booking Details",
        subtitle: "Important information about your proposal",
        body: "",
        layout: "default",
        backgroundColor: "#f5f1e9",
        textColor: "#242424",
        images: [],
      },
      {
        id: "closing",
        type: "closing",
        visible: true,
        title: "Let's Tell Your Story",
        subtitle: "We would love to be part of your celebration",
        body: "Thank you for considering Kutti Story Photography. We look forward to preserving your most meaningful moments.",
        layout: "centered",
        backgroundColor: "#242424",
        textColor: "#ffffff",
        images: [],
      },
    ],
  };
}

function calculateTotals(
  events: any[],
  discount: number,
  gstRate: number = 0,
  additionalDiscountPercent: number = 0
) {
  const subtotal = events.reduce(
    (eventTotal, event) =>
      eventTotal +
      (event.services || []).reduce(
        (serviceTotal: number, service: any) =>
          serviceTotal +
          Math.max(0, Number(service.quantity) || 0) *
            Math.max(
              0,
              Number(service.unitPrice ?? service.price) || 0
            ),
        0
      ),
    0
  );

  // Existing fixed discount in rupees
  const fixedDiscount = Math.min(
    subtotal,
    Math.max(0, Number(discount) || 0)
  );

  // Additional percentage discount after fixed discount
  const safeDiscountPercent = Math.min(
    100,
    Math.max(0, Number(additionalDiscountPercent) || 0)
  );

  const additionalDiscountAmount = Math.round(
    ((subtotal - fixedDiscount) * safeDiscountPercent) / 100
  );

  // GST is calculated on the amount after both discounts
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

  const totalAmount = taxableAmount + gstAmount;

  return {
    subtotal,
    discount: fixedDiscount,
    gstRate: safeGstRate,
    gstAmount,
    additionalDiscountPercent: safeDiscountPercent,
    additionalDiscountAmount,
    totalAmount,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();

    if (!isAdmin(session)) {
      return NextResponse.json(
        { success: false, error: "Not authorized." },
        { status: 403 }
      );
    }

    await connectDB();

    const proposals = await QuotationProposal.find()
      .sort({ createdAt: -1 })
      .select("+publicToken")
      .lean();

    const baseUrl = request.nextUrl.origin;

    const links = proposals.map((proposal: any) => ({
      id: String(proposal._id),
      quoteNumber: proposal.quoteNumber,
      clientName: proposal.clientName,
      clientEmail: proposal.clientEmail,
      title: proposal.title,
      status: proposal.status,
      linkRevoked: proposal.linkRevoked === true,
      createdAt: proposal.createdAt,
      updatedAt: proposal.updatedAt,
      clientUrl: proposal.publicToken
        ? `${baseUrl}/quotation/${proposal.publicToken}`
        : null,
    }));

    return NextResponse.json(
      { success: true, proposals: links, total: links.length },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Quotation proposal GET error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to load quotations." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();

    if (!isAdmin(session)) {
      return NextResponse.json(
        { success: false, error: "Not authorized." },
        { status: 403 }
      );
    }

    if (!session?.userId || !mongoose.isValidObjectId(session.userId)) {
      return NextResponse.json(
        { success: false, error: "Invalid admin session." },
        { status: 401 }
      );
    }

    await connectDB();

    let body: any;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body." },
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

    if (!clientName || !clientEmail || !title) {
      return NextResponse.json(
        {
          success: false,
          error: "Client name, email, and quotation title are required.",
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

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      return NextResponse.json(
        { success: false, error: "Enter a valid client email address." },
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
          throw new Error(
            "One or more service items have invalid values."
          );
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
      gstRate > 100
    ) {
      return NextResponse.json(
        { success: false, error: "Enter a valid GST percentage." },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(additionalDiscountPercent) ||
      additionalDiscountPercent < 0 ||
      additionalDiscountPercent > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Enter a valid additional discount percentage.",
        },
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
        {
          success: false,
          error: "Discount cannot exceed the subtotal.",
        },
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
      clientPhone: clientPhone.slice(0, 50),
      title: title.slice(0, 200),
      
      // GST registration number
      gstin:
        typeof body.gstin === "string"
          ? body.gstin.trim().slice(0, 50)
          : "",

      introduction:
        typeof body.introduction === "string"
          ? body.introduction.trim().slice(0, 5000)
          : "",
      pageDesign: {
        ...createDefaultPageDesign(),
        ...(body.pageDesign ?? {}),
        sections:
            Array.isArray(body.pageDesign?.sections) &&
            body.pageDesign.sections.length > 0
            ? body.pageDesign.sections
            : createDefaultPageDesign().sections,
        },
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
        body.validityDate &&
        !Number.isNaN(Date.parse(body.validityDate))
          ? new Date(body.validityDate)
          : undefined,
      status,
      createdBy: new mongoose.Types.ObjectId(session.userId),
    });

    const clientUrl = `${request.nextUrl.origin}/quotation/${publicToken}`;

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
    const message =
      error instanceof Error ? error.message : "Failed to create quotation.";

    const validationErrors = [
      "Each event needs a name",
      "An event has an invalid date",
      "One or more service items have invalid values",
      "A payment term has an invalid amount",
      "A payment term has an invalid due date",
    ];

    if (
      error instanceof Error &&
      validationErrors.some((item) => message.includes(item))
    ) {
      return NextResponse.json(
        { success: false, error: message },
        { status: 400 }
      );
    }

    console.error("Quotation proposal POST error:", error);

    if (
      error instanceof Error &&
      message.toLowerCase().includes("duplicate key")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "A duplicate quotation number was generated. Please retry.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create quotation." },
      { status: 500 }
    );
  }
}
