// src/app/dashboard/[leagueId]/layout.tsx
import { ReactNode } from "react";
import Link from "next/link";

export default function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { leagueId: string };
}) {
  const { leagueId } = params;

  return (
    <div>
      <h1>FPL Dashboard for League {leagueId}</h1>
      <nav>
        <Link href={`/dashboard/${leagueId}/team`}>Team Statistics</Link>
        <Link href={`/dashboard/${leagueId}/player`}>Player Statistics</Link>
        <Link href={`/dashboard/${leagueId}/awards`}>Awards</Link>
        <Link href={`/dashboard/${leagueId}/chat`}>Chat</Link>
      </nav>
      <div>{children}</div>
    </div>
  );
}
