import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Payment from '@/models/Payment';
import Booking from '@/models/Booking';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await connectDB();
    const filter = session.role === 'admin' ? {} : { userId: session.userId };
    const payments = await Payment.find(filter)
      .populate('bookingId', 'bookingNumber serviceName')
      .sort({ createdAt: -1 });
    console.log('payments----', payments)
    return NextResponse.json({
      payments: payments.map((p: any) => ({
        id: String(p._id),

        booking: {
          orderId: String(p.bookingId?._id || ''),
          bookingNumber: p.bookingId?.bookingNumber || '',
          serviceName: p.bookingId?.serviceName || '',
        },

        userId: String(p.userId),
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        status: p.status,
        transactionId: p.transactionId,
        notes: p.notes,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    // if (!session || session.role !== 'admin') {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    // }

    await connectDB();
    const body = await request.json();
    const { bookingId, amount, paymentMethod, transactionId, notes } = body;

    if (!bookingId || !amount) {
      return NextResponse.json({ error: 'bookingId and amount required' }, { status: 400 });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const payment = await Payment.create({
      bookingId, userId: booking.userId, amount,
      paymentMethod: paymentMethod || 'cash',
      status: 'pending', transactionId, notes,
    });

    // Update booking totals
    // const newTotalPaid = (booking.totalPaid || 0) + amount;
    // const estimatedPrice = booking.estimatedPrice || 0;

    // const paymentStatus = estimatedPrice > 0
    //   ? (newTotalPaid >= estimatedPrice ? 'paid' : 'partial')
    //   : 'partial';

    // await Booking.findByIdAndUpdate(
    //   bookingId,
    //   { totalPaid: newTotalPaid, paymentStatus }
    // );

    return NextResponse.json({ success: true, id: String(payment._id) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
