import "server-only";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import ChatSession from "@/models/ChatSession";
import ContactSettings from "@/models/ContactSettings";

/* ─── Build system prompt with live contact data from DB ─── */
async function buildSystemPrompt(): Promise<string> {
  let contact = {
    email:         "kuttistoryphotography@gmail.com",
    phone:         "+91 93420 13600",
    whatsapp:      "+91 93420 13600",
    address:       "Periyar",
    city:          "Madurai",
    state:         "Tamil Nadu",
    pincode:       "625016",
    businessHours: "Mon – Sat: 9 AM – 7 PM",
    instagramUrl:  "",
    facebookUrl:   "",
    youtubeUrl:    "",
    twitterUrl:    "",
    telegramUrl:   "",
  };

  try {
    const settings = await ContactSettings.findOne().lean();
    if (settings) contact = { ...contact, ...settings };
  } catch {
    // fall back to defaults silently
  }

  // Build the address string
  const addressParts = [
    contact.address,
    contact.city,
    contact.state,
    contact.pincode,
  ].filter(Boolean);
  const fullAddress = addressParts.join(", ");

  // Build social links block — only include lines that have a value
  const socialLines: string[] = [];
  if (contact.instagramUrl) socialLines.push(`  • Instagram: ${contact.instagramUrl}`);
  if (contact.facebookUrl)  socialLines.push(`  • Facebook:  ${contact.facebookUrl}`);
  if (contact.youtubeUrl)   socialLines.push(`  • YouTube:   ${contact.youtubeUrl}`);
  if (contact.twitterUrl)   socialLines.push(`  • X/Twitter: ${contact.twitterUrl}`);
  if (contact.telegramUrl)  socialLines.push(`  • Telegram:  ${contact.telegramUrl}`);
  const socialBlock = socialLines.length
    ? `Social media:\n${socialLines.join("\n")}`
    : "";

  return `
You are a warm, knowledgeable assistant for Kutti Story Photography — a professional photography studio.

Studio specialties:
- Wedding & pre-wedding photography/videography
- Outdoor & portrait shoots
- Baby & kids shoots
- Product & commercial photography
- Corporate events & ads
- Food photography

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTACT INFORMATION (always use these exact values — they come live from the database):

  📧 Email:          ${contact.email}
  📞 Phone:          ${contact.phone}
  💬 WhatsApp:       ${contact.whatsapp}
  📍 Address:        ${fullAddress}
  🕐 Business Hours: ${contact.businessHours}
${socialBlock ? `\n${socialBlock}` : ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT RULES:
1. When a client asks for contact information, phone number, email, WhatsApp, address, social media, or how to reach us — ALWAYS reply with ALL of the contact details above in a single, well-formatted message. Never give just one piece; give everything together.
2. Format the contact reply clearly using the emoji labels shown above so it is easy to scan.
3. For pricing always say: "Our packages are customized to your needs — please request a quote and our team will get back to you within 24 hours."
4. For bookings: guide them to use the booking page or contact us directly via WhatsApp or phone.
5. For availability: ask them to reach out with their preferred date.
6. Gallery delivery is typically 2–4 weeks after the event.
7. Be concise, warm, and encouraging. End responses by inviting further questions or suggesting they book/request a quote.
`;
}

/* ─── POST — chat message ─── */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const message   = body?.message?.trim();
    const sessionId = body?.sessionId || crypto.randomUUID();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    await connectDB();

    // Find or create session
    let session = await ChatSession.findOne({ sessionId });
    if (!session) {
      const currentUser = await getCurrentUser();
      session = await ChatSession.create({
        sessionId,
        userId:   currentUser?.userId || null,
        messages: [],
      });
    }

    // Last 20 messages for context
    const history = (session.messages || [])
      .slice(-20)
      .map((m: any) => ({ role: m.role, content: m.content }));

    // Save user message immediately
    session.messages.push({ role: "user", content: message, timestamp: new Date() });
    await session.save();

    // Build system prompt with live contact data
    const systemPrompt = await buildSystemPrompt();

    // OpenRouter request
    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer":  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title":       "Kuttistory AI",
      },
      body: JSON.stringify({
        model:    "openai/gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user",   content: message },
        ],
        stream: true,
      }),
    });

    if (!aiRes.ok) {
      const errorText = await aiRes.text();
      console.error("OpenRouter API Error:", errorText);
      return NextResponse.json({ error: "AI service unavailable" }, { status: 500 });
    }

    const encoder = new TextEncoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        const reader  = aiRes.body!.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split("\n")) {
              if (!line.startsWith("data: ")) continue;
              const data = line.replace("data: ", "").trim();
              if (!data || data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                const text   = parsed?.choices?.[0]?.delta?.content;
                if (text) {
                  fullResponse += text;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                }
              } catch { /* ignore malformed chunks */ }
            }
          }
        } catch (streamError) {
          console.error("Streaming Error:", streamError);
        } finally {
          // Persist assistant reply
          if (fullResponse.trim()) {
            try {
              session.messages.push({
                role:      "assistant",
                content:   fullResponse.trim(),
                timestamp: new Date(),
              });
              await session.save();
            } catch (saveError) {
              console.error("Failed to save assistant message:", saveError);
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type":      "text/event-stream",
        "Cache-Control":     "no-cache, no-transform",
        "Connection":        "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Chatbot Error:", error);
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
  }
}

/* ─── GET — chat history ─── */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) return NextResponse.json({ messages: [] });

    await connectDB();

    const session = await ChatSession.findOne({ sessionId });
    return NextResponse.json({ messages: session?.messages || [] });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}