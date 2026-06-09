import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import MonthlyQuote from '@/models/MonthlyQuote';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const adminView = searchParams.get('admin') === 'true';

    if (adminView) {
      const quotes = await MonthlyQuote.find().sort({ year: -1, month: -1 });
      return NextResponse.json({ quotes });
    }

    // Return current month's active quote
    const now = new Date();
    const quote = await MonthlyQuote.findOne({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      isActive: true,
    });

    if (!quote) {
      // Fallback to latest active
      const latest = await MonthlyQuote.findOne({ isActive: true }).sort({ year: -1, month: -1 });
      return NextResponse.json({ quote: latest });
    }

    return NextResponse.json({ quote });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch quote', quote: null }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { text, author, month, year, isActive } = body;

    if (!text || !month || !year) {
      return NextResponse.json({ error: 'Text, month, and year are required' }, { status: 400 });
    }

    const quote = await MonthlyQuote.create({ text, author, month, year, isActive: isActive !== false });
    return NextResponse.json({ success: true, id: String(quote._id) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 });
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
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await MonthlyQuote.findByIdAndUpdate(id, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update quote' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await MonthlyQuote.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete quote' }, { status: 500 });
  }
}
