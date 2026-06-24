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

    // Main SEO Pages
    {
      url: "https://www.kuttistoryphotography.com/best-wedding-photographer-in-madurai",
      lastModified: new Date(),
      priority: 1,
    },
    {
      url: "https://www.kuttistoryphotography.com/candid-wedding-photographer-in-madurai",
      lastModified: new Date(),
      priority: 0.9,
    },
    {
      url: "https://www.kuttistoryphotography.com/pre-wedding-photography-in-madurai",
      lastModified: new Date(),
      priority: 0.9,
    },
    {
      url: "https://www.kuttistoryphotography.com/engagement-photography-in-madurai",
      lastModified: new Date(),
      priority: 0.9,
    },
    {
      url: "https://www.kuttistoryphotography.com/wedding-videography-in-madurai",
      lastModified: new Date(),
      priority: 0.9,
    },
    {
      url: "https://www.kuttistoryphotography.com/wedding-photography-and-videography-in-madurai",
      lastModified: new Date(),
      priority: 0.9,
    },
    {
      url: "https://www.kuttistoryphotography.com/baby-shoot-photography-in-madurai",
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: "https://www.kuttistoryphotography.com/maternity-photography-in-madurai",
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: "https://www.kuttistoryphotography.com/birthday-photography-in-madurai",
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: "https://www.kuttistoryphotography.com/event-photography-in-madurai",
      lastModified: new Date(),
      priority: 0.8,
    },

    // Blog Pages
    {
      url: "https://www.kuttistoryphotography.com/blog/best-wedding-venues-in-madurai",
      lastModified: new Date(),
      priority: 0.7,
    },
    {
      url: "https://www.kuttistoryphotography.com/blog/top-pre-wedding-shoot-locations-in-madurai",
      lastModified: new Date(),
      priority: 0.7,
    },
    {
      url: "https://www.kuttistoryphotography.com/blog/how-to-choose-a-wedding-photographer-in-madurai",
      lastModified: new Date(),
      priority: 0.7,
    },
    {
      url: "https://www.kuttistoryphotography.com/blog/wedding-photography-price-guide-madurai",
      lastModified: new Date(),
      priority: 0.7,
    },
    {
      url: "https://www.kuttistoryphotography.com/blog/tamil-wedding-photography-checklist",
      lastModified: new Date(),
      priority: 0.7,
    },
    {
      url: "https://www.kuttistoryphotography.com/blog/best-time-for-wedding-photography-in-madurai",
      lastModified: new Date(),
      priority: 0.7,
    },
    {
      url: "https://www.kuttistoryphotography.com/blog/top-wedding-trends-in-tamil-nadu",
      lastModified: new Date(),
      priority: 0.7,
    },

    // Portfolio
    {
      url: "https://www.kuttistoryphotography.com/works/love-story-wedding-photography-in-madurai",
      lastModified: new Date(),
      priority: 0.8,
    },
  ];
}