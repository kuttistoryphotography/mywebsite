import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Invoice from '@/models/Invoice';
import Booking from '@/models/Booking';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';
import { calculateInvoiceItems, calculateInvoiceTotals, resolveInvoiceStatus } from '@/lib/invoices';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    
    if (!session) {
     return NextResponse.json(
       { error: 'Not authenticated' },
       { status: 401 }
     );
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId    = searchParams.get('userId');
    const bookingId = searchParams.get('bookingId');
    const status    = searchParams.get('status');

    const filter: Record<string, unknown> = {};

    if (session?.role !== 'admin') {
      filter.userId = session?.userId;
    }
    if (userId)    filter.userId    = userId;
    if (bookingId) filter.bookingId = bookingId;
    if (status)    filter.status    = status;

    const invoices = await Invoice.find(filter)
      .populate('userId',    'firstName lastName email phone')
      .populate('bookingId', 'bookingNumber eventType serviceName estimatedPrice totalPaid')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      invoices: invoices.map((inv: any) => {
        const user    = inv.userId    && typeof inv.userId    === 'object' ? inv.userId    : null;
        const booking = inv.bookingId && typeof inv.bookingId === 'object' ? inv.bookingId : null;

        const amountPaid = booking?.totalPaid ?? 0;
        const amountDue  = Math.max((inv.total ?? 0) - amountPaid, 0);

        return {
          id:             String(inv._id),
          invoice_number: inv.invoiceNumber,
          booking_id:     booking ? String(booking._id) : String(inv.bookingId),
          user_id:        user    ? String(user._id)    : String(inv.userId),
          booking_number: booking?.bookingNumber || '',
          event_type:     booking?.eventType || booking?.serviceName || 'Photography Service',
          client_name:    user ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
          client_email:   user?.email || '',
          status:         resolveInvoiceStatus(inv.status, inv.dueDate, inv.total ?? 0, amountPaid),
          issue_date:     inv.createdAt,
          due_date:       inv.dueDate,
          subtotal:       inv.subtotal ?? 0,
          tax_rate:       inv.tax ?? 0,
          tax_amount:     inv.tax ?? 0,
          discount_amount: inv.discount ?? 0,
          total_amount:   inv.total ?? 0,
          amount_paid:    amountPaid,
          amount_due:     amountDue,
          notes:          inv.notes || null,
          items:          (inv.items || []).map((item: any, idx: number) => ({
            id:          idx,
            item_name:   item.description || item.item_name || '',
            description: item.description || '',
            quantity:    item.quantity ?? 1,
            unit_price:  item.unitPrice ?? 0,
            line_total:  item.total ?? item.lineTotal ?? 0,
          })),
        };
      }),
    });
  } catch (error) {
    console.error('Admin invoices GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
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
    const {
      bookingId,
      userId: explicitUserId,
      items: rawItems,
      taxRate = 0,
      discountAmount = 0,
      dueDate,
      issueDate,
      status = 'sent',
      notes,
    } = body;

    if (!rawItems?.length) {
      return NextResponse.json({ error: 'At least one invoice item is required' }, { status: 400 });
    }

    // Resolve userId — from explicit param or from booking
    let resolvedUserId = explicitUserId;
    let booking = null;

    if (bookingId) {
      booking = await Booking.findById(bookingId);
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      if (!resolvedUserId) {
        resolvedUserId = String(booking.userId);
      }
    }

    if (!resolvedUserId) {
      return NextResponse.json({ error: 'userId or bookingId is required' }, { status: 400 });
    }

    const user = await User.findById(resolvedUserId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Filter out empty items
    const validItems = rawItems.filter((i: any) => i.itemName?.trim() && Number(i.quantity) > 0);
    if (!validItems.length) {
      return NextResponse.json({ error: 'Add at least one valid invoice item' }, { status: 400 });
    }

    const calculatedItems = calculateInvoiceItems(validItems);
    const { subtotal, discount, taxAmount, total } = calculateInvoiceTotals(
      calculatedItems, Number(discountAmount), Number(taxRate)
    );

    const invoiceNumber = `INV-${Date.now()}`;
    const invoice = await Invoice.create({
      invoiceNumber,
      userId:    resolvedUserId,
      bookingId: bookingId || undefined,
      items: calculatedItems.map((i) => ({
        description: i.itemName,
        quantity:    i.quantity,
        unitPrice:   i.unitPrice,
        total:       i.lineTotal,
      })),
      subtotal,
      tax:      taxAmount,
      discount,
      total,
      status:   status || 'sent',
      dueDate:  dueDate  ? new Date(dueDate)  : undefined,
      notes:    notes || '',
    });

    return NextResponse.json(
      { success: true, id: String(invoice._id), invoiceNumber },
      { status: 201 }
    );
  } catch (error) {
    console.error('Admin invoices POST error:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
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
    const { invoiceId, id, status, pdfUrl, notes, dueDate, items: rawItems, taxRate, discountAmount } = body;

    const targetId = invoiceId || id;
    if (!targetId) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const update: Record<string, unknown> = {};
    if (status !== undefined) {
      update.status = status;
      if (status === 'paid') update.paidAt = new Date();
    }
    if (pdfUrl         !== undefined) update.pdfUrl   = pdfUrl;
    if (notes          !== undefined) update.notes    = notes;
    if (dueDate        !== undefined) update.dueDate  = new Date(dueDate);

    if (rawItems?.length) {
      const validItems = rawItems.filter((i: any) => i.itemName?.trim() && Number(i.quantity) > 0);
      if (validItems.length > 0) {
        const calculatedItems = calculateInvoiceItems(validItems);
        const { subtotal, discount, taxAmount, total } = calculateInvoiceTotals(
          calculatedItems, Number(discountAmount || 0), Number(taxRate || 0)
        );
        update.items = calculatedItems.map((i) => ({
          description: i.itemName,
          quantity:    i.quantity,
          unitPrice:   i.unitPrice,
          total:       i.lineTotal,
        }));
        update.subtotal = subtotal;
        update.tax      = taxAmount;
        update.discount = discount;
        update.total    = total;
      }
    }

    await Invoice.findByIdAndUpdate(targetId, update);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin invoices PUT error:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
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