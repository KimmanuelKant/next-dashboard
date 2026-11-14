// src/app/dashboard/[leagueId]/layout.tsx
import { notFound } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import { isValidLeagueId } from "@/lib/leagueId";

type LeagueLookup =
  | { status: "ok"; name: string }
  | { status: "missing" }
  | { status: "unavailable" };

async function lookupLeague(leagueId: string): Promise<LeagueLookup> {
  try {
    const res = await fetch(
      `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`,
      { next: { revalidate: 3600 } }
    );
    if (res.status === 404) {
      return { status: "missing" };
    }
    if (!res.ok) {
      return { status: "unavailable" };
    }
    const data = await res.json();
    const name = data?.league?.name;
    return name ? { status: "ok", name } : { status: "unavailable" };
  } catch (error) {
    console.error("Failed to fetch league name:", error);
    return { status: "unavailable" };
  }
}

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;

  if (!isValidLeagueId(leagueId)) {
    notFound();
  }

  const league = await lookupLeague(leagueId);
  if (league.status === "missing") {
    notFound();
  }
  const leagueName = league.status === "ok" ? league.name : `League ${leagueId}`;

  return (
    <div className="container-fluid py-3">
      <h1 className="h3 mb-3">{leagueName}</h1>
      <DashboardNav leagueId={leagueId} />
      <div>{children}</div>
    </div>
  );
}
