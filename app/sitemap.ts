import { MetadataRoute } from "next";
import connectDB from "@/lib/db";
import PortfolioItem from "@/models/Portfolio";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.kuttistoryphotography.com";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      priority: 1,
    },
    {
      url: `${baseUrl}/about-us`,
      lastModified: new Date(),
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      priority: 0.9,
    },
    {
      url: `${baseUrl}/works`,
      lastModified: new Date(),
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact-us`,
      lastModified: new Date(),
      priority: 0.8,
    },
  ];

  try {
    await connectDB();

    const portfolios = await PortfolioItem.find({
      published: true,
    })
      .select("slug updatedAt")
      .lean();

    const portfolioPages: MetadataRoute.Sitemap = portfolios.map(
      (portfolio: any) => ({
        url: `${baseUrl}/works/${portfolio.slug}`,
        lastModified: portfolio.updatedAt || new Date(),
        priority: 0.8,
      })
    );

    return [...staticPages, ...portfolioPages];
  } catch (error) {
    console.error("Sitemap Error:", error);
    return staticPages;
  }
}