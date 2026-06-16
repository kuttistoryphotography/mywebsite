import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://www.kuttistoryphotography.com",
      lastModified: new Date(),
      priority: 1,
    },
    {
      url: "https://www.kuttistoryphotography.com/about-us",
      lastModified: new Date(),
      priority: 0.9,
    },
    {
      url: "https://www.kuttistoryphotography.com/services",
      lastModified: new Date(),
      priority: 0.9,
    },
    {
      url: "https://www.kuttistoryphotography.com/works",
      lastModified: new Date(),
      priority: 0.9,
    },
    {
      url: "https://www.kuttistoryphotography.com/blog",
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: "https://www.kuttistoryphotography.com/contact-us",
      lastModified: new Date(),
      priority: 0.8,
    },

    // Portfolio page
    {
      url: "https://www.kuttistoryphotography.com/works/love-story-wedding-photography-in-madurai",
      lastModified: new Date(),
      priority: 0.8,
    },
  ];
}