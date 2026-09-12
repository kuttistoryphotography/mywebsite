export interface TelegramBlogInput {
  title: string;
  slug: string;
  excerpt?: string;
  category?: string;
  coverImage?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function trimText(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();

  if (clean.length <= max) {
    return clean;
  }

  return clean.slice(0, max - 1).trimEnd() + "…";
}

export async function publishBlogToTelegram(
  blog: TelegramBlogInput
): Promise<number | null> {

  const botToken =
    process.env.TELEGRAM_BOT_TOKEN;

  const channelId =
    process.env.TELEGRAM_CHANNEL_ID;

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://kuttistoryphotography.com"
  ).replace(/\/+$/, "");

  /* =========================================
     CHECK ENVIRONMENT VARIABLES
  ========================================= */

  if (!botToken) {
    console.error(
      "[Telegram] TELEGRAM_BOT_TOKEN is missing"
    );

    return null;
  }

  if (!channelId) {
    console.error(
      "[Telegram] TELEGRAM_CHANNEL_ID is missing"
    );

    return null;
  }

  /* =========================================
     BLOG URL
  ========================================= */

  const blogUrl =
    `${siteUrl}/blog/${encodeURIComponent(blog.slug)}` +
    "?utm_source=telegram" +
    "&utm_medium=social" +
    "&utm_campaign=blog";

  /* =========================================
     BLOG CONTENT
  ========================================= */

  const title =
    trimText(blog.title, 180);

  const excerpt =
    trimText(
      blog.excerpt || "",
      500
    );

  let message =
    `📸 <b>${escapeHtml(title)}</b>`;

  if (blog.category) {
    message +=
      `\n\n📂 ${escapeHtml(
        trimText(
          blog.category,
          80
        )
      )}`;
  }

  if (excerpt) {
    message +=
      `\n\n${escapeHtml(excerpt)}`;
  }

  message +=
    `\n\n👇 Read the full story`;

  /* =========================================
     IF COVER IMAGE EXISTS
     SEND PHOTO
  ========================================= */

  if (blog.coverImage) {

    const response =
      await fetch(
        `https://api.telegram.org/bot${botToken}/sendPhoto`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            chat_id: channelId,

            photo: blog.coverImage,

            caption: message,

            parse_mode: "HTML",

            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text:
                      "📖 Read Full Blog",

                    url: blogUrl,
                  },
                ],
              ],
            },
          }),

          cache: "no-store",
        }
      );

    const data =
      await response.json();

    /* =======================================
       TELEGRAM PHOTO ERROR
    ======================================= */

    if (
      !response.ok ||
      !data?.ok
    ) {
      console.error(
        "[Telegram Photo Error]",
        data?.description ||
          response.statusText
      );

      throw new Error(
        data?.description ||
          "Telegram sendPhoto failed"
      );
    }

    return (
      data.result?.message_id ||
      null
    );
  }

  /* =========================================
     FALLBACK:
     NO COVER IMAGE
     
     SEND NORMAL TEXT MESSAGE
  ========================================= */

  const response =
    await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          chat_id: channelId,

          text: message,

          parse_mode: "HTML",

          disable_web_page_preview:
            false,

          reply_markup: {
            inline_keyboard: [
              [
                {
                  text:
                    "📖 Read Full Blog",

                  url: blogUrl,
                },
              ],
            ],
          },
        }),

        cache: "no-store",
      }
    );

  const data =
    await response.json();

  /* =========================================
     TELEGRAM TEXT ERROR
  ========================================= */

  if (
    !response.ok ||
    !data?.ok
  ) {
    console.error(
      "[Telegram API Error]",
      data?.description ||
        response.statusText
    );

    throw new Error(
      data?.description ||
        "Telegram API request failed"
    );
  }

  return (
    data.result?.message_id ||
    null
  );
}