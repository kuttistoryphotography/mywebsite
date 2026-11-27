
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import FinalPackageSettings from "@/models/FinalPackageSettings";
import { requireFinalPackageAdmin } from "@/lib/final-package/admin-auth";

const ALLOWED_FIELDS = [
  "businessName",
  "tagline",
  "logo",
  "phone",
  "whatsappNumber",
  "email",
  "address",
  "gstPercentage",
  "advancePercentage",
  "balancePaymentText",
  "defaultTermsAndConditions",
  "theme",
  "layout",
] as const;

const THEME_FIELDS = [
  "primaryColor",
  "secondaryColor",
  "backgroundColor",
  "textColor",
] as const;

export async function GET() {
  try {
    const { response } = await requireFinalPackageAdmin();

    if (response) return response;

    await connectDB();

    let settings = await FinalPackageSettings.findOne().lean();

    if (!settings) {
      settings = await FinalPackageSettings.create({});
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Final Package settings GET error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve settings." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { response } = await requireFinalPackageAdmin();

    if (response) return response;

    await connectDB();

    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Invalid settings data." },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    for (const field of ALLOWED_FIELDS) {
      if (field === "layout") continue;

      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid settings provided." },
        { status: 400 }
      );
    }

    for (const field of [
      "businessName",
      "tagline",
      "logo",
      "phone",
      "whatsappNumber",
      "email",
      "address",
      "balancePaymentText",
    ]) {
      if (
        field in updates &&
        typeof updates[field] !== "string"
      ) {
        return NextResponse.json(
          { success: false, message: `Invalid ${field} value.` },
          { status: 400 }
        );
      }
    }

    if (
      "gstPercentage" in updates &&
      (
        typeof updates.gstPercentage !== "number" ||
        !Number.isFinite(updates.gstPercentage) ||
        updates.gstPercentage < 0 ||
        updates.gstPercentage > 100
      )
    ) {
      return NextResponse.json(
        { success: false, message: "GST percentage must be between 0 and 100." },
        { status: 400 }
      );
    }

    if (
      "advancePercentage" in updates &&
      (
        typeof updates.advancePercentage !== "number" ||
        !Number.isFinite(updates.advancePercentage) ||
        updates.advancePercentage < 0 ||
        updates.advancePercentage > 100
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Advance percentage must be between 0 and 100." },
        { status: 400 }
      );
    }

    if ("defaultTermsAndConditions" in updates) {
      if (
        !Array.isArray(updates.defaultTermsAndConditions) ||
        !updates.defaultTermsAndConditions.every(
          (item) => typeof item === "string"
        )
      ) {
        return NextResponse.json(
          { success: false, message: "Terms and conditions must be an array of text." },
          { status: 400 }
        );
      }
    }

    if ("theme" in updates) {
      const theme = updates.theme;

      if (
        !theme ||
        typeof theme !== "object" ||
        Array.isArray(theme)
      ) {
        return NextResponse.json(
          { success: false, message: "Invalid theme settings." },
          { status: 400 }
        );
      }

      const themeObject = theme as Record<string, unknown>;
      const cleanTheme: Record<string, string> = {};

      for (const field of THEME_FIELDS) {
        if (field in themeObject) {
          const value = themeObject[field];

          if (
            typeof value !== "string" ||
            !/^#[0-9A-Fa-f]{6}$/.test(value)
          ) {
            return NextResponse.json(
              { success: false, message: `Invalid theme colour: ${field}.` },
              { status: 400 }
            );
          }

          cleanTheme[field] = value;
        }
      }

      if (Object.keys(cleanTheme).length === 0) {
        return NextResponse.json(
          { success: false, message: "No valid theme colours provided." },
          { status: 400 }
        );
      }

      updates.theme = cleanTheme;
    }

    if (body.layout !== undefined) {
      if (
        !body.layout ||
        typeof body.layout !== "object" ||
        Array.isArray(body.layout)
      ) {
        return NextResponse.json(
          { success: false, message: "Invalid layout settings" },
          { status: 400 }
        );
      }

      const imageFields = [
        "heroBackgroundImage",
        "heroLogo",
        "coupleImage",
        "ribbonImage",
        "flowerImage",
        "addonsImage",
        "paymentImage",
        "termsImage",
        "contactImage",
      ];

      const visibilityFields = [
        "showHero",
        "showIntroduction",
        "showPackages",
        "showAddons",
        "showPaymentTerms",
        "showContact",
      ];

      for (const field of imageFields) {
        if (body.layout[field] !== undefined) {
          if (
            typeof body.layout[field] !== "string" ||
            body.layout[field].length > 500
          ) {
            return NextResponse.json(
              { success: false, message: `Invalid layout field: ${field}` },
              { status: 400 }
            );
          }

          updates[`layout.${field}`] = body.layout[field].trim();
        }
      }

      for (const field of visibilityFields) {
        if (body.layout[field] !== undefined) {
          if (typeof body.layout[field] !== "boolean") {
            return NextResponse.json(
              { success: false, message: `Invalid layout field: ${field}` },
              { status: 400 }
            );
          }

          updates[`layout.${field}`] = body.layout[field];
        }
      }
    }

    const settings = await FinalPackageSettings.findOneAndUpdate(
      {},
      { $set: updates },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Final Package settings saved successfully.",
      settings,
    });
  } catch (error) {
    console.error("Final Package settings PATCH error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to save settings." },
      { status: 500 }
    );
  }
}
