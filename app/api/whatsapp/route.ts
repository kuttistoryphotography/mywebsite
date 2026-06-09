import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Quote from '@/models/Quote';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  try {
    // Using Twilio WhatsApp API
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

    if (!accountSid || !authToken) {
      console.warn('Twilio credentials not set - WhatsApp not sent');
      return false;
    }

    const formattedTo = to.startsWith('+') ? `whatsapp:${to}` : `whatsapp:+91${to}`;

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ From: from, To: formattedTo, Body: message }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return false;
  }
}

// Send quote PDF link + monthly quote to user's WhatsApp
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { quoteId, monthlyQuoteText, whatsappNumber } = body;

    // Find the quote
    const quote = await Quote.findById(quoteId).populate('userId');
    if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });

    // Only admin or the quote owner can send
    if (session.role !== 'admin' && String(quote.userId) !== session.userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Determine WhatsApp number: use provided or get from user profile
    let targetNumber = whatsappNumber;
    if (!targetNumber) {
      const user = await User.findById(quote.userId);
      targetNumber = user?.whatsappNumber || user?.phone;
    }

    if (!targetNumber) {
      return NextResponse.json({ error: 'No WhatsApp number available. Please update your profile.' }, { status: 400 });
    }

    // Build message
    const pdfLink = quote.pdfUrl
      ? `\n📄 *Download your quote PDF:* ${process.env.NEXT_PUBLIC_SITE_URL || 'https://kuttistory.com'}${quote.pdfUrl}`
      : '';

    let message = `🎉 *Kutti Story Photography*\n\nHello ${quote.clientName}!\n\nYour quote *${quote.quoteNumber}* for *${quote.serviceType}* has been prepared.\n\n💰 *Quoted Price:* ₹${quote.quotedPrice?.toLocaleString() || 'TBD'}${pdfLink}`;

    if (monthlyQuoteText) {
      message += `\n\n✨ *Quote of the Month:*\n_"${monthlyQuoteText}"_`;
    }

    message += `\n\nTo proceed with booking, please visit:\n${process.env.NEXT_PUBLIC_SITE_URL || 'https://kuttistory.com'}/dashboard\n\nThank you for choosing Kutti Story! 📸`;

    const sent = await sendWhatsAppMessage(targetNumber, message);

    if (sent) {
      await Quote.findByIdAndUpdate(quoteId, { whatsappSent: true });
    }

    return NextResponse.json({
      success: sent,
      message: sent ? 'WhatsApp message sent successfully' : 'Failed to send WhatsApp message - check Twilio configuration',
    });
  } catch (error) {
    console.error('WhatsApp route error:', error);
    return NextResponse.json({ error: 'Failed to send WhatsApp message' }, { status: 500 });
  }
}
