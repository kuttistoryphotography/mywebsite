import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ContactSettings from '@/models/ContactSettings'; 
import { getCurrentUser } from '@/lib/auth';

const DEFAULTS = {
  email: 'kuttistoryphotography@gmail.com',
  phone: '+91 93420 13600',
  whatsapp: '+91 93420 13600',
  address: 'Periyar',
  city: 'Madurai',
  state: 'Tamil Nadu',
  pincode: '625016',
  googleMapsEmbed: '',
  businessHours: 'Mon – Sat: 9 AM – 7 PM',
  instagramUrl: '',
  facebookUrl: '',
  youtubeUrl: '',
  twitterUrl: '',
  telegramUrl: '',
};

export async function GET() {
  try {
    await connectDB();
    let settings = await ContactSettings.findOne();
    if (!settings) {
      settings = await ContactSettings.create(DEFAULTS);
    }
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('[Contact GET]', error);
    return NextResponse.json({ settings: DEFAULTS });
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

    const allowedFields = [
      'email',
      'phone',
      'whatsapp',
      'address',
      'city',
      'state',
      'pincode',
      'googleMapsEmbed',
      'businessHours',
      'instagramUrl',
      'facebookUrl',
      'youtubeUrl',
      'twitterUrl',
      'telegramUrl',
    ];

    const update: Record<string, string> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) update[key] = String(body[key]);
    }

    let settings = await ContactSettings.findOne();
    if (!settings) {
      settings = await ContactSettings.create({ ...DEFAULTS, ...update });
    } else {
      await ContactSettings.findOneAndUpdate({}, { $set: update }, { new: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Contact PUT]', error);
    return NextResponse.json({ error: 'Failed to update contact settings' }, { status: 500 });
  }
}
