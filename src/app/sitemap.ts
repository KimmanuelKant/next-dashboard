// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// The pages search engines should index. League and team pages are left out
// on purpose (see robots.ts).
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL, changeFrequency: "weekly", priority: 1 }];
}
