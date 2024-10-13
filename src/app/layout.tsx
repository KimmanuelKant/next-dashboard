// src/app/layout.tsx
import 'bootstrap/dist/css/bootstrap.min.css';
import "../styles/global.css";
import { Analytics } from "@vercel/analytics/react"

export const metadata = {
  title: "FPL Dashboard",
  description: "Fantasy Premier League Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-bs-theme="dark">
      <body>{children}</body>
    </html>
  );
}
