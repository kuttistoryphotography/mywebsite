import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Payment from '@/models/Payment';
import Booking from '@/models/Booking';
import { getCurrentUser } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import Invoice from '@/models/Invoice';

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

    const invoices = await Invoice.find({})
    .populate('userId', 'firstName lastName email')
    .populate('bookingId', 'bookingNumber eventType')
    .sort({ createdAt: -1 });

    return NextResponse.json({
      invoices: invoices.map((inv: any) => ({
        id: String(inv._id),

        invoice_number: inv.invoiceNumber,

        booking_id: String(inv.bookingId?._id || inv.bookingId),
        user_id: String(inv.userId?._id || inv.userId),

        booking_number: inv.bookingId?.bookingNumber || "",
        event_type: inv.bookingId?.eventType || "",

        client_name: `${inv.userId?.firstName || ""} ${inv.userId?.lastName || ""}`.trim(),
        client_email: inv.userId?.email || "",

        status: inv.status || "draft",

        issue_date: inv.createdAt,
        due_date: inv.dueDate,

        subtotal: inv.subtotal || 0,
        tax_rate: inv.tax || 0,
        tax_amount: inv.tax || 0,
        discount_amount: inv.discount || 0,

        total_amount: inv.total || 0,

        amount_paid: inv.bookingId?.totalPaid || 0,
        amount_due: Math.max(
          (inv.total || 0) - (inv.bookingId?.totalPaid || 0),
          0
        ),

        notes: inv.notes || "",

        items: inv.items || []
      }))
    });

  } catch (error) {
    console.error('[PAYMENTS_ADMIN_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

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

    const {
      bookingId,
      dueDate,
      status = 'draft',
      taxRate = 0,
      discountAmount = 0,
      notes = '',
      items = [],
      amount,
    } = body;

    // Validate
    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one invoice item is required' },
        { status: 400 }
      );
    }

    // Get booking
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Prepare invoice items
    const formattedItems = items.map((item: any) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unitPrice || 0);

      return {
        description: item.description || item.itemName || '',
        quantity,
        unitPrice,
        total: quantity * unitPrice,
      };
    });

    // Calculate subtotal
    const subtotal = formattedItems.reduce(
      (sum: number, item: any) => sum + item.total,
      0
    );

    // Tax
    const tax = subtotal * (Number(taxRate) / 100);

    // Final total
    const calculatedTotal =
      subtotal + tax - Number(discountAmount || 0);

    // Use custom amount if provided
    const finalTotal =
      amount !== undefined
        ? Number(amount)
        : calculatedTotal;

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;

    // Create invoice
    const invoice = await Invoice.create({
      invoiceNumber,
      bookingId,
      userId: booking.userId,

      items: formattedItems,

      subtotal,
      tax,
      discount: Number(discountAmount || 0),
      total: finalTotal,

      status,
      dueDate,
      notes,
    });

    return NextResponse.json(
      {
        success: true,
        invoice,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[INVOICE_CREATE_ERROR]', error);

    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
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

    await Invoice.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
