import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const session = await getCurrentUser();

  return NextResponse.json({
    session,
  });
}