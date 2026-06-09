import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Quote from '@/models/Quote';
import Booking from '@/models/Booking';
import { getCurrentUser } from '@/lib/auth';
import { createBulkNotifications, getAdminUserIds, createNotification } from '@/lib/notifications';
import { sendBookingConfirmedEmails } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await connectDB();
    const body = await request.json();
    const { quoteId, action, reason } = body;

    if (!quoteId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const quote = await Quote.findById(quoteId);
    if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });

    if (session.role !== 'admin' && String(quote.userId) !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (action === 'accept') {
      // Mark quote as deal_closed
      await Quote.findByIdAndUpdate(quoteId, {
        status: 'deal_closed',
        lastAction: 'accepted',
        actionTakenAt: new Date(),
      });

      // Auto-create a booking from this quote
      const bookingNumber = `BK-${Date.now()}`;
      let booking;
      try {
        // Check if booking already exists for this quote
        const existingBooking = await Booking.findOne({ quoteId: quote._id });
        if (!existingBooking) {
          booking = await Booking.create({
            bookingNumber,
            userId: quote.userId,
            quoteId: quote._id,
            clientName: quote.clientName,
            clientEmail: quote.clientEmail,
            clientPhone: quote.clientPhone,
            serviceName: quote.serviceType,
            eventType: quote.serviceType,
            eventDate: quote.eventDate,
            eventLocation: quote.eventLocation,
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
        } else {
          booking = existingBooking;
        }
      } catch (bookingErr) {
        console.error('[Quote accept] Booking creation failed:', bookingErr);
      }

      // Notify admin
      try {
        const adminIds = await getAdminUserIds();
        await createBulkNotifications(adminIds, {
          type: 'quote_accepted',
          title: 'Quote Accepted — Booking Created',
          description: `${quote.clientName} accepted quote ${quote.quoteNumber}. Booking ${bookingNumber} created.`,
          relatedEntityType: 'booking',
          relatedEntityId: booking ? String(booking._id) : String(quote._id),
          actionUrl: '/admin?tab=bookings',
        });
      } catch {}

      // Notify client
      try {
        await createNotification(String(quote.userId), {
          type: 'booking_confirmed',
          title: 'Booking Confirmed!',
          description: `Your deal is confirmed. Booking ${bookingNumber} has been created.`,
          relatedEntityType: 'booking',
          relatedEntityId: booking ? String(booking._id) : '',
          actionUrl: '/dashboard?tab=bookings',
        });
      } catch {}

      // Send confirmation emails to client + admin
      try {
        await sendBookingConfirmedEmails({
          clientName: quote.clientName,
          clientEmail: quote.clientEmail,
          bookingNumber,
          serviceType: quote.serviceType,
          eventDate: quote.eventDate ? new Date(quote.eventDate).toLocaleDateString('en-IN') : undefined,
          eventLocation: quote.eventLocation,
          estimatedPrice: quote.quotedPrice,
        });
      } catch (e) {
        console.error('[Quote accept] Email failed:', e);
      }

      return NextResponse.json({
        success: true,
        message: 'Quote accepted',
        bookingNumber,
        bookingId: booking ? String(booking._id) : null,
      });
    }

    if (action === 'decline') {
      await Quote.findByIdAndUpdate(quoteId, {
        status: 'rejected',
        lastAction: 'declined',
        actionTakenAt: new Date(),
        requoteReason: reason || null,
      });

      try {
        const adminIds = await getAdminUserIds();
        await createBulkNotifications(adminIds, {
          type: 'quote_rejected',
          title: 'Quote Declined',
          description: `${quote.clientName} declined quote ${quote.quoteNumber}.${reason ? ` Reason: ${reason}` : ''}`,
          relatedEntityType: 'quote',
          relatedEntityId: String(quote._id),
          actionUrl: '/admin?tab=quotes',
        });
      } catch {}

      return NextResponse.json({ success: true, message: 'Quote declined' });
    }

    if (action === 'request_requote') {
      if (session.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

      await Quote.findByIdAndUpdate(quoteId, {
        status: 'requoted',
        requoteReason: reason || null,
        requoteCount: (quote.requoteCount || 0) + 1,
        lastAction: 'requote_requested',
        actionTakenAt: new Date(),
      });

      await createNotification(String(quote.userId), {
        type: 'quote_responded',
        title: 'Quote Revision Available',
        description: `Your quote ${quote.quoteNumber} has been revised.${reason ? ` Notes: ${reason}` : ''}`,
        relatedEntityType: 'quote',
        relatedEntityId: String(quote._id),
        actionUrl: '/dashboard?tab=quotes',
      });

      return NextResponse.json({ success: true, message: 'Requote requested' });
    }

    if (action === 'respond') {
      if (session.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

      await Quote.findByIdAndUpdate(quoteId, {
        status: 'quote_reviewed',
        lastAction: 'responded',
        actionTakenAt: new Date(),
      });

      await createNotification(String(quote.userId), {
        type: 'quote_responded',
        title: 'Quote Ready',
        description: `Your quote ${quote.quoteNumber} is ready for review.`,
        relatedEntityType: 'quote',
        relatedEntityId: String(quote._id),
        actionUrl: '/dashboard?tab=quotes',
      });

      return NextResponse.json({ success: true, message: 'Quote responded' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Quote action error:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
