import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const session = await getCurrentUser();

    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Client ID required' },
        { status: 400 }
      );
    }

    // Find client
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Generate secure random token
    const token = crypto.randomBytes(16).toString('hex');

    // Save token
    user.memoriesShareToken = token;
    await user.save();

    // Build public sharing URL
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://kuttistoryphotography.com';

    const shareUrl = `${baseUrl}/memories/${token}`;

    return NextResponse.json({
      success: true,
      shareUrl,
      token,
    });
  } catch (error) {
    console.error('Generate memories link error:', error);

    return NextResponse.json(
      { error: 'Failed to generate memories link' },
      { status: 500 }
    );
  }
}