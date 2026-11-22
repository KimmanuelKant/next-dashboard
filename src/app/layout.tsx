// src/app/layout.tsx
import 'bootstrap/dist/css/bootstrap.min.css';
import "../styles/global.css";
import type { Metadata } from "next";
// The Next.js version of the component also reports the route
// ("/dashboard/[leagueId]/season"), so Vercel can count a tab's visits
// across all leagues instead of listing every league as a page of its own.
import { Analytics } from "@vercel/analytics/next";
import { PREVIEW_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";

const title = SITE_TITLE;
const description = SITE_DESCRIPTION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title,
  description,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title,
    description,
    images: [PREVIEW_IMAGE],
  },
  // Shows the preview image large on X. Title, text and image are taken from
  // the Open Graph values above.
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-bs-theme="dark">
      <body>

        {children}
        <Analytics />
        </body>

    </html>
  );
}
