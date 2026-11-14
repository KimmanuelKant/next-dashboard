// src/app/page.tsx
import type { Metadata } from "next";
import HomePage from "@/components/HomePage";

export const metadata: Metadata = {
  // The one address search engines should index the front page under, however
  // it was reached (other hostnames, tracking parameters).
  alternates: { canonical: "/" },
};

export default function Page() {
  return <HomePage />;
}
