// src/app/layout.tsx
import "../styles/global.css";

export const metadata = {
  title: "FPL Dashboard",
  description: "Fantasy Premier League Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
