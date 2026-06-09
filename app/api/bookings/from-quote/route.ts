import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Booking from '@/models/Booking';
import Quote from '@/models/Quote';
import { getCurrentUser } from '@/lib/auth';
import { createNotification, createBulkNotifications, getAdminUserIds } from '@/lib/notifications';
import { sendBookingConfirmedEmails } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await connectDB();
    const body = await request.json();
    const { quoteId, eventTime, eventLocation, eventCity, guestCount, specialRequests, howDidYouHear } = body;

    if (!quoteId) return NextResponse.json({ error: 'quoteId required' }, { status: 400 });

    const quote = await Quote.findById(quoteId);
    if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });

    if (session.role !== 'admin' && String(quote.userId) !== session.userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Check if booking already exists for this quote
    const existingBooking = await Booking.findOne({ quoteId: quote._id });
    if (existingBooking) {
      return NextResponse.json({ success: true, bookingId: String(existingBooking._id), bookingNumber: existingBooking.bookingNumber, alreadyExists: true });
    }

    const bookingNumber = `BK-${Date.now()}`;

    const booking = await Booking.create({
      bookingNumber,
      userId: quote.userId,
      quoteId: quote._id,
      clientName: quote.clientName,
      clientEmail: quote.clientEmail,
      clientPhone: quote.clientPhone,
      serviceName: quote.serviceType,
      eventType: quote.serviceType,
      eventDate: quote.eventDate,
      eventTime: eventTime || null,
      eventLocation: eventLocation || quote.eventLocation,
      eventCity: eventCity || null,
      guestCount: guestCount || null,
      specialRequests: specialRequests || null,
      howDidYouHear: howDidYouHear || null,
      estimatedPrice: quote.quotedPrice || null,
      pdfUrl: quote.pdfUrl || null,
      status: 'confirmed',
      currentStage: 'confirmed',
      timeline: [
        { stage: 'processing', status: 'completed', completedAt: new Date() },
        { stage: 'confirmed', status: 'current', startedAt: new Date() },
        { stage: 'in_progress', status: 'pending' },
        { stage: 'editing', status: 'pending' },
        { stage: 'delivered', status: 'pending' },
        { stage: 'completed', status: 'pending' },
      ],
    });

    // Mark quote as deal_closed
    await Quote.findByIdAndUpdate(quoteId, { status: 'deal_closed' });

    // Notify admin
    try {
      const adminIds = await getAdminUserIds();
      await createBulkNotifications(adminIds, {
        type: 'booking_confirmed',
        title: 'New Booking from Quote',
        description: `${quote.clientName} confirmed quote ${quote.quoteNumber}. Booking ${bookingNumber} created.`,
        relatedEntityType: 'booking',
        relatedEntityId: String(booking._id),
        actionUrl: '/admin?tab=bookings',
      });
    } catch {}

    // Notify client
    try {
      await createNotification(String(quote.userId), {
        type: 'booking_confirmed',
        title: 'Booking Confirmed!',
        description: `Your booking ${bookingNumber} is confirmed and ready.`,
        relatedEntityType: 'booking',
        relatedEntityId: String(booking._id),
        actionUrl: '/dashboard?tab=bookings',
      });
    } catch {}

    // Send emails
    try {
      await sendBookingConfirmedEmails({
        clientName: quote.clientName,
        clientEmail: quote.clientEmail,
        bookingNumber,
        serviceType: quote.serviceType,
        eventDate: quote.eventDate ? new Date(quote.eventDate).toLocaleDateString('en-IN') : undefined,
        eventLocation: eventLocation || quote.eventLocation,
        estimatedPrice: quote.quotedPrice,
      });
    } catch (e) {
      console.error('[from-quote] Email failed:', e);
    }

    return NextResponse.json({ success: true, bookingId: String(booking._id), bookingNumber }, { status: 201 });
  } catch (error) {
    console.error('from-quote error:', error);
    return NextResponse.json({ error: 'Failed to create booking from quote' }, { status: 500 });
  }
}
