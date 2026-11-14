// src/app/robots.ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Fetchers that build the preview shown when a link is pasted into a chat or
// a post. Some of them obey robots.txt, so they must be let into league
// pages, or shared links would show no title and image.
const LINK_PREVIEW_BOTS = [
  "facebookexternalhit",
  "Facebot",
  "WhatsApp",
  "Twitterbot",
  "LinkedInBot",
  "Slackbot",
  "Slackbot-LinkExpanding",
  "TelegramBot",
  "Discordbot",
  "redditbot",
];

// The front page is open to search engines. League and team pages are kept
// out of search: each one costs a server render and FPL API requests.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: LINK_PREVIEW_BOTS, allow: "/" },
      { userAgent: "*", allow: "/", disallow: ["/dashboard/", "/team/"] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
