import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCurrentUser();

    console.log("SESSION:", session);

    if (!session)
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );

    await connectDB();

    console.log("SESSION USER ID:", session.userId);

    const totalUsers = await User.countDocuments();
    console.log("TOTAL USERS:", totalUsers);

    const user = await User.findById(session.userId)
      .select("-passwordHash");

    console.log("FOUND USER:", user);

    if (!user)
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    