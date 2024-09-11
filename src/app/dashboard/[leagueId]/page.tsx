// src/app/dashboard/[leagueId]/page.tsx
import Link from "next/link";

export default function DashboardPage({ params }: { params: { leagueId: string } }) {
  const leagueId = params.leagueId;

  return (
    <div>
      <h1>FPL Dashboard for League {leagueId}</h1>
      <nav>
        <Link href={`/dashboard/${leagueId}/team`}>Team Statistics</Link>
        <Link href={`/dashboard/${leagueId}/player`}>Player Statistics</Link>
        <Link href={`/dashboard/${leagueId}/awards`}>Awards</Link>
        <Link href={`/dashboard/${leagueId}/chat`}>Chat</Link>
      </nav>
    </div>
  );
}
