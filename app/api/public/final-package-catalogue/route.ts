
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";

import FinalPackageSettings from "@/models/FinalPackageSettings";
import FinalPackageTemplate from "@/models/FinalPackageTemplate";
import FinalPackageAddon from "@/models/FinalPackageAddon";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const [settings, templates, addons] = await Promise.all([
      FinalPackageSettings.findOne().lean(),

      FinalPackageTemplate.find({ isActive: true })
        .sort({ sortOrder: 1, createdAt: -1 })
        .lean(),

      FinalPackageAddon.find({ isActive: true })
        .sort({ sortOrder: 1, createdAt: -1 })
        .lean(),
    ]);

    return NextResponse.json(
      {
        success: true,

        settings: settings
          ? {
              businessName: settings.businessName,
              tagline: settings.tagline,
              logo: settings.logo,
              phone: settings.phone,
              whatsappNumber: settings.whatsappNumber,
              email: settings.email,
              address: settings.address,
              gstPercentage: settings.gstPercentage,
              advancePercentage: settings.advancePercentage,
              balancePaymentText: settings.balancePaymentText,
              defaultTermsAndConditions:
                settings.defaultTermsAndConditions,
              theme: settings.theme,
            }
          : null,

        templates,
        addons,

        counts: {
          templates: templates.length,
          addons: addons.length,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Public Final Package Catalogue API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load wedding package catalogue.",
      },
      { status: 500 }
    );
  }
}
