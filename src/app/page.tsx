// src/app/page.tsx
import type { Metadata } from "next";
import HomePage from "@/components/HomePage";
import HomeFeatures from "@/components/HomeFeatures";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  // The one address search engines should index the front page under, however
  // it was reached (other hostnames, tracking parameters).
  alternates: { canonical: "/" },
};

// Structured data: tells search engines the site's name (shown above the
// result instead of the bare domain) and that it is a free web app.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: "en",
    },
    {
      "@type": "WebApplication",
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: "SportsApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
    },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        // "<" is escaped so that no string can close the script element.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <HomePage />
      <HomeFeatures />
    </>
  );
}
