
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import FinalPackageTemplate from "@/models/FinalPackageTemplate";
import { requireFinalPackageAdmin } from "@/lib/final-package/admin-auth";

const item = (
  name: string,
  quantity = 1,
  description = ""
) => ({
  name,
  quantity,
  description,
});

const defaultTemplates = [
  // --------------------------------------------------
  // BASIC 01
  // --------------------------------------------------
  {
    templateCode: "BASIC-01",
    packageName: "Basic Package 01",
    category: "basic",
    description: "Photography Package",
    basePrice: 30000,
    sortOrder: 1,
    services: [
      item("Traditional Photographer"),
    ],
    deliverables: [
      item("Premium Non-Tearable Photo Album", 1, "12 × 36 inches, 50 pages"),
      item("Photo Frame", 1, "12 × 18 inches"),
      item("Complete RAW Data", 1, "Client's own hard disk"),
    ],
  },

  // --------------------------------------------------
  // BASIC 02
  // --------------------------------------------------
  {
    templateCode: "BASIC-02",
    packageName: "Basic Package 02",
    category: "basic",
    description: "Photography + Videography",
    basePrice: 50000,
    sortOrder: 2,
    services: [
      item("Traditional Photographer"),
      item("Traditional Videographer"),
    ],
    deliverables: [
      item("Premium Non-Tearable Photo Album", 1, "12 × 36 inches, 80 pages"),
      item("Full Wedding Video", 1, "1080p, delivered in pendrive"),
      item("Photo Frame", 1, "12 × 18 inches"),
      item("Monthly Calendar with Couple Images"),
      item("Complete RAW Data", 1, "Client's own hard disk"),
      item("Complimentary Pre-Wedding Studio Photoshoot", 1, "For bride and groom"),
    ],
  },

  // --------------------------------------------------
  // STANDARD 01
  // --------------------------------------------------
  {
    templateCode: "STANDARD-01",
    packageName: "Standard Package 01",
    category: "standard",
    description: "Photography + Videography + Candid Coverage",
    basePrice: 85000,
    sortOrder: 3,
    services: [
      item("Traditional Photographer"),
      item("Traditional Videographer"),
      item("Candid Photographer"),
      item("Standard Lighting Unit"),
    ],
    deliverables: [
      item("Premium Non-Tearable Photo Album", 1, "12 × 36 inches, 80 pages"),
      item("Full Wedding Video", 1, "1080p, delivered in pendrive"),
      item("Premium Photo Frame", 2, "12 × 18 inches each"),
      item("Monthly Calendar with Couple Images"),
      item("Save The Date Photography & Video"),
      item("Digital E-Invitation"),
      item("Complete RAW Data", 1, "Client's own hard disk"),
      item("Complimentary Pre-Wedding Studio Photoshoot", 1, "For bride and groom"),
      item("Wedding Photo Retouching for Instagram Posters", 1, "10 to 15 photos"),
    ],
  },

  // --------------------------------------------------
  // STANDARD 02
  // --------------------------------------------------
  {
    templateCode: "STANDARD-02",
    packageName: "Standard Package 02",
    category: "standard",
    description: "Includes Outdoor Couple Photoshoot",
    basePrice: 95000,
    sortOrder: 4,
    services: [
      item("Traditional Photographer"),
      item("Traditional Videographer"),
      item("Candid Photographer"),
      item("Standard Lighting Unit"),
    ],
    deliverables: [
      item("Premium Non-Tearable Photo Album", 1, "12 × 36 inches, 80 pages"),
      item("Full Wedding Video", 1, "1080p, delivered in pendrive"),
      item("Premium Photo Frame", 2, "12 × 18 inches each"),
      item("Monthly Calendar with Couple Images"),
      item("Save The Date Photography & Video"),
      item("Digital E-Invitation"),
      item("Complete RAW Data", 1, "Client's own hard disk"),
      item("Complimentary Pre-Wedding Studio Photoshoot", 1, "For bride and groom"),
      item("Outdoor Couple Photoshoot", 1, "3 hours"),
      item("Outdoor Portrait Album", 1, "Magazine style, 20 pages"),
      item("Wedding Photo Retouching for Instagram Posters", 1, "10 to 15 photos"),
      item("Outdoor Photo Retouching for Instagram Posters", 1, "10 to 15 photos"),
    ],
  },

  // --------------------------------------------------
  // STANDARD 03
  // --------------------------------------------------
  {
    templateCode: "STANDARD-03",
    packageName: "Standard Package 03",
    category: "standard",
    description: "Includes Candid Film & Outdoor Sessions",
    basePrice: 120000,
    sortOrder: 5,
    services: [
      item("Traditional Photographer"),
      item("Traditional Videographer"),
      item("Candid Photographer"),
      item("Candid Videographer"),
      item("Standard Lighting Unit"),
    ],
    deliverables: [
      item("Premium Non-Tearable Photo Album", 1, "12 × 36 inches, 90 pages"),
      item("Full Wedding Video", 1, "1080p, delivered in pendrive"),
      item("Candid Wedding Film", 1, "4–5 minutes"),
      item("Candid Video Teaser"),
      item("Wedding Reel"),
      item("Premium Photo Frame", 3, "12 × 18 inches each"),
      item("Monthly Calendar with Couple Images"),
      item("Save The Date Photography & Video"),
      item("Digital E-Invitation"),
      item("Complete RAW Data", 1, "Client's own hard disk"),
      item("Complimentary Pre-Wedding Studio Photoshoot", 1, "For bride and groom"),
      item("Outdoor Couple Photoshoot", 1, "3 hours"),
      item("Outdoor Shoot Sessions", 1, "Morning & evening sessions"),
      item("Outdoor Outfit Concepts", 1, "Traditional & Western"),
      item("Outdoor Portrait Album", 1, "Magazine style, 20 pages"),
      item("Wedding Photo Retouching for Instagram Posters", 1, "10 to 15 photos"),
      item("Outdoor Photo Retouching for Instagram Posters", 1, "15 to 20 photos"),
    ],
  },

  // --------------------------------------------------
  // STANDARD 04
  // --------------------------------------------------
  {
    templateCode: "STANDARD-04",
    packageName: "Standard Package 04",
    category: "standard",
    description: "Includes Two Outdoor Photo & Video Shoots",
    basePrice: 145000,
    sortOrder: 6,
    services: [
      item("Traditional Photographer"),
      item("Traditional Videographer"),
      item("Candid Photographer"),
      item("Candid Videographer"),
      item("Standard Lighting Unit"),
    ],
    deliverables: [
      item("Premium Non-Tearable Photo Album", 1, "12 × 36 inches, 90 pages"),
      item("Full Wedding Video", 1, "1080p, delivered in pendrive"),
      item("Candid Wedding Film", 1, "4–5 minutes"),
      item("Candid Video Teaser"),
      item("Wedding Reel"),
      item("Premium Photo Frame", 3, "12 × 18 inches each"),
      item("Monthly Calendar with Couple Images"),
      item("Save The Date Photography & Video"),
      item("Digital E-Invitation"),
      item("Complete RAW Data", 1, "Client's own hard disk"),
      item("Complimentary Pre-Wedding Studio Photoshoot", 1, "For bride and groom"),
      item("Outdoor Photo & Video Shoot", 2, "3 hours each"),
      item("Outdoor Shoot Sessions", 1, "Morning & evening sessions"),
      item("Outdoor Outfit Concepts", 1, "Traditional & Western"),
      item("Outdoor Portrait Album", 1, "Magazine style, 20 pages"),
      item("Outdoor Reels", 2),
      item("Wedding Photo Retouching for Instagram Posters", 1, "10 to 15 photos"),
      item("Outdoor Photo Retouching for Instagram Posters", 1, "15 to 20 photos"),
    ],
  },

  // --------------------------------------------------
  // PREMIUM 01
  // --------------------------------------------------
  {
    templateCode: "PREMIUM-01",
    packageName: "Premium 01",
    category: "premium",
    description: "Premium Wedding Coverage",
    basePrice: 165000,
    sortOrder: 7,
    services: [
      item("Traditional Photographer"),
      item("Traditional Videographer"),
      item("Candid Photographer"),
      item("Candid Videographer"),
      item("Helicam Coverage"),
      item("Standard Lighting Unit"),
    ],
    deliverables: [
      item("Premium Non-Tearable Photo Album", 1, "12 × 36 inches, 90 pages"),
      item("Full Wedding Video", 1, "1080p, delivered in pendrive"),
      item("Candid Wedding Film", 1, "4–5 minutes"),
      item("Candid Video Teaser"),
      item("Wedding Reel"),
      item("Premium Photo Frame", 3, "12 × 18 inches each"),
      item("Monthly Calendar with Couple Images"),
      item("Save The Date Photography & Video"),
      item("Digital E-Invitation"),
      item("Complete RAW Data", 1, "Client's own hard disk"),
      item("Complimentary Pre-Wedding Studio Photoshoot", 1, "For bride and groom"),
      item("Outdoor Photo & Video Shoot", 2, "3 hours each"),
      item("Outdoor Shoot Sessions", 1, "Morning & evening sessions"),
      item("Outdoor Outfit Concepts", 1, "Traditional & Western"),
      item("Outdoor Portrait Album", 1, "Magazine style, 20 pages"),
      item("Outdoor Reels", 2),
      item("Wedding Photo Retouching for Instagram Posters", 1, "10 to 15 photos"),
      item("Outdoor Photo Retouching for Instagram Posters", 1, "15 to 20 photos"),
    ],
  },

  // --------------------------------------------------
  // PREMIUM 02
  // --------------------------------------------------
  {
    templateCode: "PREMIUM-02",
    packageName: "Premium 02",
    category: "premium",
    description: "Cinematic Storytelling Experience",
    basePrice: 195000,
    sortOrder: 8,
    services: [
      item("Traditional Photographer"),
      item("Traditional Videographer"),
      item("Candid Photographer"),
      item("Candid Videographer / Filmmaker"),
      item("Helicam Coverage"),
      item("Standard Lighting Unit"),
    ],
    deliverables: [
      item("Premium Non-Tearable Photo Album", 1, "12 × 36 inches, 90 pages"),
      item("Full Wedding Video", 1, "1080p, delivered in pendrive"),
      item("Candid Wedding Film", 1, "4–5 minutes"),
      item("Candid Video Teaser"),
      item("Wedding Reel"),
      item("Cinematic Wedding Story Film", 1, "Up to 10 minutes"),
      item("Premium Photo Frame", 3, "12 × 18 inches each"),
      item("Monthly Calendar with Couple Images"),
      item("Save The Date Photography & Video"),
      item("Digital E-Invitation"),
      item("Complete RAW Data", 1, "Client's own hard disk"),
      item("Complimentary Pre-Wedding Studio Photoshoot", 1, "For bride and groom"),
      item("Outdoor Photo & Video Shoot", 2, "3 hours each"),
      item("Outdoor Shoot Sessions", 1, "Morning & evening sessions"),
      item("Outdoor Outfit Concepts", 1, "Traditional & Western"),
      item("Outdoor Portrait Album", 1, "Magazine style, 20 pages"),
      item("Outdoor Reels", 2),
      item("Wedding Photo Retouching for Instagram Posters", 1, "10 to 15 photos"),
      item("Outdoor Photo Retouching for Instagram Posters", 1, "15 to 20 photos"),
    ],
  },

  // --------------------------------------------------
  // PREMIUM 03
  // --------------------------------------------------
  {
    templateCode: "PREMIUM-03",
    packageName: "Premium 03",
    category: "premium",
    description: "Luxury Wedding Film & Album Collection",
    basePrice: 250000,
    sortOrder: 9,
    services: [
      item("Traditional Photographer"),
      item("Traditional Videographer"),
      item("Candid Photographer"),
      item("Candid Videographer / Filmmaker"),
      item("Helicam Coverage"),
      item("Standard Lighting Unit"),
    ],
    deliverables: [
      item("Premium Non-Tearable Photo Albums", 2, "12 × 36 inches, 90 pages each"),
      item("Candid Album", 1, "Magazine style"),
      item("Mini Album", 1),
      item("Full Wedding Video", 1, "1080p, delivered in pendrive"),
      item("Candid Wedding Film", 1, "4–5 minutes"),
      item("Candid Video Teaser"),
      item("Wedding Reel"),
      item("Cinematic Wedding Story Film", 1, "Up to 10 minutes"),
      item("FVB Video", 1),
      item("Premium Photo Frame", 3, "12 × 18 inches each"),
      item("Monthly Calendar with Couple Images"),
      item("Save The Date Photography & Video"),
      item("Digital E-Invitation"),
      item("Complete RAW Data", 1, "Client's own hard disk"),
      item("Complimentary Pre-Wedding Studio Photoshoot", 1, "For bride and groom"),
      item("Outdoor Photo & Video Shoot", 2, "3 hours each"),
      item("Outdoor Shoot Sessions", 1, "Morning & evening sessions"),
      item("Outdoor Outfit Concepts", 1, "Traditional & Western"),
      item("Outdoor Portrait Album", 1, "Magazine style, 20 pages"),
      item("Outdoor Reels", 2),
      item("Wedding Photo Retouching for Instagram Posters", 1, "10 to 15 photos"),
      item("Outdoor Photo Retouching for Instagram Posters", 1, "15 to 20 photos"),
    ],
  },

  // --------------------------------------------------
  // VIP WEDDING EXPERIENCE
  // --------------------------------------------------
  {
    templateCode: "VIP-01",
    packageName: "VIP Wedding Experience",
    category: "vip",
    description: "Exclusive Luxury Wedding Production",
    basePrice: 420000,
    sortOrder: 10,
    services: [
      item("Traditional Photographers", 2),
      item("Traditional Videographers", 2),
      item("Candid Photographer"),
      item("Candid Videographer / Cinematic Storytelling Filmmaker"),
      item("Helicam Coverage"),
      item("Standard Lighting Unit"),
      item("LED Wall", 1, "8 × 6 feet"),
      item("Live Streaming"),
      item("360° Video Booth"),
      item("Photo Booth"),
      item("QR Scan Code Photo Sharing"),
    ],
    deliverables: [
      item("Premium Non-Tearable Photo Albums", 2, "12 × 36 inches, 90 pages each"),
      item("Candid Album", 1, "Magazine style"),
      item("Mini Album", 1),
      item("Full Wedding Video", 1, "1080p, delivered in pendrive"),
      item("Candid Wedding Film", 1, "4–5 minutes"),
      item("Candid Video Teaser"),
      item("Wedding Reel"),
      item("Cinematic Wedding Story Film", 1, "Up to 10 minutes"),
      item("FVB Video", 1),
      item("Premium Photo Frame", 3, "12 × 18 inches each"),
      item("Monthly Calendar with Couple Images"),
      item("Save The Date Photography & Video"),
      item("Digital E-Invitation"),
      item("Complete RAW Data", 1, "Client's own hard disk"),
      item("Complimentary Pre-Wedding Studio Photoshoot", 1, "For bride and groom"),
      item("Outdoor Photo & Video Shoot", 2, "3 hours each"),
      item("Outdoor Shoot Sessions", 1, "Morning & evening sessions"),
      item("Outdoor Outfit Concepts", 1, "Traditional & Western"),
      item("Outdoor Portrait Album", 1, "Magazine style, 20 pages"),
      item("Outdoor Reels", 2),
      item("Wedding Photo Retouching for Instagram Posters", 1, "10 to 15 photos"),
      item("Outdoor Photo Retouching for Instagram Posters", 1, "15 to 20 photos"),
    ],
  },
];

export async function POST() {
  try {
    const { response } = await requireFinalPackageAdmin();

    if (response) {
      return response;
    }

    await connectDB();

    const operations = defaultTemplates.map((template) => ({
      updateOne: {
        filter: { templateCode: template.templateCode },
        update: {
          $setOnInsert: {
            ...template,
            isActive: true,
          },
        },
        upsert: true,
      },
    }));

    const result = await FinalPackageTemplate.bulkWrite(operations);

    const total = await FinalPackageTemplate.countDocuments({
      templateCode: {
        $in: defaultTemplates.map((template) => template.templateCode),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Default wedding package templates initialized.",
      totalDefaultTemplates: 10,
      existingOrCreated: total,
      inserted: result.upsertedCount,
      alreadyExisted: 10 - result.upsertedCount,
    });
  } catch (error) {
    console.error("Final package template seed error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to initialize package templates.",
        error:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
