
import "server-only";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import ChatSession from "@/models/ChatSession";
import ContactSettings from "@/models/ContactSettings";

/* =========================================
   CONTACT INFORMATION
========================================= */

interface ContactInfo {
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  businessHours: string;
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  twitterUrl: string;
  telegramUrl: string;
}

const DEFAULT_CONTACT: ContactInfo = {
  email: "kuttistoryphotography@gmail.com",
  phone: "+91 93420 13600, +91 99767 33600",
  whatsapp: "+91 93420 13600",
  address:
    "52/32 South Mada Street, Near Koodal Azhagar Perumal Temple",
  city: "Madurai",
  state: "Tamil Nadu",
  pincode: "625001",
  businessHours: "Mon – Sat: 9 AM – 7 PM",
  instagramUrl: "",
  facebookUrl: "",
  youtubeUrl: "",
  twitterUrl: "",
  telegramUrl: "",
};

/* =========================================
   SYSTEM PROMPT
========================================= */

async function buildSystemPrompt(): Promise<string> {
  let contact = { ...DEFAULT_CONTACT };

  try {
    const settings = await ContactSettings.findOne().lean();

    if (settings) {
      contact = {
        ...contact,
        ...(settings as Partial<ContactInfo>),
      };
    }
  } catch (error) {
    console.error("Contact settings error:", error);
  }

  const fullAddress = [
    contact.address,
    contact.city,
    contact.state,
    contact.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  const socialLinks = [
    ["Instagram", contact.instagramUrl],
    ["Facebook", contact.facebookUrl],
    ["YouTube", contact.youtubeUrl],
    ["X/Twitter", contact.twitterUrl],
    ["Telegram", contact.telegramUrl],
  ]
    .filter(([, url]) => Boolean(url))
    .map(([name, url]) => `${name}: ${url}`)
    .join("\n");

  return `
You are Kutti Story Assistant, the official AI customer support and sales assistant for Kutti Story Photography and Kutti Story Media.

YOUR PERSONALITY:
- Friendly, warm, professional and helpful.
- Use simple English.
- Keep responses short and conversational.
- Use emojis naturally.
- Never sound robotic.
- Ask only ONE question at a time.
- Never overwhelm customers with long messages.

========================================
PHOTOGRAPHY SERVICES
========================================

Kutti Story Photography offers:

1. Wedding Photography
2. Candid Wedding Photography
3. Traditional Photography
4. Cinematic Wedding Videography
5. Pre-Wedding Photography
6. Post-Wedding Photography
7. Engagement Photography
8. Maternity Photography
9. Baby Photography
10. Baby Shower Photography
11. Birthday Photography
12. Portrait Photography
13. Outdoor Photography
14. Corporate Event Photography
15. Product Photography
16. Commercial Photography
17. Drone Coverage
18. FPV Coverage

========================================
KUTTI STORY MEDIA SERVICES
========================================

Kutti Story Media offers:

1. Social Media Management
2. Digital Marketing
3. Content Creation
4. Instagram Reels and Short Videos
5. Influencer Marketing
6. Personal Branding
7. Graphic Design and Posters
8. Website Development

IMPORTANT:
Always distinguish Kutti Story Media from Kutti Story Photography.

========================================
KUTTISTORY STUDIO SPACE
========================================

Services include:
- Rental Studio Space
- Podcast Studio
- Interview Setup
- Model Shoots
- Product Shoots

========================================
CONTACT INFORMATION
========================================

Email: ${contact.email}

Phone: ${contact.phone}

WhatsApp: ${contact.whatsapp}

Address: ${fullAddress}

Business Hours: ${contact.businessHours}

SOCIAL MEDIA:

${socialLinks || "Please contact our team for social media links."}

========================================
CUSTOMER HANDLING RULES
========================================

1. GREETINGS

If a customer says Hi, Hello, Good Morning, etc., reply warmly.

Example:
"Hi! 👋 Welcome to Kutti Story. How can I help you today?"

2. PRICING ENQUIRIES

If a customer asks about package prices without specifying a service, ask:

"Sure! 😊 Which service are you interested in?

Wedding / Pre-Wedding / Birthday / Baby Shoot / Other"

Ask only one question.

3. PHOTOGRAPHY PACKAGE ENQUIRIES

If the customer specifies a photography service, ask about their requirements and event date.

Do not invent prices.

Use this response when exact pricing is unavailable:

"Our packages are customized to your requirements. Please share your needs and our team will help you with the right quotation."

4. SOCIAL MEDIA ENQUIRIES

If customers ask about social media services, explain the relevant Kutti Story Media services.

Ask:

"Are you looking for Social Media Management, Digital Marketing or Reels & Content Creation?"

Do not confuse social media services with photography packages.

5. LIVE AGENT HANDOVER

If customers say:
- Connect with live agent
- Talk to human
- Speak to staff
- Customer support
- I need a real person
- I want to talk to your team

Immediately reply:

"Of course! 😊 Our team is ready to help you.

Connect directly with our team:

📲 WhatsApp: ${contact.whatsapp}

📧 Email: ${contact.email}

We'll be happy to assist you!"

Do not continue asking sales questions after offering live-agent contact.

Never claim that a human agent has joined this chat.

6. BOOKING ENQUIRIES

Ask the customer for:
- Event type
- Preferred event date

Ask one question at a time.

Guide customers to WhatsApp or the booking page.

7. AVAILABILITY

If customers ask about availability, request their preferred event date.

Never claim a date is available without confirmation from the team.

8. CONTACT ENQUIRIES

If customers request contact information, provide:
- Phone
- WhatsApp
- Email
- Address
- Business hours
- Available social media links

9. GALLERY DELIVERY

Typical gallery delivery is 2–4 weeks after the event.

10. UNKNOWN INFORMATION

If you do not know an answer, politely direct customers to WhatsApp.

11. SALES CONVERSION

Help customers take the next step towards an enquiry or booking.

Do not pressure customers.

12. IMPORTANT RESTRICTIONS

- Never invent prices.
- Never invent discounts.
- Never invent booking availability.
- Never invent customer testimonials.
- Never promise services that are not listed.
- Never claim that a booking is confirmed without confirmation.

13. RESPONSE STYLE

- Normal replies: 2–5 sentences.
- Keep simple questions short.
- Ask only one question at a time.
- Do not repeat the welcome message in every response.
- Use natural conversational language.
`;
}

/* =========================================
   POST: CHAT MESSAGE
========================================= */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const message =
      typeof body?.message === "string"
        ? body.message.trim()
        : "";

    const sessionId =
      typeof body?.sessionId === "string" &&
      body.sessionId.length <= 150
        ? body.sessionId
        : crypto.randomUUID();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (message.length > 4000) {
      return NextResponse.json(
        { error: "Message is too long" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error("OPENROUTER_API_KEY is missing");

      return NextResponse.json(
        { error: "AI API configuration is missing" },
        { status: 500 }
      );
    }

    await connectDB();

    let session = await ChatSession.findOne({ sessionId });

    if (!session) {
      const currentUser = await getCurrentUser();

      session = await ChatSession.create({
        sessionId,
        userId: currentUser?.userId || null,
        messages: [],
      });
    }

    const history = (session.messages || [])
      .slice(-20)
      .filter((m: any) =>
        ["user", "assistant"].includes(m.role)
      )
      .map((m: any) => ({
        role: m.role,
        content: m.content,
      }));

    const systemPrompt = await buildSystemPrompt();

    /* =========================================
       OPENROUTER API
    ========================================= */

    const aiRes = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_SITE_URL ||
            "https://kuttistoryphotography.com",
          "X-Title": "Kutti Story Assistant",
        },

        body: JSON.stringify({
          model: "openai/gpt-4o-mini",

          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            ...history,
            {
              role: "user",
              content: message,
            },
          ],

          stream: true,
          temperature: 0.7,
          max_tokens: 700,
        }),

        signal: request.signal,
      }
    );

    if (!aiRes.ok) {
      const errorText = await aiRes.text();

      console.error("OpenRouter API Error:", {
        status: aiRes.status,
        response: errorText,
      });

      return NextResponse.json(
        {
          error: "AI service unavailable. Please try again.",
        },
        { status: 502 }
      );
    }

    if (!aiRes.body) {
      return NextResponse.json(
        { error: "AI returned an empty response" },
        { status: 502 }
      );
    }

    /* =========================================
       SAVE USER MESSAGE
    ========================================= */

    session.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    await session.save();

    /* =========================================
       STREAMING RESPONSE
    ========================================= */

    const encoder = new TextEncoder();

    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        const reader = aiRes.body!.getReader();
        const decoder = new TextDecoder();

        let buffer = "";
        let streamFailed = false;

        const send = (data: object) => {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify(data)}\n\n`
            )
          );
        };

        const processLine = (line: string) => {
          const trimmed = line.trim();

          if (!trimmed.startsWith("data:")) return;

          const data = trimmed.slice(5).trim();

          if (!data || data === "[DONE]") return;

          try {
            const parsed = JSON.parse(data);

            if (parsed.error) {
              streamFailed = true;

              console.error(
                "OpenRouter Stream Error:",
                parsed.error
              );

              return;
            }

            const text =
              parsed?.choices?.[0]?.delta?.content;

            if (typeof text === "string" && text.length > 0) {
              fullResponse += text;
              send({ text });
            }
          } catch (error) {
            console.error("Stream parsing error:", error);
          }
        };

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, {
              stream: true,
            });

            const lines = buffer.split(/\r?\n/);

            buffer = lines.pop() || "";

            for (const line of lines) {
              processLine(line);
            }
          }

          buffer += decoder.decode();

          if (buffer.trim()) {
            processLine(buffer);
          }

          if (!fullResponse.trim()) {
            fullResponse = streamFailed
              ? "Sorry, our AI service is temporarily unavailable. Please try again."
              : "Sorry, I couldn't generate a response. Please try again.";

            send({ text: fullResponse });
          }

        } catch (error) {
          console.error("Chatbot streaming error:", error);

          if (!fullResponse.trim()) {
            fullResponse =
              "Sorry, connection interrupted. Please try again.";

            try {
              send({ text: fullResponse });
            } catch {}
          }

        } finally {
          try {
            if (fullResponse.trim()) {
              session.messages.push({
                role: "assistant",
                content: fullResponse.trim(),
                timestamp: new Date(),
              });

              await session.save();
            }
          } catch (error) {
            console.error(
              "Chat history save error:",
              error
            );
          }

          try {
            send({ done: true });
            controller.close();
          } catch {
            // Client disconnected.
          }

          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });

  } catch (error) {
    console.error("Chatbot POST Error:", error);

    return NextResponse.json(
      {
        error: "Failed to process message. Please try again.",
      },
      { status: 500 }
    );
  }
}

/* =========================================
   GET: CHAT HISTORY
========================================= */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({
        messages: [],
      });
    }

    await connectDB();

    const session = await ChatSession.findOne({
      sessionId,
    });

    return NextResponse.json({
      messages: session?.messages || [],
    });

  } catch (error) {
    console.error("Chatbot GET Error:", error);

    return NextResponse.json(
      { messages: [] },
      { status: 500 }
    );
  }
}
