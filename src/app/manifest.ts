// src/app/manifest.ts
// Lets phones add the site to the home screen as an app with its own name
// and icon. Many visitors open their league every gameweek on a phone.
import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

// Bootstrap's dark-theme page background, so the splash screen matches.
const BACKGROUND = "#212529";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: BACKGROUND,
    theme_color: BACKGROUND,
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
