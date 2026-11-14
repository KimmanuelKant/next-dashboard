// src/app/dashboard/[leagueId]/layout.tsx
import { notFound } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import { isValidLeagueId } from "@/lib/leagueId";
import { getLeague } from "@/lib/fpl/sources";

async function leagueTitle(leagueId: string): Promise<string | null> {
  try {
    const league = await getLeague(leagueId);
    return league ? league.name : null;
  } catch (error) {
    // FPL is unreachable: still render the page shell with a generic title.
    console.error("Failed to load league name:", error);
    return `League ${leagueId}`;
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

  const title = await leagueTitle(leagueId);
  if (title === null) {
    notFound();
  }

  return (
    <div className="container-fluid py-3">
      <h1 className="h3 mb-3">{title}</h1>
      <DashboardNav leagueId={leagueId} />
      <div>{children}</div>
    </div>
  );
}
