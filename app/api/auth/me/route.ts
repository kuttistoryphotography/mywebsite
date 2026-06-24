import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await connectDB();
    const user = await User.findById(session.userId).select('-passwordHash');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
 
    return NextResponse.json({
      user: {
        id: String(user._id),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        whatsappNumber: user.whatsappNumber,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error(
      "PROFILE FETCH ERROR:--------",
      error
    );
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
