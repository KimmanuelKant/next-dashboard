// src/app/dashboard/[leagueId]/layout.tsx
import Link from "next/link";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;

  const res = await fetch(
    `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`
  );

  if (!res.ok) {
    console.error("Failed to fetch league data");
    const defaultLeagueName = `League ${leagueId}`;
    return (
      <div>
        <h1>FPL Dashboard for {defaultLeagueName}</h1>
        <div>{children}</div>
      </div>
    );
  }

  const data = await res.json();
  const leagueName = data?.league?.name ?? `League ${leagueId}`;

  return (
    <div>
      <h1>FPL Dashboard for {leagueName}</h1>
      <nav>
        <ul className="nav nav-tabs">
          <li className="nav-item">
            <Link className="nav-link" href={`/dashboard/${leagueId}/team`}>
              Team Statistics
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" href={`/dashboard/${leagueId}/player`}>
              Player Statistics
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" href={`/dashboard/${leagueId}/awards`}>
              Awards
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" href={`/dashboard/${leagueId}/chat`}>
              Chat
            </Link>
          </li>
        </ul>
      </nav>
      <div>{children}</div>
    </div>
  );
}