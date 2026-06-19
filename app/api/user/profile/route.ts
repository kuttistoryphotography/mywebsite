/**
 * app/api/user/profile/route.ts
 *
 * GET  → return current user profile
 * PUT  → update profile fields; avatarUrl can be a Google Drive web-view URL
 *        (uploaded via POST /api/upload?context=profile)
 */
import { NextRequest, NextResponse } from 'next/server';
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
        id:              String(user._id),
        email:           user.email,
        firstName:       user.firstName,
        lastName:        user.lastName,
        phone:           user.phone,
        whatsappNumber:  user.whatsappNumber,
        role:            user.role,
        // avatarUrl is now a Google Drive web-view URL or direct download URL
        avatarUrl:       user.avatarUrl,
        isActive:        user.isActive,
        emailVerified:   user.emailVerified,
        address:         user.address,
        city:            user.city,
        state:           user.state,
        pincode:         user.pincode,
      },
    });
  } catch (error) {
    console.error('PROFILE FETCH ERROR:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await connectDB();
    const body = await request.json();
    const {
     firstName,
     lastName,
     phone,
     whatsappNumber,
     avatarUrl,
     address,
     city,
     state,
     pincode,
     profileCompleted,
    } = body;

    const update: Record<string, unknown> = {};
    if (firstName     !== undefined) update.firstName     = firstName;
    if (lastName      !== undefined) update.lastName      = lastName;
    if (phone         !== undefined) update.phone         = phone;
    if (whatsappNumber !== undefined) update.whatsappNumber = whatsappNumber;
    // avatarUrl: accepts Google Drive webViewLink or downloadLink
    if (avatarUrl     !== undefined) update.avatarUrl     = avatarUrl;
    if (address !== undefined) update.address = address;
    if (city !== undefined) update.city = city;
    if (state !== undefined) update.state = state;
    if (pincode !== undefined) update.pincode = pincode;
    if (profileCompleted !== undefined)
      update.profileCompleted = profileCompleted;

    console.log("UPDATE DATA:", update);

   const updatedUser = await User.findByIdAndUpdate(
     session.userId,
     update,
    {
      new: true,
      runValidators: true,
    }
   );

    console.log("UPDATED USER:", updatedUser);
    
    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('PROFILE UPDATE ERROR:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
