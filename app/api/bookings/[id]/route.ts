import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Booking from '@/models/Booking';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await connectDB();
    const booking = await Booking.findById(params.id);
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    if (session.role !== 'admin' && String(booking.userId) !== session.userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    return NextResponse.json({ booking: {
      id: String(booking._id),
      bookingNumber: booking.bookingNumber,
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      clientPhone: booking.clientPhone,
      serviceName: booking.serviceName,
      eventType: booking.eventType,
      eventDate: booking.eventDate,
      eventLocation: booking.eventLocation,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      estimatedPrice: booking.estimatedPrice,
      totalPaid: booking.totalPaid,
      currentStage: booking.currentStage,
      timeline: booking.timeline,
      specialRequests: booking.specialRequests,
      createdAt: booking.createdAt,
    }});
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    await connectDB();
    await Booking.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
  }
}
