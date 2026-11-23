
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import FinalPackageAddon from "@/models/FinalPackageAddon";
import { requireFinalPackageAdmin } from "@/lib/final-package/admin-auth";

const defaultAddons = [
  {
    addonCode: "ADD-01",
    name: "Additional Photobook",
    category: "Album",
    defaultPrice: 25000,
    sortOrder: 1,
  },
  {
    addonCode: "ADD-02",
    name: "Replicate Album",
    category: "Album",
    defaultPrice: 15000,
    sortOrder: 2,
  },
  {
    addonCode: "ADD-03",
    name: "Mixing Unit",
    category: "Production",
    defaultPrice: 20000,
    sortOrder: 3,
  },
  {
    addonCode: "ADD-04",
    name: "48 Sq. Ft. LED Wall",
    category: "Event",
    defaultPrice: 15000,
    sortOrder: 4,
  },
  {
    addonCode: "ADD-05",
    name: "96 Sq. Ft. LED Wall",
    category: "Event",
    defaultPrice: 35000,
    sortOrder: 5,
  },
  {
    addonCode: "ADD-06",
    name: "Live Streaming",
    category: "Video",
    defaultPrice: 20000,
    sortOrder: 6,
  },
  {
    addonCode: "ADD-07",
    name: "Outdoor Photoshoot",
    category: "Photography",
    defaultPrice: 15000,
    sortOrder: 7,
  },
  {
    addonCode: "ADD-08",
    name: "Outdoor Video Shoot",
    category: "Videography",
    defaultPrice: 25000,
    sortOrder: 8,
  },
  {
    addonCode: "ADD-09",
    name: "Personal Song",
    category: "Creative",
    defaultPrice: 25000,
    sortOrder: 9,
  },
  {
    addonCode: "ADD-10",
    name: "360° Video",
    category: "Video",
    defaultPrice: 20000,
    sortOrder: 10,
  },
  {
    addonCode: "ADD-11",
    name: "Photo Booth",
    category: "Event",
    defaultPrice: 20000,
    sortOrder: 11,
  },
  {
    addonCode: "ADD-12",
    name: "QR Scan Photo Sharing",
    category: "Digital",
    defaultPrice: 10000,
    sortOrder: 12,
  },
  {
    addonCode: "ADD-13",
    name: "Drone Coverage",
    category: "Videography",
    defaultPrice: 20000,
    sortOrder: 13,
  },
  {
    addonCode: "ADD-14",
    name: "Instant Photo Printing",
    category: "Photography",
    defaultPrice: 20000,
    sortOrder: 14,
  },
  {
    addonCode: "ADD-15",
    name: "Spot Editing",
    category: "Editing",
    defaultPrice: 10000,
    sortOrder: 15,
  },
  {
    addonCode: "ADD-16",
    name: "DJ Services",
    category: "Event",
    defaultPrice: 20000,
    sortOrder: 16,
  },
];

export async function POST() {
  try {
    const { response } = await requireFinalPackageAdmin();

    if (response) {
      return response;
    }

    await connectDB();

    const operations = defaultAddons.map((addon) => ({
      updateOne: {
        filter: { addonCode: addon.addonCode },
        update: {
          $setOnInsert: {
            ...addon,
            description: "",
            isActive: true,
          },
        },
        upsert: true,
      },
    }));

    const result = await FinalPackageAddon.bulkWrite(operations);

    const total = await FinalPackageAddon.countDocuments({
      addonCode: {
        $in: defaultAddons.map((addon) => addon.addonCode),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Default add-on catalogue initialized.",
      totalDefaultAddons: defaultAddons.length,
      existingOrCreated: total,
      inserted: result.upsertedCount,
      alreadyExisted: defaultAddons.length - result.upsertedCount,
    });
  } catch (error) {
    console.error("Final Package Add-on Seed Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to initialize default add-ons.",
      },
      { status: 500 }
    );
  }
}
