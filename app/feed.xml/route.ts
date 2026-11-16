
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import Blog from "@/models/Blog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://kuttistoryphotography.com";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function absoluteUrl(value?: string) {
  if (!value) return "";

  try {
    return new URL(value, SITE_URL).toString();
  } catch {
    return "";
  }
}

function stripHtml(value = "") {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET() {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("MONGODB_URI is missing");
    }

    await mongoose.connect(mongoUri);

    const blogs = await Blog.find({
      published: true,
      status: "published",
    })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(50)
      .lean();

    const items = blogs.map((blog) => {
      const postUrl = `${SITE_URL}/blog/${blog.slug}`;

      const image = absoluteUrl(
        blog.coverImage || blog.ogImage
      );

      const description = stripHtml(
        blog.excerpt || blog.metaDescription || blog.content || ""
      );

      const pubDate = new Date(
        blog.publishedAt || blog.createdAt
      ).toUTCString();

      return `
        <item>
          <title>${escapeXml(blog.title)}</title>
          <link>${escapeXml(postUrl)}</link>
          <guid isPermaLink="true">${escapeXml(postUrl)}</guid>
          <description>${escapeXml(description)}</description>
          <pubDate>${pubDate}</pubDate>
          <category>${escapeXml(blog.category || "Photography")}</category>
          ${
            image
              ? `
                <enclosure
                  url="${escapeXml(image)}"
                  type="${image.toLowerCase().split("?")[0].endsWith(".webp")
                    ? "image/webp"
                    : image.toLowerCase().split("?")[0].endsWith(".png")
                    ? "image/png"
                    : "image/jpeg"}"
                />
                <media:content
                  url="${escapeXml(image)}"
                  medium="image"
                />
              `
              : ""
          }
        </item>
      `;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0"
        xmlns:content="http://purl.org/rss/1.0/modules/content/"
        xmlns:media="http://search.yahoo.com/mrss/">
        <channel>
          <title>Kutti Story Photography Blog</title>
          <link>${SITE_URL}/blog</link>
          <description>Wedding photography, cinematic films, photography tips and stories from Kutti Story Photography.</description>
          <language>en-IN</language>
          <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
          ${items.join("\n")}
        </channel>
      </rss>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("RSS Feed Error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to generate RSS feed" },
      { status: 500 }
    );
  }
}
