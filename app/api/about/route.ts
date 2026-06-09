import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import AboutSettings from '@/models/AboutSettings';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    await connectDB();
    let settings = await AboutSettings.findOne();
    if (!settings) settings = await AboutSettings.create({});
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('About GET error:', error);
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
    const body = await request.json();
    const { section, data } = body;

    let settings = await AboutSettings.findOne();
    if (!settings) settings = await AboutSettings.create({});

    if (section === 'hero') {
      settings.hero = {
        ...settings.hero,
        ...data,
      };
      settings.markModified('hero');
    }

    if (section === 'story') {
      settings.story = {
        ...settings.story,
        ...data,
      };
      settings.markModified('story');
    }

    if (section === 'team') {
      // Direct array replacement — must use set() + markModified for Mongoose to detect the change
      settings.set('team', data);
      settings.markModified('team');
    }

    if (section === 'timeline') {
      settings.set('timeline', data);
      settings.markModified('timeline');
    }

    await settings.save();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('About PUT error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}