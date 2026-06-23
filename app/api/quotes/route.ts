/**
 * app/api/quotes/route.ts
 *
 * When a user submits a quote request the system:
 *  1. Saves the quote to MongoDB
 *  2. Looks up the PhotographyCategory matching the service type
 *  3. Emails the client with Google Drive links to all PDFs in that category
 *  4. Notifies admin
 */
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Quote from '@/models/Quote';
import PhotographyCategory from '@/models/PhotographyCategory';
import { getCurrentUser } from '@/lib/auth';
import { createNotification, createBulkNotifications, getAdminUserIds } from '@/lib/notifications';
import { sendQuoteRequestAdminEmail, sendQuoteDriveLinksToClient } from '@/lib/email';

const mapStatus = (s: string) => {
  switch ((s || '').toLowerCase()) {
    case 'new': case 'quote_requested': case 'pending': return 'quote_requested';
    case 'reviewed': case 'quote_reviewed': case 'quoted': return 'quote_reviewed';
    case 'requoted': case 'requote_requested': case 'under_review': return 'requoted';
    case 'deal_closed': case 'accepted': case 'confirmed': return 'deal_closed';
    case 'declined': case 'expired': case 'rejected': case 'order_denied': return 'order_denied';
    default: return 'quote_requested';
  }
};

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await connectDB();
    let quotes;

    if (session.role === 'admin') {
      quotes = await Quote.find().populate('userId', 'firstName lastName email phone').sort({ createdAt: -1 });
    } else {
      quotes = await Quote.find({ userId: session.userId }).sort({ createdAt: -1 });
    }

    const mapped = quotes.map((q: any) => ({
      id:              String(q._id),
      requestNumber:   q.quoteNumber,
      title:           q.serviceType,
      category:        q.serviceType,
      status:          mapStatus(q.status),
      createdAt:       q.createdAt,
      updatedAt:       q.updatedAt,
      eventDate:       q.eventDate,
      estimatedAmount: q.quotedPrice || null,
      clientNotes:     q.description  || null,
      adminNotes:      q.adminNotes   || null,
      requoteReason:   q.requoteReason || null,
      requoteCount:    q.requoteCount  || 0,
      pdfUrl:          q.pdfUrl        || null,
      whatsappSent:    q.whatsappSent  || false,
      client: {
        name:     q.clientName     || (q.userId ? `${q.userId.firstName} ${q.userId.lastName}` : 'Unknown'),
        email:    q.clientEmail    || q.userId?.email  || '',
        phone:    q.clientPhone    || q.userId?.phone  || '',
        location: q.eventLocation  || '',
      },
    }));

    return NextResponse.json({ quotes: mapped });
  } catch (error) {
    console.error('Quotes GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await connectDB();
    const body = await request.json();
    const { service_type, event_date, event_location, description, client_name, client_email, client_phone } = body;

    if (!service_type || !event_date || !client_name || !client_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const quoteNumber = `QR-${Date.now()}`;
    const quote = await Quote.create({
      quoteNumber,
      userId:        session.userId,
      serviceType:   service_type,
      eventDate:     new Date(event_date),
      eventLocation: event_location,
      description,
      clientName:    client_name,
      clientEmail:   client_email,
      clientPhone:   client_phone,
      status:        'quote_requested',
    });

    // ── In-app notification to user ──────────────────────────────────────────
    await createNotification(session.userId, {
      type:               'quote_requested',
      title:              'Quote Request Submitted',
      description:        `Your quote ${quoteNumber} for ${service_type} has been submitted.`,
      relatedEntityType:  'quote',
      relatedEntityId:    String(quote._id),
      actionUrl:          '/dashboard?tab=quotes',
    });

    // ── Notify admin (in-app + email) ────────────────────────────────────────
try {
  const adminIds = await getAdminUserIds();

  console.log("ADMIN IDS:", adminIds);
  console.log("ADMIN COUNT:", adminIds.length);
  console.log("Creating admin notification");

  const result = await createBulkNotifications(adminIds, {
    type: 'quote_requested',
    title: 'New Quote Request',
    description: `${client_name} requested a quote for ${service_type}.`,
    relatedEntityType: 'quote',
    relatedEntityId: String(quote._id),
    actionUrl: '/admin?tab=quotes',
  });

  console.log("NOTIFICATION RESULT:", result);
  console.log("ADMIN NOTIFICATION CREATED");

} catch (error) {
  console.error("ADMIN NOTIFICATION ERROR:", error);
}

    try {
      await sendQuoteRequestAdminEmail({
        clientName:    client_name,
        clientEmail:   client_email,
        clientPhone:   client_phone,
        serviceType:   service_type,
        eventDate:     new Date(event_date).toLocaleDateString('en-IN'),
        eventLocation: event_location,
        description,
        quoteNumber,
      });
    } catch (e) {
      console.error('[Quote] Admin email failed:', e);
    }

    // ── Send Drive PDF links to client ───────────────────────────────────────
    // Find the matching photography category (by slug or name match)
    try {
      const normalised = service_type.toLowerCase().trim().replace(/\s+/g, '-');
      // Try slug match first, then loose name match
      let category = await PhotographyCategory.findOne({ slug: normalised, isActive: true });
      if (!category) {
        category = await PhotographyCategory.findOne({
          name: { $regex: new RegExp(service_type.replace(/[-_]/g, '[- _]'), 'i') },
          isActive: true,
        });
      }

      if (category && category.pdfs.length > 0) {
        await sendQuoteDriveLinksToClient({
          clientName:   client_name,
          clientEmail:  client_email,
          serviceType:  service_type,
          quoteNumber,
          categoryName: category.name,
          pdfs: category.pdfs.map((p: any) => ({
            label:             p.label || p.fileName.replace(/\.pdf$/i, ''),
            fileName:          p.fileName,
            driveWebViewLink:  p.url || p.driveWebViewLink || '',
            url:               p.url || p.driveWebViewLink || '',
            driveDownloadLink: p.driveDownloadLink || '',
          })),
        });
      }
    } catch (e) {
      // Non-fatal — quote already saved
      console.error('[Quote] Drive link email failed:', e);
    }

    return NextResponse.json({ success: true, quoteId: String(quote._id), quoteNumber }, { status: 201 });
  } catch (error) {
    console.error('Quotes POST error:', error);
    return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { id, quoted_price, admin_notes, status, pdf_url } = body;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const update: Record<string, unknown> = {};
    if (quoted_price !== undefined) update.quotedPrice = quoted_price;
    if (admin_notes  !== undefined) update.adminNotes  = admin_notes;
    if (status       !== undefined) update.status      = status;
    if (pdf_url      !== undefined) update.pdfUrl      = pdf_url;

    await Quote.findByIdAndUpdate(id, update);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update quote' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await Quote.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete quote' }, { status: 500 });
  }
}
