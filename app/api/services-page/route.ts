import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ServicesPageSettings from '@/models/ServicesPageSettings';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    await connectDB();
    let settings = await ServicesPageSettings.findOne();
    if (!settings) settings = await ServicesPageSettings.create({});
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('ServicesPage GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    await connectDB();
    const { section, data } = await request.json();

    const allowedSections = ['hero', 'showcase', 'cardGrid'] as const;
    type AllowedSection = typeof allowedSections[number];

    if (!allowedSections.includes(section as AllowedSection)) {
      return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
    }

    // Build proper dot-notation keys: { "showcase.heading": "...", "showcase.subheading": "..." }
    const dotSet: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      dotSet[`${section}.${key}`] = value;
    }

    const updated = await ServicesPageSettings.findOneAndUpdate(
      {},
      { $set: dotSet },
      { new: true, upsert: true, runValidators: false }
    );

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error('ServicesPage PUT error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}