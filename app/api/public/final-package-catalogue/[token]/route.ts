
import { NextResponse } from "next/server";
import { createHash } from "crypto";

import connectDB from "@/lib/db";
import FinalPackageShare from "@/models/FinalPackageShare";
import FinalPackageSettings from "@/models/FinalPackageSettings";
import FinalPackageTemplate from "@/models/FinalPackageTemplate";
import FinalPackageAddon from "@/models/FinalPackageAddon";
import ContactSettings from "@/models/ContactSettings";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    await connectDB();

    const { token } = await context.params;

    if (!token || token.length < 30 || token.length > 200) {
      return NextResponse.json(
        { success: false, message: "Invalid catalogue link." },
        { status: 404 }
      );
    }

    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    const share = await FinalPackageShare.findOne({
      tokenHash,
      status: "active",
    }).lean();

    if (!share) {
      return NextResponse.json(
        {
          success: false,
          message: "This catalogue link is unavailable or revoked.",
        },
        { status: 404 }
      );
    }

    if (
      share.expiresAt &&
      new Date(share.expiresAt).getTime() <= Date.now()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "This catalogue link has expired.",
        },
        { status: 410 }
      );
    }

    const [
      settings,
      contact,
      templates,
      addons,
    ] = await Promise.all([
      FinalPackageSettings.findOne().lean(),

      ContactSettings.findOne().lean(),

      FinalPackageTemplate.find({
        isActive: true,
        eventType: share.eventType || "wedding",
      })
        .sort({ sortOrder: 1, createdAt: 1 })
        .lean(),

      FinalPackageAddon.find({
        isActive: true,
        ...(share.eventType === "reception"
          ? { eventType: "reception" }
          : {
              $or: [
                { eventType: "shared" },
                { eventType: { $exists: false } },
              ],
            }),
      })
        .sort({ sortOrder: 1, createdAt: 1 })
        .lean(),
    ]);

    const contactAddress = contact
      ? [
          contact.address,
          contact.city,
          contact.state,
          contact.pincode,
        ]
          .filter(Boolean)
          .join(", ")
      : "";

    const safeSettings =
      settings || contact
        ? {
            businessName:
              settings?.businessName || "KuttiStory Photography",

            tagline: settings?.tagline,
            logo: settings?.logo,

            phone:
              contact?.phone ||
              settings?.phone ||
              "",

            whatsappNumber:
              contact?.whatsapp ||
              settings?.whatsappNumber ||
              "",

            email:
              contact?.email ||
              settings?.email ||
              "",

            address:
              contactAddress ||
              settings?.address ||
              "",

            gstPercentage: settings?.gstPercentage,
            advancePercentage:
              share.eventType === "reception"
                ? settings?.receptionSettings?.advancePercentage
                : settings?.advancePercentage,

            balancePaymentText:
              share.eventType === "reception"
                ? settings?.receptionSettings?.balancePaymentText
                : settings?.balancePaymentText,

            receptionSettings:
              share.eventType === "reception"
                ? settings?.receptionSettings
                : undefined,

            defaultTermsAndConditions:
              share.eventType === "reception"
                ? settings?.receptionSettings?.defaultTermsAndConditions
                : settings?.defaultTermsAndConditions,

            theme: settings?.theme,

            layout:
              share.eventType === "reception"
                ? share.layout || settings?.receptionLayout || settings?.layout
                : share.layout || settings?.layout,
          }
        : null;

    const safeTemplates = templates.map((template) => ({
      templateCode: template.templateCode,
      packageName: template.packageName,
      category: template.category,
      eventType: template.eventType || "wedding",
      description: template.description,
      basePrice: template.basePrice,
      services: template.services,
      deliverables: template.deliverables,
      sortOrder: template.sortOrder,
    }));

    const safeAddons = addons.map((addon) => ({
      addonCode: addon.addonCode,
      name: addon.name,
      description: addon.description,
      category: addon.category,
      defaultPrice: addon.defaultPrice,
      sortOrder: addon.sortOrder,
    }));

    return NextResponse.json(
      {
        success: true,
        settings: safeSettings,
        eventType: share.eventType || "wedding",
        templates: safeTemplates,
        addons: safeAddons,
        counts: {
          templates: safeTemplates.length,
          addons: safeAddons.length,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
          "X-Robots-Tag": "noindex, nofollow, noarchive",
        },
      }
    );
  } catch (error) {
    console.error("Private wedding catalogue error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load the wedding catalogue.",
      },
      { status: 500 }
    );
  }
}
