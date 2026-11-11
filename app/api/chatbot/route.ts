
import "server-only";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import ChatSession from "@/models/ChatSession";
import ContactSettings from "@/models/ContactSettings";

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
  address: "52/32 South Mada Street, Near Koodal Azhagar Perumal Temple",
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

async function buildSystemPrompt(): Promise<string> {
  let contact = { ...DEFAULT_CONTACT };

  try {
    await connectDB();
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
  ].filter(Boolean).join(", ");

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
You are Kutti Story Assistant, the official customer support AI for Kutti Story Photography and Kutti Story Media.

PERSONALITY:
- Friendly, warm, professional and helpful.
- Use simple English.
- Keep answers short and conversational.
- Use emojis naturally, but not excessively.
- Never sound robotic.

PHOTOGRAPHY SERVICES:
- Wedding Photography
- Candid Wedding Photography
- Traditional Photography
- Cinematic Wedding Videography
- Pre-Wedding and Post-Wedding Shoots
- Engagement Photography
- Maternity and Baby Photography
- Baby Shower and Birthday Photography
- Portrait and Outdoor Photography
- Corporate and Event Photography
- Product and Commercial Photography
- Drone and FPV Coverage

KUTTI STORY MEDIA SERVICES:
- Social Media Management
- Digital Marketing
- Content Creation
- Instagram Reels and Short Videos
- Influencer Marketing
- Personal Branding
- Graphic Design and Posters
- Website Development

STUDIO:
- Rental Studio Space
- Podcast Studio
- Interview Setup
- Model Shoots
- Product Shoots

CONTACT INFORMATION:
Email: ${contact.email}
Phone: ${contact.phone}
WhatsApp: ${contact.whatsapp}
Address: ${fullAddress}
Business Hours: ${contact.businessHours}

SOCIAL MEDIA:
${socialLinks || "Please contact our team for social media links."}

IMPORTANT RULES:

1. If customers ask about photography, explain the relevant services.
2. If customers ask about Social Media, explain Kutti Story Media services. Do not confuse these services with photography bookings.
3. If customers ask about packages or pricing, say:
"Our packages are customized to your requirements. Please share your needs and our team will help you with the right quotation."
4. Never invent prices, discounts, availability or offers.
5. For booking enquiries, ask for their event type and preferred date.
6. For availability, ask for their preferred event date.
7. Typical gallery delivery is 2–4 weeks after the event.
8. For contact enquiries, provide all contact details together.
9. For unknown information, politely direct customers to WhatsApp.
10. Ask only one question at a time.
11. Keep normal replies concise, ideally 2–5 sentences.
12. Do not repeat the welcome message in every response.
13. Help customers take the next step towards an enquiry or booking.
`;
}

/* POST: Send chatbot message */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const message =
      typeof body?.message === "string"
        ? body.message.trim()
        : "";

    const sessionId =
      typeof body?.sessionId === "string" && body.sessionId.length <= 150
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
        { error: "AI configuration is missing. Please contact support." },
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
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user", content: message },
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

      console.error("OpenRouter Error:", {
        status: aiRes.status,
        response: errorText,
      });

      return NextResponse.json(
        {
          error: "AI service unavailable. Please try again.",
          status: aiRes.status,
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
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
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
              console.error("OpenRouter stream error:", parsed.error);
              return;
            }

            const text = parsed?.choices?.[0]?.delta?.content;

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

            buffer += decoder.decode(value, { stream: true });

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

          if (streamFailed && !fullResponse.trim()) {
            send({
              text: "Sorry, our AI service is temporarily unavailable. Please try again.",
            });
          }

          if (!fullResponse.trim() && !streamFailed) {
            send({
              text: "Sorry, I couldn't generate a response. Please try again.",
            });
          }

        } catch (error) {
          if (!request.signal.aborted) {
            console.error("Chatbot streaming error:", error);

            if (!fullResponse.trim()) {
              try {
                send({
                  text: "Sorry, connection interrupted. Please try again.",
                });
              } catch {}
            }
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
            console.error("Chat history save error:", error);
          }

          try {
            send({ done: true });
            controller.close();
          } catch {
            // Client may have disconnected.
          }

          reader.releaseLock();
        }
      },

      async cancel() {
        // The client disconnected.
      },
    });

    // Save user message after the AI request was accepted.
    session.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    await session.save();

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
      { error: "Failed to process message. Please try again." },
      { status: 500 }
    );
  }
}

/* GET: Load chat history */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ messages: [] });
    }

    await connectDB();

    const session = await ChatSession.findOne({ sessionId });

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
