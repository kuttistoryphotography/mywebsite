import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import PaymentSettings from "../../../models/PaymentSettings";

export async function GET() {
  await connectDB();

  let settings = await PaymentSettings.findOne();

  if (!settings) {
    settings = await PaymentSettings.create({
      upiId: "rajaxismdu@axl",
      accountName: "Kutti Story Photography",
    });
  }

  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  await connectDB();

  const body = await request.json();

  let settings = await PaymentSettings.findOne();

  if (!settings) {
    settings = await PaymentSettings.create(body);
  } else {
    settings = await PaymentSettings.findByIdAndUpdate(
      settings._id,
      body,
      { new: true }
    );
  }

  return NextResponse.json({
    success: true,
    settings,
  });
}