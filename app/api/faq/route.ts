import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import FaqSettings from '@/models/FaqSettings';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    await connectDB();
    let settings = await FaqSettings.findOne();
    if (!settings) settings = await FaqSettings.create({});
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('FAQ GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch FAQ settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { section, data } = body;

    let settings = await FaqSettings.findOne();
    if (!settings) settings = await FaqSettings.create({});

    if (section === 'header') {
      settings.heading     = data.heading     ?? settings.heading;
      settings.subheading  = data.subheading  ?? settings.subheading;
      settings.description = data.description ?? settings.description;
      settings.markModified('heading');
      settings.markModified('subheading');
      settings.markModified('description');
    }

    if (section === 'categories') {
      settings.set('categories', data);
      settings.markModified('categories');
    }

    await settings.save();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('FAQ PUT error:', error);
    return NextResponse.json({ error: 'Failed to save FAQ settings' }, { status: 500 });
  }
}