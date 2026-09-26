import type { MetadataRoute } from "next";
import connectDB from "@/lib/db";
import Blog from "@/models/Blog";

const BASE_URL = "https://www.kuttistoryphotography.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/about-us`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/services`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/works`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/contact-us`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  try {
    await connectDB();

    const blogs = await Blog.find(
      {
        published: true,
        status: "published",
        slug: {
          $exists: true,
          $ne: "",
        },
      },
      {
        slug: 1,
        updatedAt: 1,
      }
    )
      .sort({ updatedAt: -1 })
      .lean();

    const blogPages: MetadataRoute.Sitemap = blogs.map((blog: any) => ({
      url: `${BASE_URL}/blog/${encodeURIComponent(blog.slug)}`,
      lastModified: blog.updatedAt
        ? new Date(blog.updatedAt)
        : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticPages, ...blogPages];
  } catch (error) {
    console.error("Sitemap generation failed:", error);

    return staticPages;
  }
}