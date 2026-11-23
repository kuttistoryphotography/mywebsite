
import crypto from "crypto";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/db";
import FinalPackage from "@/models/FinalPackage";
import FinalPackageTemplate from "@/models/FinalPackageTemplate";
import FinalPackageAddon from "@/models/FinalPackageAddon";
import FinalPackageSettings from "@/models/FinalPackageSettings";
import FinalPackageEventLog from "@/models/FinalPackageEventLog";
import { requireFinalPackageAdmin } from "@/lib/final-package/admin-auth";

// --------------------------------------------------
// TYPES AND HELPERS
// --------------------------------------------------

type DataObject = Record<string, unknown>;

type AddonMaster = {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  defaultPrice: number;
  isActive: boolean;
};

type PackageAddonInput = {
  addonId?: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  status: "included" | "selected" | "optional";
};

function createPackageNumber(): string {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();

  return `KSP-${year}-${random}`;
}

function validText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validNumber(value: unknown, minimum = 0): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= minimum
  );
}

function isObject(value: unknown): value is DataObject {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// --------------------------------------------------
// GET - LIST FINAL PACKAGES
// --------------------------------------------------

export async function GET() {
  try {
    const { response } = await requireFinalPackageAdmin();

    if (response) return response;

    await connectDB();

    const packages = await FinalPackage.find()
      .sort({ createdAt: -1 })
      .select("-publicToken")
      .lean();

    return NextResponse.json({
      success: true,
      packages,
    });
  } catch (error) {
    console.error("Final Package GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve final packages.",
      },
      { status: 500 }
    );
  }
}

// --------------------------------------------------
// POST - CREATE FINAL PACKAGE
// --------------------------------------------------

export async function POST(request: NextRequest) {
  let createdPackageId: mongoose.Types.ObjectId | null = null;

  try {
    // --------------------------------------------------
    // ADMIN AUTHENTICATION
    // --------------------------------------------------

    const { user, response } = await requireFinalPackageAdmin();

    if (response) return response;

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Administrator authentication required.",
        },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(user.userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid administrator account.",
        },
        { status: 401 }
      );
    }

    await connectDB();

    // --------------------------------------------------
    // REQUEST VALIDATION
    // --------------------------------------------------

    const rawBody: unknown = await request.json();

    if (!isObject(rawBody)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid package information.",
        },
        { status: 400 }
      );
    }

    const body = rawBody;

    // --------------------------------------------------
    // CLIENT DETAILS
    // --------------------------------------------------

    if (!isObject(body.client)) {
      return NextResponse.json(
        {
          success: false,
          message: "Client information is required.",
        },
        { status: 400 }
      );
    }

    const client = body.client;

    if (!validText(client.name) || !validText(client.phone)) {
      return NextResponse.json(
        {
          success: false,
          message: "Client name and phone number are required.",
        },
        { status: 400 }
      );
    }

    if (
      client.email !== undefined &&
      typeof client.email !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid client email.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // EVENT DETAILS
    // --------------------------------------------------

    const event = isObject(body.eventDetails)
      ? body.eventDetails
      : {};

    let eventDate: Date | undefined;

    if (event.eventDate) {
      eventDate = new Date(String(event.eventDate));

      if (Number.isNaN(eventDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid event date.",
          },
          { status: 400 }
        );
      }
    }

    // --------------------------------------------------
    // PACKAGE SOURCE
    // --------------------------------------------------

    const sourceType = body.sourceType;

    if (sourceType !== "template" && sourceType !== "manual") {
      return NextResponse.json(
        {
          success: false,
          message: "Package source must be template or manual.",
        },
        { status: 400 }
      );
    }

    let packageDetails: {
      sourceType: "template" | "manual";
      templateId?: mongoose.Types.ObjectId;
      packageName: string;
      description: string;
      services: {
        name: string;
        description: string;
        quantity: number;
      }[];
      deliverables: {
        name: string;
        description: string;
        quantity: number;
      }[];
    };

    let basePrice = 0;

    // --------------------------------------------------
    // TEMPLATE-BASED PACKAGE
    // --------------------------------------------------

    if (sourceType === "template") {
      if (
        typeof body.templateId !== "string" ||
        !mongoose.Types.ObjectId.isValid(body.templateId)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Valid template ID is required.",
          },
          { status: 400 }
        );
      }

      const template = await FinalPackageTemplate.findOne({
        _id: body.templateId,
        isActive: true,
      }).lean();

      if (!template) {
        return NextResponse.json(
          {
            success: false,
            message: "Active package template not found.",
          },
          { status: 404 }
        );
      }

      basePrice = template.basePrice;

      packageDetails = {
        sourceType: "template",
        templateId: template._id,
        packageName: template.packageName,
        description: template.description || "",

        services: (template.services || []).map(
          (item: {
            name: string;
            description?: string;
            quantity?: number;
          }) => ({
            name: item.name,
            description: item.description || "",
            quantity: item.quantity ?? 1,
          })
        ),

        deliverables: (template.deliverables || []).map(
          (item: {
            name: string;
            description?: string;
            quantity?: number;
          }) => ({
            name: item.name,
            description: item.description || "",
            quantity: item.quantity ?? 1,
          })
        ),
      };
    }

    // --------------------------------------------------
    // MANUAL PACKAGE
    // --------------------------------------------------

    else {
      if (!isObject(body.packageDetails)) {
        return NextResponse.json(
          {
            success: false,
            message: "Manual package details are required.",
          },
          { status: 400 }
        );
      }

      const manual = body.packageDetails;

      if (
        !validText(manual.packageName) ||
        !validNumber(manual.basePrice)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Package name and valid base price are required.",
          },
          { status: 400 }
        );
      }

      const services: unknown[] = Array.isArray(manual.services)
        ? manual.services
        : [];

      const deliverables: unknown[] = Array.isArray(manual.deliverables)
        ? manual.deliverables
        : [];

      const validateItems = (items: unknown[]): boolean => {
        return items.every((item) => {
          if (!isObject(item)) return false;

          return (
            validText(item.name) &&
            (
              item.description === undefined ||
              typeof item.description === "string"
            ) &&
            (
              item.quantity === undefined ||
              (
                validNumber(item.quantity) &&
                Number.isInteger(item.quantity) &&
                item.quantity <= 100
              )
            )
          );
        });
      };

      if (
        services.length > 100 ||
        deliverables.length > 100 ||
        !validateItems(services) ||
        !validateItems(deliverables)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid services or deliverables.",
          },
          { status: 400 }
        );
      }

      basePrice = manual.basePrice;

      packageDetails = {
        sourceType: "manual",
        packageName: manual.packageName.trim(),

        description:
          typeof manual.description === "string"
            ? manual.description.trim()
            : "",

        services: services.map((item: unknown) => {
          const entry = item as DataObject;

          return {
            name: String(entry.name).trim(),
            description:
              typeof entry.description === "string"
                ? entry.description.trim()
                : "",
            quantity: Number(entry.quantity ?? 1),
          };
        }),

        deliverables: deliverables.map((item: unknown) => {
          const entry = item as DataObject;

          return {
            name: String(entry.name).trim(),
            description:
              typeof entry.description === "string"
                ? entry.description.trim()
                : "",
            quantity: Number(entry.quantity ?? 1),
          };
        }),
      };
    }

    // --------------------------------------------------
    // ADD-ON VALIDATION
    // --------------------------------------------------

    const addonsInput: unknown[] = Array.isArray(body.addons)
      ? body.addons
      : [];

    if (addonsInput.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Maximum 100 add-ons are allowed.",
        },
        { status: 400 }
      );
    }

    const addonIds: string[] = [];

    for (const item of addonsInput) {
      if (!isObject(item)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid add-on information.",
          },
          { status: 400 }
        );
      }

      if (item.addonId !== undefined && item.addonId !== "") {
        if (
          typeof item.addonId !== "string" ||
          !mongoose.Types.ObjectId.isValid(item.addonId)
        ) {
          return NextResponse.json(
            {
              success: false,
              message: "Invalid add-on reference.",
            },
            { status: 400 }
          );
        }

        addonIds.push(item.addonId);
      }
    }

    // Prevent duplicate references to the same master add-on.
    if (new Set(addonIds).size !== addonIds.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Duplicate add-on references are not allowed.",
        },
        { status: 400 }
      );
    }

    const uniqueAddonIds = [...new Set(addonIds)];

    const addonDocuments = await FinalPackageAddon.find({
      _id: { $in: uniqueAddonIds },
      isActive: true,
    }).lean();

    const addonMap = new Map<string, AddonMaster>(
      (addonDocuments as unknown as AddonMaster[]).map((addon) => [
        addon._id.toString(),
        addon,
      ])
    );

    if (addonMap.size !== uniqueAddonIds.length) {
      return NextResponse.json(
        {
          success: false,
          message: "One or more add-ons are missing or inactive.",
        },
        { status: 400 }
      );
    }

    const addons: PackageAddonInput[] = [];

    for (const rawItem of addonsInput) {
      if (!isObject(rawItem)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid add-on information.",
          },
          { status: 400 }
        );
      }

      const item = rawItem;

      const status = item.status;

      if (
        status !== "included" &&
        status !== "selected" &&
        status !== "optional"
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid add-on selection status.",
          },
          { status: 400 }
        );
      }

      if (!validText(item.name)) {
        return NextResponse.json(
          {
            success: false,
            message: "Add-on name is required.",
          },
          { status: 400 }
        );
      }

      const quantity = item.quantity ?? 1;

      if (
        !Number.isInteger(quantity) ||
        !validNumber(quantity, 1) ||
        quantity > 100
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Add-on quantity must be between 1 and 100.",
          },
          { status: 400 }
        );
      }

      let name = item.name.trim();

      let description =
        typeof item.description === "string"
          ? item.description.trim()
          : "";

      let price = item.price;

      let addonId = "";

      // Use master database values when a saved add-on is selected.
      if (typeof item.addonId === "string" && item.addonId) {
        const master = addonMap.get(item.addonId);

        if (!master) {
          return NextResponse.json(
            {
              success: false,
              message: "Referenced add-on does not exist.",
            },
            { status: 400 }
          );
        }

        name = master.name;
        description = master.description || "";
        price = master.defaultPrice;
        addonId = master._id.toString();
      }

      // Custom add-ons must provide their own valid price.
      if (!validNumber(price)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid add-on price.",
          },
          { status: 400 }
        );
      }

      // Included add-ons remain visible but are never charged.
      addons.push({
        addonId,
        name,
        description,
        price: status === "included" ? 0 : price,
        quantity,
        status,
      });
    }

    // --------------------------------------------------
    // GALLERY VALIDATION
    // --------------------------------------------------

    const galleryInput: unknown[] = Array.isArray(body.gallery)
      ? body.gallery
      : [];

    if (
      galleryInput.length > 50 ||
      !galleryInput.every((item) => {
        if (!isObject(item)) return false;

        return (
          typeof item.imageUrl === "string" &&
          /^https?:\/\//i.test(item.imageUrl.trim()) &&
          item.imageUrl.trim().length <= 2048 &&
          (
            item.title === undefined ||
            typeof item.title === "string"
          ) &&
          (
            item.category === undefined ||
            typeof item.category === "string"
          ) &&
          (
            item.caption === undefined ||
            typeof item.caption === "string"
          )
        );
      })
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid gallery images. Maximum 50 valid image URLs are allowed.",
        },
        { status: 400 }
      );
    }

    const gallery = galleryInput.map((item) => {
      const image = item as DataObject;

      return {
        title: typeof image.title === "string" ? image.title.trim() : "",
        imageUrl: String(image.imageUrl).trim(),
        category:
          typeof image.category === "string"
            ? image.category.trim()
            : "",
        caption:
          typeof image.caption === "string"
            ? image.caption.trim()
            : "",
      };
    });

    // --------------------------------------------------
    // SETTINGS
    // --------------------------------------------------

    const settings = await FinalPackageSettings.findOne().lean();

    // --------------------------------------------------
    // GST VALIDATION
    // --------------------------------------------------

    const gstPercentage =
      body.gstPercentage === undefined
        ? settings?.gstPercentage ?? 0
        : body.gstPercentage;

    if (
      !validNumber(gstPercentage) ||
      gstPercentage > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "GST percentage must be between 0 and 100.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // DISCOUNT VALIDATION
    // --------------------------------------------------

    const addonsTotal = roundMoney(
      addons.reduce((sum, addon) => {
        if (addon.status !== "selected") {
          return sum;
        }

        return sum + addon.price * addon.quantity;
      }, 0)
    );

    const subtotal = roundMoney(basePrice + addonsTotal);

    const discount = body.discount ?? 0;

    if (
      !validNumber(discount) ||
      discount > subtotal
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Discount cannot exceed the package subtotal.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // FINAL PRICE CALCULATION
    // --------------------------------------------------

    const taxableAmount = roundMoney(
      Math.max(0, subtotal - discount)
    );

    const gstAmount = roundMoney(
      (taxableAmount * gstPercentage) / 100
    );

    const finalAmount = roundMoney(
      taxableAmount + gstAmount
    );

    // --------------------------------------------------
    // PAYMENT VALIDATION
    // --------------------------------------------------

    const advancePercentage =
      body.advancePercentage === undefined
        ? settings?.advancePercentage ?? 50
        : body.advancePercentage;

    if (
      !validNumber(advancePercentage) ||
      advancePercentage > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Advance payment percentage must be between 0 and 100.",
        },
        { status: 400 }
      );
    }

    // Calculate the remaining amount from the rounded advance.
    // This ensures both amounts add up exactly to the final amount.

    const advanceAmount = roundMoney(
      (finalAmount * advancePercentage) / 100
    );

    const balanceAmount = roundMoney(
      finalAmount - advanceAmount
    );

    const paymentTerms = [
      {
        label: "Advance Payment",
        percentage: advancePercentage,
        amount: advanceAmount,
      },
      {
        label: "Remaining Balance",
        percentage: 100 - advancePercentage,
        amount: balanceAmount,
      },
    ];

    // --------------------------------------------------
    // TERMS AND CONDITIONS
    // --------------------------------------------------

    let termsAndConditions: string[];

    if (body.termsAndConditions === undefined) {
      termsAndConditions =
        settings?.defaultTermsAndConditions || [];
    } else if (
      Array.isArray(body.termsAndConditions) &&
      body.termsAndConditions.length <= 100 &&
      body.termsAndConditions.every(
        (item: unknown) => typeof item === "string"
      )
    ) {
      termsAndConditions = body.termsAndConditions
        .map((item: string) => item.trim())
        .filter(Boolean);
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid terms and conditions.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // SECTION ORDER VALIDATION
    // --------------------------------------------------

    const defaultSections = [
      "introduction",
      "client",
      "event",
      "package",
      "services",
      "deliverables",
      "gallery",
      "addons",
      "pricing",
      "payment",
      "terms",
      "closing",
    ];

    const sectionsOrder =
      body.sectionsOrder === undefined
        ? defaultSections
        : body.sectionsOrder;

    if (
      !Array.isArray(sectionsOrder) ||
      sectionsOrder.some(
        (item: unknown) => typeof item !== "string"
      ) ||
      sectionsOrder.length > 30
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid section order.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // PUBLIC STATUS
    // --------------------------------------------------

    const status =
      body.status === "published"
        ? "published"
        : "draft";

    const packageNumber = createPackageNumber();
    const publicToken = crypto.randomBytes(32).toString("hex");

    // --------------------------------------------------
    // CREATE FINAL PACKAGE
    // --------------------------------------------------

    const finalPackage = await FinalPackage.create({
      packageNumber,
      publicToken,
      linkRevoked: false,

      client: {
        name: client.name.trim(),

        partnerName:
          typeof client.partnerName === "string"
            ? client.partnerName.trim()
            : "",

        phone: client.phone.trim(),

        email:
          typeof client.email === "string"
            ? client.email.trim().toLowerCase()
            : "",
      },

      eventDetails: {
        eventType:
          typeof event.eventType === "string"
            ? event.eventType.trim()
            : "Wedding",

        eventDate,

        venue:
          typeof event.venue === "string"
            ? event.venue.trim()
            : "",

        location:
          typeof event.location === "string"
            ? event.location.trim()
            : "",
      },

      packageDetails,
      addons,
      gallery,

      pricing: {
        basePrice,
        addonsTotal,
        discount,
        gstPercentage,
        gstAmount,
        finalAmount,
      },

      paymentTerms,

      termsAndConditions,
      sectionsOrder,

      introduction:
        typeof body.introduction === "string"
          ? body.introduction
          : "",

      closingMessage:
        typeof body.closingMessage === "string"
          ? body.closingMessage
          : "Thank you for choosing KuttiStory Photography.",

      status,

      createdBy: new mongoose.Types.ObjectId(user.userId),
    });

    createdPackageId = finalPackage._id;

    // --------------------------------------------------
    // ACTIVITY LOG
    // --------------------------------------------------

    try {
      await FinalPackageEventLog.create({
        packageId: finalPackage._id,
        action: "created",
        description: `Final Package ${packageNumber} created.`,
        performedBy: new mongoose.Types.ObjectId(user.userId),
        metadata: {
          sourceType,
          packageName: packageDetails.packageName,
          finalAmount,
        },
      });

      if (status === "published") {
        await FinalPackageEventLog.create({
          packageId: finalPackage._id,
          action: "published",
          description: `Final Package ${packageNumber} published.`,
          performedBy: new mongoose.Types.ObjectId(user.userId),
        });
      }
    } catch (logError) {
      // Do not leave a package created without its activity history.
      await FinalPackage.findByIdAndDelete(finalPackage._id);

      console.error("Final Package activity log error:", logError);

      return NextResponse.json(
        {
          success: false,
          message: "Package could not be saved with its activity history.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // SUCCESS RESPONSE
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message: "Final Package created successfully.",

        package: {
          ...finalPackage.toObject(),

          publicUrl:
            status === "published"
              ? `/final-package/${publicToken}`
              : null,

          publicToken:
            status === "published"
              ? publicToken
              : undefined,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Final Package POST error:", error);

    // Best-effort cleanup if package creation succeeded
    // but a later operation failed unexpectedly.
    if (createdPackageId) {
      try {
        await connectDB();
        await FinalPackage.findByIdAndDelete(createdPackageId);
      } catch (cleanupError) {
        console.error(
          "Final Package cleanup error:",
          cleanupError
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create Final Package.",
      },
      { status: 500 }
    );
  }
}
