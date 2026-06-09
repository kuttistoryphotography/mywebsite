/**
 * lib/email.ts
 *
 * Email utility using Nodemailer (SMTP).
 * Set these env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 *   ADMIN_EMAIL   — where admin notifications go
 *   FROM_EMAIL    — the "from" address (defaults to SMTP_USER)
 *   SITE_NAME     — display name (default: "Photography Studio")
 */
import nodemailer from 'nodemailer';

function getTransport() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST  || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const SITE_NAME  = process.env.SITE_NAME  || 'Photography Studio';
const FROM_EMAIL = process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@example.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.SMTP_USER || '';

interface Attachment {
  filename: string;
  content:  Buffer;
  contentType: string;
}

async function sendMail(
  to:          string,
  subject:     string,
  html:        string,
  attachments: Attachment[] = []
) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[Email] SMTP credentials not set — skipping email to:', to);
    return false;
  }
  try {
    const transport = getTransport();
    await transport.sendMail({
      from:        `"${SITE_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      attachments: attachments.map((a) => ({
        filename:    a.filename,
        content:     a.content,
        contentType: a.contentType,
      })),
    });
    return true;
  } catch (err) {
    console.error('[Email] Send failed:', err);
    return false;
  }
}

/* ─── Quote request (to admin) ─────────────────────────────────────────────── */
export async function sendQuoteRequestAdminEmail(data: {
  clientName:    string;
  clientEmail:   string;
  clientPhone?:  string;
  serviceType:   string;
  eventDate:     string;
  eventLocation?: string;
  description?:  string;
  quoteNumber:   string;
}) {
  if (!ADMIN_EMAIL) return;
  const html = `
    <h2>New Quote Request — ${data.quoteNumber}</h2>
    <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
      <tr><td><b>Client</b></td><td>${data.clientName} (${data.clientEmail}${data.clientPhone ? ', ' + data.clientPhone : ''})</td></tr>
      <tr><td><b>Service</b></td><td>${data.serviceType}</td></tr>
      <tr><td><b>Event Date</b></td><td>${data.eventDate}</td></tr>
      ${data.eventLocation ? `<tr><td><b>Location</b></td><td>${data.eventLocation}</td></tr>` : ''}
      ${data.description   ? `<tr><td><b>Notes</b></td><td>${data.description}</td></tr>`     : ''}
    </table>
    <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin?tab=quotes">View in Admin Panel</a></p>
  `;
  return sendMail(ADMIN_EMAIL, `[${SITE_NAME}] New Quote Request — ${data.quoteNumber}`, html);
}

/* ─── Quote PDFs to client (on quote request submission) ──────────────────── */
export async function sendQuotePdfsToClient(data: {
  clientName:  string;
  clientEmail: string;
  serviceType: string;
  quoteNumber: string;
  /**
   * Array of { label, fileName, buffer } — one per pricing tier.
   * Fetch the buffers from Google Drive before calling this function.
   */
  pdfs: Array<{
    label:    string;   // e.g. "Premium"
    fileName: string;   // attachment filename shown in email
    buffer:   Buffer;
  }>;
}) {
  if (!data.pdfs.length) return false;

  const tierList = data.pdfs
    .map((p) => `<li><b>${p.label}</b> — attached as <em>${p.fileName}</em></li>`)
    .join('\n');

  const html = `
    <h2>Your Photography Quote Packages — ${data.quoteNumber}</h2>
    <p>Dear ${data.clientName},</p>
    <p>Thank you for your interest in our <b>${data.serviceType}</b> photography services!</p>
    <p>We have attached <b>${data.pdfs.length} pricing package PDF(s)</b> tailored for you:</p>
    <ul>${tierList}</ul>
    <p>Please review the packages and let us know if you have any questions or would like to proceed with a booking.</p>
    <p>You can accept or request a custom quote from your 
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || ''}/dashboard?tab=quotes">client dashboard</a>.
    </p>
    <p>Thank you for choosing ${SITE_NAME}!</p>
  `;

  const attachments: Attachment[] = data.pdfs.map((p) => ({
    filename:    p.fileName,
    content:     p.buffer,
    contentType: 'application/pdf',
  }));

  return sendMail(
    data.clientEmail,
    `[${SITE_NAME}] Your Quote Packages — ${data.quoteNumber}`,
    html,
    attachments
  );
}

/* ─── Booking confirmed (to client + admin) ──────────────────────────────── */
export async function sendBookingConfirmedEmails(data: {
  clientName:     string;
  clientEmail:    string;
  bookingNumber:  string;
  serviceType:    string;
  eventDate?:     string;
  eventLocation?: string;
  estimatedPrice?: number;
}) {
  const clientHtml = `
    <h2>Booking Confirmed — ${data.bookingNumber}</h2>
    <p>Dear ${data.clientName},</p>
    <p>Your booking has been confirmed. Here are the details:</p>
    <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
      <tr><td><b>Booking Number</b></td><td>${data.bookingNumber}</td></tr>
      <tr><td><b>Service</b></td><td>${data.serviceType}</td></tr>
      ${data.eventDate     ? `<tr><td><b>Event Date</b></td><td>${data.eventDate}</td></tr>`       : ''}
      ${data.eventLocation ? `<tr><td><b>Location</b></td><td>${data.eventLocation}</td></tr>`     : ''}
      ${data.estimatedPrice ? `<tr><td><b>Estimated Price</b></td><td>₹${data.estimatedPrice.toLocaleString()}</td></tr>` : ''}
    </table>
    <p>You can track your booking status in your <a href="${process.env.NEXT_PUBLIC_SITE_URL || ''}/dashboard?tab=bookings">client dashboard</a>.</p>
    <p>Thank you for choosing ${SITE_NAME}!</p>
  `;
  const adminHtml = `
    <h2>New Booking Confirmed — ${data.bookingNumber}</h2>
    <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
      <tr><td><b>Client</b></td><td>${data.clientName} (${data.clientEmail})</td></tr>
      <tr><td><b>Service</b></td><td>${data.serviceType}</td></tr>
      ${data.eventDate     ? `<tr><td><b>Event Date</b></td><td>${data.eventDate}</td></tr>`       : ''}
      ${data.eventLocation ? `<tr><td><b>Location</b></td><td>${data.eventLocation}</td></tr>`     : ''}
      ${data.estimatedPrice ? `<tr><td><b>Estimated Price</b></td><td>₹${data.estimatedPrice.toLocaleString()}</td></tr>` : ''}
    </table>
    <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin?tab=bookings">View in Admin Panel</a></p>
  `;

  await Promise.allSettled([
    sendMail(data.clientEmail, `[${SITE_NAME}] Booking Confirmed — ${data.bookingNumber}`, clientHtml),
    ADMIN_EMAIL ? sendMail(ADMIN_EMAIL, `[${SITE_NAME}] New Booking — ${data.bookingNumber}`, adminHtml) : Promise.resolve(),
  ]);
}
/* ─── Quote Drive links to client (replaces PDF attachment approach) ─────── */
export async function sendQuoteDriveLinksToClient(data: {
  clientName:   string;
  clientEmail:  string;
  serviceType:  string;
  quoteNumber:  string;
  categoryName: string;
  pdfs: Array<{
    label:             string;
    fileName:          string;
    driveWebViewLink:  string;
    driveDownloadLink: string;
  }>;
}) {
  if (!data.pdfs.length) return false;

  const pdfRows = data.pdfs
    .map(
      (p) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #333;">
          <b>${p.label}</b><br/>
          <span style="color:#aaa;font-size:12px;">${p.fileName}</span>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #333;text-align:center;">
          <a href="${p.driveWebViewLink}" target="_blank"
             style="background:#4285f4;color:#fff;padding:4px 10px;border-radius:4px;text-decoration:none;font-size:12px;margin-right:6px;">
            View
          </a>
          <a href="${p.driveDownloadLink}" target="_blank"
             style="background:#34a853;color:#fff;padding:4px 10px;border-radius:4px;text-decoration:none;font-size:12px;">
            Download
          </a>
        </td>
      </tr>`
    )
    .join('');

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#1a1a1a;color:#eee;border-radius:10px;overflow:hidden;">
      <div style="background:#d97706;padding:20px 24px;">
        <h2 style="margin:0;color:#000;font-size:20px;">${SITE_NAME} — Quote Packages</h2>
        <p style="margin:4px 0 0;color:#000;font-size:13px;">Quote Reference: ${data.quoteNumber}</p>
      </div>
      <div style="padding:24px;">
        <p>Dear <b>${data.clientName}</b>,</p>
        <p>Thank you for your interest in our <b>${data.categoryName}</b> photography services!</p>
        <p>We have prepared <b>${data.pdfs.length} pricing package(s)</b> for you.
           Please click the links below to view or download them from Google Drive:</p>

        <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#222;border-radius:8px;overflow:hidden;">
          <thead>
            <tr style="background:#333;">
              <th style="padding:10px 12px;text-align:left;font-size:13px;color:#aaa;">Package</th>
              <th style="padding:10px 12px;text-align:center;font-size:13px;color:#aaa;">Links</th>
            </tr>
          </thead>
          <tbody>${pdfRows}</tbody>
        </table>

        <p style="color:#aaa;font-size:13px;">
          Please review the packages and let us know if you have any questions or would like to proceed.
          You can accept or request a custom quote from your
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || ''}/dashboard?tab=quotes" style="color:#d97706;">
            client dashboard
          </a>.
        </p>
        <p>Thank you for choosing <b>${SITE_NAME}</b>!</p>
      </div>
      <div style="background:#111;padding:12px 24px;text-align:center;font-size:11px;color:#555;">
        All documents are securely stored and shared via Google Drive.
      </div>
    </div>
  `;

  return sendMail(
    data.clientEmail,
    `[${SITE_NAME}] Your Quote Packages — ${data.quoteNumber}`,
    html
  );
}
