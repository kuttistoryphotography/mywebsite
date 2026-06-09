import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getCurrentUser();

    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 401 }
      );
    }

    await connectDB();

    const users = await User.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    const mapped = users.map((u) => ({
        id: String(u._id),
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
        email: u.email,
        phone: u.phone || '',
        location: `${u.city || ''}${u.state ? `, ${u.state}` : ''}`,
        totalBookings: 0,
        totalSpent: 0,
        lastBooking: null,
        status: u.isActive ? 'active' : 'inactive',
        joinedDate: u.createdAt,
        role: u.role,
      }));
    return NextResponse.json({
      clients: mapped,
      users: mapped,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();

    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();

    const {
      firstName,
      lastName,
      email,
      phone,
      city,
      state,
    } = body;

    if (!firstName || !email) {
      return NextResponse.json(
        { error: 'First name and email are required' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    const defaultPassword =
      Math.random().toString(36).slice(-8);

    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      phone,
      city,
      state,
      role: 'client',
      isActive: true,
      passwordHash,
    });

    return NextResponse.json({
      success: true,
      defaultPassword,
      client: {
        id: String(newUser._id),
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentUser();

    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();

    const {
      id,
      firstName,
      lastName,
      email,
      phone,
      city,
      state,
      isActive,
      role,
    } = body;
    console.log('body------', body);
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID required' },
        { status: 400 }
      );
    }

    const update: Record<string, unknown> = {};

    if (firstName !== undefined) update.firstName = firstName;
    if (lastName !== undefined) update.lastName = lastName;
    if (email !== undefined) update.email = email;
    if (phone !== undefined) update.phone = phone;
    if (city !== undefined) update.city = city;
    if (state !== undefined) update.state = state;
    if (isActive !== undefined) update.isActive = isActive;
    if (role !== undefined) update.role = role;

    const updatedUser = await User.findOneAndUpdate(
      { _id: id },
      {
        $set: update,
      },
      {
        new: true,
        runValidators: true,
      }
    );
    
    console.log(updatedUser);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
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
        { error: 'ID required' },
        { status: 400 }
      );
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}