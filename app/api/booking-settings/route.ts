import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import BookingSettings from "@/models/BookingSettings";

export async function GET() {
  try {
    await connectDB();

    let settings = await BookingSettings.findOne();

    if (!settings) {
      settings = await BookingSettings.create({
        bookingImage: "",
      });
    }

    return NextResponse.json(settings);

  } catch (error: any) {
    console.error("BOOKING SETTINGS ERROR:", error);

    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    let settings = await BookingSettings.findOne();

    if (!settings) {
      settings = await BookingSettings.create(body);
    } else {
      settings.bookingImage = body.bookingImage;
      await settings.save();
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}