// src/app/dashboard/[leagueId]/layout.tsx
import Link from "next/link";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { leagueId: string };
}) {
  const { leagueId } = params;

  // Fetch league data to get the league name
  const res = await fetch(
    `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`
  );

  if (!res.ok) {
    // Handle the error as needed; you might want to display an error message or fallback
    console.error('Failed to fetch league data');
    // For now, we'll set a default league name
    const defaultLeagueName = `League ${leagueId}`;
    return (
      <div>
        <h1>FPL Dashboard for {defaultLeagueName}</h1>
        {/* ... rest of your code */}
      </div>
    );
  }
  
  const data = await res.json();
  const leagueName = data.league.name;

  if (!data) {
    return <div>Loading...</div>;
  }

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
