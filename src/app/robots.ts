// src/app/robots.ts
import type { MetadataRoute } from "next";

// The front page is open to crawlers. League and team pages are kept out:
// each one costs a server render and FPL API requests.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard/", "/team/"] },
  };
}
