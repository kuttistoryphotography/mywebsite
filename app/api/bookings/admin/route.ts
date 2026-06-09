import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Booking from '@/models/Booking';
import { getCurrentUser } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import { sendBookingConfirmedEmails } from '@/lib/email';

function mapBooking(b: any) {
  const stageMap: Record<string, string> = {
    processing: 'processing', pending: 'processing',
    confirmed: 'booked', in_progress: 'preparing',
    editing: 'editing', delivered: 'finalizing', completed: 'completed',
  };
  const dbStage = b.currentStage || 'processing';

  return {
    id: String(b._id),
    bookingNumber: b.bookingNumber,
    client: b.clientName,
    email: b.clientEmail,
    phone: b.clientPhone || '',
    service: b.serviceName || b.eventType || '',
    serviceName: b.serviceName || b.eventType || '',
    date: b.eventDate,
    time: b.eventTime || '',
    location: b.eventLocation || '',
    amount: Number(b.estimatedPrice || 0),
    paid: Number(b.totalPaid || 0),
    status: b.status || 'pending',
    notes: b.specialRequests || '',
    createdAt: b.createdAt,
    currentStage: dbStage,
    currentStatus: stageMap[dbStage] || 'processing',
    timeline: Array.isArray(b.timeline) ? b.timeline : [],
    paymentStatus: b.paymentStatus || 'unpaid',
    pdfUrl: b.pdfUrl || null,
    userId: String(b.userId),
    clientName: b.clientName,
    clientEmail: b.clientEmail,
    clientPhone: b.clientPhone || '',
    eventDate: b.eventDate,
    eventLocation: b.eventLocation || '',
    estimatedPrice: Number(b.estimatedPrice || 0),
  };
}

/* ── GET ─────────────────────────────────────── */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (session.role === 'admin') {
      if (id) {
        const b = await Booking.findById(id);
        if (!b) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ booking: mapBooking(b) });
      }
      const bookings = await Booking.find().sort({ createdAt: -1 });
      return NextResponse.json({ bookings: bookings.map(mapBooking) });
    }

    // User — own bookings only
    if (id) {
      const b = await Booking.findOne({ _id: id, userId: session.userId });
      if (!b) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ booking: mapBooking(b) });
    }
    const bookings = await Booking.find({ userId: session.userId }).sort({ createdAt: -1 });
    return NextResponse.json({ bookings: bookings.map(mapBooking) });

  } catch (error) {
    console.error('[BOOKINGS_ADMIN_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

/* ── PUT ─────────────────────────────────────── */
export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { id, status, currentStage, estimatedPrice, paymentStatus, pdfUrl } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const prevBooking = await Booking.findById(id);
    if (!prevBooking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const update: Record<string, unknown> = {};
    if (status !== undefined)         update.status = status;
    if (currentStage !== undefined)   update.currentStage = currentStage;
    if (estimatedPrice !== undefined) update.estimatedPrice = estimatedPrice;
    if (paymentStatus !== undefined)  update.paymentStatus = paymentStatus;
    if (pdfUrl !== undefined)         update.pdfUrl = pdfUrl;

    // Also sync status with stage
    if (currentStage) {
      const stageStatusMap: Record<string, string> = {
        processing: 'pending',
        confirmed: 'confirmed',
        in_progress: 'in_progress',
        editing: 'in_progress',
        delivered: 'in_progress',
        completed: 'completed',
      };
      if (!status && stageStatusMap[currentStage]) {
        update.status = stageStatusMap[currentStage];
      }
    }

    if (status && !currentStage) {
      const statusStageMap: Record<string, string> = {
        pending: 'processing',
        confirmed: 'confirmed',
        in_progress: 'in_progress',
        completed: 'completed',
        cancelled: prevBooking.currentStage,
      };
      if (statusStageMap[status]) update.currentStage = statusStageMap[status];
    }

    const booking = await Booking.findByIdAndUpdate(id, update, { new: true });
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    // Update timeline if stage changed
    const finalStage = (currentStage || update.currentStage) as string | undefined;
    if (finalStage) {
      const STAGES = ['processing', 'confirmed', 'in_progress', 'editing', 'delivered', 'completed'];
      const stageIdx = STAGES.indexOf(finalStage);
      const newTimeline = STAGES.map((s, i) => ({
        stage: s,
        status: i < stageIdx ? 'completed' : i === stageIdx ? 'current' : 'pending',
        ...(i < stageIdx ? { completedAt: new Date() } : {}),
        ...(i === stageIdx ? { startedAt: new Date() } : {}),
      }));
      booking.timeline = newTimeline as any;
      await booking.save();
    }

    // Send confirmation email if newly confirmed
    const wasConfirmed =
      (update.status === 'confirmed' && prevBooking.status !== 'confirmed') ||
      (finalStage === 'confirmed' && prevBooking.currentStage !== 'confirmed');

    if (wasConfirmed) {
      try {
        await sendBookingConfirmedEmails({
          clientName: booking.clientName,
          clientEmail: booking.clientEmail,
          bookingNumber: booking.bookingNumber,
          serviceType: booking.serviceName || booking.eventType || '',
          eventDate: booking.eventDate ? new Date(booking.eventDate).toLocaleDateString('en-IN') : undefined,
          eventLocation: booking.eventLocation,
          estimatedPrice: booking.estimatedPrice,
        });
      } catch (e) {
        console.error('[Booking] Email failed:', e);
      }
    }

    // Notify user
    try {
      await createNotification(String(booking.userId), {
        type: 'booking_updated',
        title: wasConfirmed ? 'Booking Confirmed!' : 'Booking Updated',
        description: wasConfirmed
          ? `Your booking ${booking.bookingNumber} has been confirmed.`
          : `Your booking ${booking.bookingNumber} has been updated${finalStage ? ` — Stage: ${finalStage.replace(/_/g, ' ')}` : ''}.`,
        relatedEntityType: 'booking',
        relatedEntityId: String(booking._id),
        actionUrl: '/dashboard?tab=bookings',
      });
    } catch {}

    return NextResponse.json({ success: true, booking: mapBooking(booking) });

  } catch (error) {
    console.error('[BOOKINGS_ADMIN_PUT]', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}

/* ── DELETE ──────────────────────────────────── */
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

    const deleted = await Booking.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[BOOKINGS_ADMIN_DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
  }
}
