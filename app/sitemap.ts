import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://kuttistoryphotography.com",
      lastModified: new Date(),
      priority: 1,
    },
    {
      url: "https://kuttistoryphotography.com/about",
      lastModified: new Date(),
      priority: 0.9,
    },
    {
      url: "https://kuttistoryphotography.com/services",
      lastModified: new Date(),
      priority: 0.9,
    },
    {
      url: "https://kuttistoryphotography.com/works",
      lastModified: new Date(),
      priority: 0.9,
    },
    {
      url: "https://kuttistoryphotography.com/blog",
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: "https://kuttistoryphotography.com/contact-us",
      lastModified: new Date(),
      priority: 0.8,
    },
  ];
}