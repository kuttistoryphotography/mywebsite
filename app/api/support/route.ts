import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SupportTicket from '@/models/SupportTicket';
import { getCurrentUser } from '@/lib/auth';
import User from '@/models/User';


function ticketNumber() {
  return `TKT-${Date.now().toString(36).toUpperCase()}`;
}

function serialize(t: any, isAdmin = false) {
  const user = t.userId;
  return {
    id: String(t._id),
    ticketNumber: t.ticketNumber,
    subject: t.subject,
    category: t.category,
    status: t.status,
    priority: t.priority,
    messages: t.messages.map((m: any) => ({
      id: String(m._id),
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    })),
    adminUnread: t.adminUnread,
    userUnread: t.userUnread,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    resolvedAt: t.resolvedAt || null,
    // only include user info for admin view
    user: isAdmin && user && typeof user === 'object' ? {
      id: String(user._id),
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      email: user.email,
    } : undefined,
  };
}

// GET — user: own tickets; admin: all tickets
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const filter: any = { _id: id };
      if (session.role !== 'admin') filter.userId = session.userId;
      const ticket = await SupportTicket.findOne(filter).populate('userId', 'firstName lastName email');
      if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 });

      // Mark messages as read
      if (session.role === 'admin') {
        await SupportTicket.findByIdAndUpdate(id, { $set: { adminUnread: 0 } });
      } else {
        await SupportTicket.findByIdAndUpdate(id, { $set: { userUnread: 0 } });
      }
      return NextResponse.json({ ticket: serialize(ticket, session.role === 'admin') });
    }

    if (session.role === 'admin') {
      const statusFilter = searchParams.get('status');
      const filter: any = {};
      if (statusFilter && statusFilter !== 'all') filter.status = statusFilter;
      const tickets = await SupportTicket.find(filter)
        .populate('userId', 'firstName lastName email')
        .sort({ updatedAt: -1 });
      return NextResponse.json({ tickets: tickets.map((t) => serialize(t, true)) });
    } else {
      const tickets = await SupportTicket.find({ userId: session.userId }).sort({ updatedAt: -1 });
      return NextResponse.json({ tickets: tickets.map((t) => serialize(t, false)) });
    }
  } catch (err) {
    console.error('[Support GET]', err);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

// POST — create new ticket (user only)
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await connectDB();
    const body = await request.json();
    const { subject, category, message, priority } = body;

    if (!subject?.trim()) return NextResponse.json({ error: 'Subject required' }, { status: 400 });
    if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    const ticket = await SupportTicket.create({
      ticketNumber: ticketNumber(),
      userId: session.userId,
      subject: subject.trim(),
      category: category || 'general',
      priority: priority || 'normal',
      messages: [{ role: 'user', content: message.trim(), createdAt: new Date() }],
      adminUnread: 1,
      userUnread: 0,
    });

    return NextResponse.json({ success: true, ticket: serialize(ticket) }, { status: 201 });
  } catch (err) {
    console.error('[Support POST]', err);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}

// PUT — add a reply or update status
export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await connectDB();
    const body = await request.json();
    const { id, message, status, priority } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const filter: any = { _id: id };
    if (session.role !== 'admin') filter.userId = session.userId;

    const ticket = await SupportTicket.findOne(filter);
    if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const update: any = {};

    if (message?.trim()) {
      const role = session.role === 'admin' ? 'admin' : 'user';
      ticket.messages.push({ role, content: message.trim(), createdAt: new Date() } as any);
      update.$set = { messages: ticket.messages };
      // increment unread for the OTHER party
      if (role === 'admin') {
        update.$set.userUnread = ticket.userUnread + 1;
        update.$set.adminUnread = 0;
        // auto-move to in_progress when admin replies
        if (ticket.status === 'open') update.$set.status = 'in_progress';
      } else {
        update.$set.adminUnread = ticket.adminUnread + 1;
        update.$set.userUnread = 0;
        // if resolved, re-open on user reply
        if (ticket.status === 'resolved' || ticket.status === 'closed') update.$set.status = 'open';
      }
    }

    if (status && session.role === 'admin') {
      if (!update.$set) update.$set = {};
      update.$set.status = status;
      if (status === 'resolved' || status === 'closed') update.$set.resolvedAt = new Date();
    }

    if (priority && session.role === 'admin') {
      if (!update.$set) update.$set = {};
      update.$set.priority = priority;
    }

    const updated = await SupportTicket.findByIdAndUpdate(id, update, { new: true })
      .populate('userId', 'firstName lastName email');

    return NextResponse.json({ success: true, ticket: serialize(updated, session.role === 'admin') });
  } catch (err) {
    console.error('[Support PUT]', err);
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}

// DELETE — admin only
export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await SupportTicket.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Support DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete ticket' }, { status: 500 });
  }
}
