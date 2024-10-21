// src/app/layout.tsx
import 'bootstrap/dist/css/bootstrap.min.css';
import "../styles/global.css";
import { Analytics } from "@vercel/analytics/react"


export const metadata = {
  title: "MyFPL.net | Fantasy Premier League Minileague Dashboard",
  description: "Fantasy Premier League Minileague Dashboard. Enter your League ID to access your personalized dashboard with customizable tables, charts, and statistics.",
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
