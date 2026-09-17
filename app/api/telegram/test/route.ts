import { NextResponse } from "next/server";
import { publishBlogToTelegram } from "@/lib/telegram";

export async function GET() {
  try {
    const messageId = await publishBlogToTelegram({
      title: "Kuttistory Telegram Test",
      slug: "telegram-test",
      excerpt:
        "This is a test message from Kuttistory Photography.",
      category: "Test",
    });

    return NextResponse.json({
      success: true,
      messageId,
    });

  } catch (error) {
    console.error("[Telegram Test]", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Telegram test failed",
      },
      {
        status: 500,
      }
    );
  }
}