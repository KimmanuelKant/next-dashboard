// src/app/layout.tsx
import 'bootstrap/dist/css/bootstrap.min.css';
import "../styles/global.css";
import type { Metadata } from "next";
// The Next.js version of the component also reports the route
// ("/dashboard/[leagueId]/season"), so Vercel can count a tab's visits
// across all leagues instead of listing every league as a page of its own.
import { Analytics } from "@vercel/analytics/next";
import { PREVIEW_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";

const title = "MyFPL.net | Fantasy Premier League Minileague Dashboard";
const description =
  "Fantasy Premier League Minileague Dashboard. Enter your League ID to access your personalized dashboard with customizable tables, charts, and statistics.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
