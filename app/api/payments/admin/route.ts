import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Payment from '@/models/Payment';
import Booking from '@/models/Booking';
import { getCurrentUser } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');
    const userId = searchParams.get('userId');
    const statusParam = searchParams.get('status');

    const filter: Record<string, unknown> = {};
    if (bookingId) filter.bookingId = bookingId;
    if (userId) filter.userId = userId;

    // Map component status values to model status values
    const statusMap: Record<string, string[]> = {
      verified: ['completed'],
      pending:  ['pending'],
      verifying: ['pending'],
      rejected: ['failed', 'refunded'],
      failed:   ['failed'],
    };
    if (statusParam && statusParam !== 'all' && statusMap[statusParam]) {
      filter.status = { $in: statusMap[statusParam] };
    }

    const payments = await Payment.find(filter)
      .populate('bookingId', 'bookingNumber eventType serviceName')
      .populate('userId', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    // Map model fields → component expected fields
    const mapped = payments.map((p: any) => {
      const booking = p.bookingId && typeof p.bookingId === 'object' ? p.bookingId : null;
      const user    = p.userId    && typeof p.userId    === 'object' ? p.userId    : null;

      // Map internal status → component status values
      const statusRemap: Record<string, string> = {
        completed: 'verified',
        pending:   'verifying',
        failed:    'rejected',
        refunded:  'rejected',
      };

      return {
        id:              String(p._id),
        booking_id:      booking ? String(booking._id) : String(p.bookingId),
        user_id:         user    ? String(user._id)    : String(p.userId),
        amount:          p.amount,
        upi_id:          p.paymentMethod === 'upi' ? (p.transactionId || '') : '',
        utr_number:      p.transactionId || '',
        payment_status:  statusRemap[p.status] || p.status,
        payment_type:    p.paymentMethod || 'cash',
        payment_date:    p.createdAt,
        verified_by:     null,
        verified_at:     p.status === 'completed' ? p.updatedAt : null,
        rejection_reason: p.notes && p.status === 'failed' ? p.notes : null,
        notes:           p.notes || '',
        created_at:      p.createdAt,
        updated_at:      p.updatedAt,
        booking_number:  booking?.bookingNumber || '',
        event_type:      booking?.eventType || booking?.serviceName || '',
        first_name:      user?.firstName || '',
        last_name:       user?.lastName  || '',
        email:           user?.email     || '',
        phone:           user?.phone     || '',
        verified_by_name: '',
        verified_by_lastname: '',
      };
    });

    return NextResponse.json({ payments: mapped });
  } catch (error) {
    console.error('[PAYMENTS_ADMIN_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
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
    const { bookingId, amount, paymentMethod, transactionId, notes } = body;

    if (!bookingId || !amount) {
      return NextResponse.json({ error: 'bookingId and amount are required' }, { status: 400 });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const payment = await Payment.create({
      bookingId,
      userId: booking.userId,
      amount: Number(amount),
      paymentMethod: paymentMethod || 'cash',
      status: 'completed',
      transactionId: transactionId || null,
      notes: notes || null,
    });

    const newTotal = (booking.totalPaid || 0) + Number(amount);
    const estimatedPrice = booking.estimatedPrice || 0;
    const paymentStatus = estimatedPrice > 0
      ? newTotal >= estimatedPrice ? 'paid' : 'partial'
      : 'partial';

    await Booking.findByIdAndUpdate(bookingId, {
      totalPaid: newTotal,
      paymentStatus,
      depositPaid: newTotal > 0,
    });

    try {
      await createNotification(String(booking.userId), {
        type: 'payment_received',
        title: 'Payment Received',
        description: `A payment of ₹${Number(amount).toLocaleString()} has been recorded for booking ${booking.bookingNumber}.`,
        relatedEntityType: 'booking',
        relatedEntityId: String(booking._id),
        actionUrl: '/dashboard?tab=bookings',
      });
    } catch {}

    return NextResponse.json({ success: true, id: String(payment._id) }, { status: 201 });
  } catch (error) {
    console.error('[PAYMENTS_ADMIN_POST]', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
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
    const { paymentId, action, rejectionReason, id, status, notes } = body;

    // Support both action-based (from UI) and direct field update
    const targetId = paymentId || id;
    if (!targetId) return NextResponse.json({ error: 'Payment ID required' }, { status: 400 });

    const payment = await Payment.findById(targetId).populate('bookingId');
    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

    if (action === 'verify') {
      await Payment.findByIdAndUpdate(targetId, { status: 'completed' });

      // Update booking totalPaid
      const booking = payment.bookingId as any;
      if (booking) {
        const allPayments = await Payment.find({ bookingId: booking._id, status: 'completed' });
        // Include this one (now completed)
        const newTotal = allPayments.reduce((s: number, p: any) => s + Number(p.amount), 0) + 
          (payment.status !== 'completed' ? Number(payment.amount) : 0);
        const estimatedPrice = booking.estimatedPrice || 0;
        const paymentStatus = estimatedPrice > 0
          ? newTotal >= estimatedPrice ? 'paid' : 'partial'
          : 'partial';
        await Booking.findByIdAndUpdate(booking._id, { totalPaid: newTotal, paymentStatus });

        try {
          await createNotification(String(booking.userId), {
            type: 'payment_verified',
            title: 'Payment Verified',
            description: `Your payment of ₹${Number(payment.amount).toLocaleString()} has been verified.`,
            relatedEntityType: 'booking',
            relatedEntityId: String(booking._id),
            actionUrl: '/dashboard?tab=bookings',
          });
        } catch {}
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'reject') {
      await Payment.findByIdAndUpdate(targetId, {
        status: 'failed',
        notes: rejectionReason || 'Rejected by admin',
      });
      const booking = payment.bookingId as any;
      if (booking?.userId) {
        try {
          await createNotification(String(booking.userId), {
            type: 'payment_rejected',
            title: 'Payment Rejected',
            description: `Your payment of ₹${Number(payment.amount).toLocaleString()} was rejected. Reason: ${rejectionReason || 'See admin notes'}`,
            relatedEntityType: 'booking',
            relatedEntityId: String(booking._id),
            actionUrl: '/dashboard?tab=bookings',
          });
        } catch {}
      }
      return NextResponse.json({ success: true });
    }

    // Generic update
    const update: Record<string, unknown> = {};
    if (status) update.status = status;
    if (notes !== undefined) update.notes = notes;
    await Payment.findByIdAndUpdate(targetId, update);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[PAYMENTS_ADMIN_PUT]', error);
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
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

    await Payment.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
  }
}
