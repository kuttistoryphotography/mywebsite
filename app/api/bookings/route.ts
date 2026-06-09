import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Booking from '@/models/Booking';
import { getCurrentUser } from '@/lib/auth';
import { createBulkNotifications, getAdminUserIds } from '@/lib/notifications';

// Map DB booking → shape expected by orders-section.tsx
function mapBooking(b: any) {
  // Stage normalization: DB stores 'in_progress', component expects 'preparing'
  const stageMap: Record<string, string> = {
    processing:  'processing',
    pending:     'processing',
    confirmed:   'booked',
    in_progress: 'preparing',
    editing:     'editing',
    delivered:   'finalizing',
    completed:   'completed',
  };

  const dbStage = b.currentStage || b.status || 'processing';
  const uiStage = stageMap[dbStage] || 'processing';

  return {
    // IDs
    id:            String(b._id),
    orderNumber:   b.bookingNumber || String(b._id),
    bookingNumber: b.bookingNumber || String(b._id),

    // Service
    serviceType:  b.eventType   || b.serviceName || '',
    serviceName:  b.serviceName || b.eventType   || '',
    category:     b.eventType   || b.serviceName || '',

    // Dates
    bookingDate: b.createdAt,
    eventDate:   b.eventDate,
    venue:       b.eventLocation || b.eventCity || '',
    location:    b.eventLocation || '',

    // Status — provide both raw and UI-mapped
    bookingStatus:  b.status,
    currentStatus:  uiStage,     // what orders-section.tsx renders
    currentStage:   dbStage,     // what BookingTimeline uses
    timeline:       Array.isArray(b.timeline) ? b.timeline : [],

    // Money
    totalCost:      Number(b.estimatedPrice || 0),
    estimatedPrice: Number(b.estimatedPrice || 0),
    currency:       'INR',
    totalPaid:      Number(b.totalPaid || 0),
    paymentStatus:  b.paymentStatus || 'unpaid',
    payments:       [],          // fetched separately by PaymentModal

    // PDF
    pdfUrl: b.pdfUrl || null,

    // Contact
    clientName:  b.clientName,
    clientEmail: b.clientEmail,
    clientPhone: b.clientPhone,

    cancellationReason: b.cancellationReason || null,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,

    // Alias used by admin bookings-section
    client:   b.clientName,
    email:    b.clientEmail,
    phone:    b.clientPhone,
    service:  b.serviceName || b.eventType || '',
    date:     b.eventDate,
    amount:   Number(b.estimatedPrice || 0),
    paid:     Number(b.totalPaid || 0),
    status:   b.status,
    notes:    b.specialRequests || '',
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await connectDB();
    let bookings;

    if (session.role === 'admin') {
      bookings = await Booking.find().sort({ createdAt: -1 });
    } else {
      bookings = await Booking.find({ userId: session.userId }).sort({ createdAt: -1 });
    }

    return NextResponse.json({ bookings: bookings.map(mapBooking) });
  } catch (error) {
    console.error('[Bookings GET]', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await connectDB();
    const body = await request.json();
    const {
      client_name, client_email, client_phone,
      event_type, event_date, event_time, event_location, event_city,
      guest_count, special_requests, how_did_you_hear, estimated_price, quote_id,
    } = body;

    if (!client_name || !client_email) {
      return NextResponse.json({ error: 'Client name and email required' }, { status: 400 });
    }

    const bookingNumber = `BK-${Date.now()}`;
    const booking = await Booking.create({
      bookingNumber,
      userId: session.userId,
      quoteId: quote_id || undefined,
      clientName: client_name,
      clientEmail: client_email,
      clientPhone: client_phone,
      eventType: event_type,
      eventDate: event_date ? new Date(event_date) : undefined,
      eventTime: event_time,
      eventLocation: event_location,
      eventCity: event_city,
      guestCount: guest_count,
      specialRequests: special_requests,
      howDidYouHear: how_did_you_hear,
      estimatedPrice: estimated_price,
      status: 'pending',
      currentStage: 'processing',
      timeline: [
        { stage: 'processing', status: 'current' },
        { stage: 'confirmed',  status: 'pending' },
        { stage: 'in_progress', status: 'pending' },
        { stage: 'editing',    status: 'pending' },
        { stage: 'delivered',  status: 'pending' },
        { stage: 'completed',  status: 'pending' },
      ],
    });

    try {
      const adminIds = await getAdminUserIds();
      await createBulkNotifications(adminIds, {
        type: 'booking_confirmed',
        title: 'New Booking Request',
        description: `${client_name} submitted booking ${bookingNumber}.`,
        relatedEntityType: 'booking',
        relatedEntityId: String(booking._id),
        actionUrl: '/admin?tab=bookings',
      });
    } catch {}

    return NextResponse.json({ success: true, bookingId: String(booking._id), bookingNumber }, { status: 201 });
  } catch (error) {
    console.error('[Bookings POST]', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
