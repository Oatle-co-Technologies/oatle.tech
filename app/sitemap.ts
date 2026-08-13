import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://oatle-technologies.co.za",
      lastModified: new Date(),
    },
    {
      url: "https://oatle-technologies.co.za/contact",
      lastModified: new Date(),
    },
  ];
}