import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Booking from '@/models/Booking';
import { getCurrentUser } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

const STAGES = [
  'processing',
  'confirmed',
  'in_progress',
  'editing',
  'delivered',
  'completed',
];

// Normalize all frontend/admin stage names
const STAGE_MAP: Record<string, string> = {
  // Processing
  processing: 'processing',
  pending: 'processing',

  // Confirmed
  confirmed: 'confirmed',
  booked: 'confirmed',

  // In Progress
  in_progress: 'in_progress',
  'in-progress': 'in_progress',
  preparing: 'in_progress',
  shooting: 'in_progress',
  'on-shoot': 'in_progress',

  // Editing
  editing: 'editing',
  'post-production': 'editing',
  'end-editing': 'editing',
  'end_of_editing': 'editing',

  // Delivered
  delivered: 'delivered',
  finalizing: 'delivered',
  review: 'delivered',

  // Completed
  completed: 'completed',
  done: 'completed',
};

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
    const { bookingId, stage, notes } = body;

    if (!bookingId || !stage) {
      return NextResponse.json(
        { error: 'bookingId and stage required' },
        { status: 400 }
      );
    }

    // Normalize stage
    const normalizedStage =
      STAGE_MAP[String(stage).toLowerCase()] || null;

    if (!normalizedStage || !STAGES.includes(normalizedStage)) {
      return NextResponse.json(
        {
          error: 'Invalid stage',
          received: stage,
          normalized: normalizedStage,
          allowed: STAGES,
        },
        { status: 400 }
      );
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const stageIdx = STAGES.indexOf(normalizedStage);

    // Build updated timeline
    const newTimeline = STAGES.map((s) => {
      const idx = STAGES.indexOf(s);

      if (idx < stageIdx) {
        return {
          stage: s,
          status: 'completed',
          completedAt: new Date(),
          completedBy: session.userId,
        };
      }

      if (idx === stageIdx) {
        return {
          stage: s,
          status: 'current',
          startedAt: new Date(),
          notes: notes || '',
        };
      }

      return {
        stage: s,
        status: 'pending',
      };
    });

    booking.timeline = newTimeline as any;
    booking.currentStage = normalizedStage;

    // Sync booking status
    if (normalizedStage === 'completed') {
      booking.status = 'completed';
      booking.completedAt = new Date();
    } else if (normalizedStage === 'confirmed') {
      booking.status = 'confirmed';
    } else if (normalizedStage === 'in_progress') {
      booking.status = 'in_progress';
    }

    await booking.save();

    // Notify customer
    try {
      await createNotification(String(booking.userId), {
        type: 'booking_updated',
        title: 'Booking Progress Updated',
        description: `Your booking ${
          booking.bookingNumber
        } has progressed to: ${normalizedStage.replace('_', ' ')}.`,
        relatedEntityType: 'booking',
        relatedEntityId: String(booking._id),
        actionUrl: '/dashboard?tab=bookings',
        adminId: session.userId,
      });
    } catch (err) {
      console.error('Notification error:', err);
    }

    return NextResponse.json({
      success: true,
      currentStage: normalizedStage,
      timeline: newTimeline,
    });
  } catch (error) {
    console.error('Timeline error:', error);

    return NextResponse.json(
      { error: 'Failed to update timeline' },
      { status: 500 }
    );
  }
}