// src/components/LeagueTeamStats.tsx

import { notFound } from "next/navigation";
import SeasonStatisticsTable from "@/components/SeasonStatisticsTable";
import LeagueNotices from "@/components/LeagueNotices";
import { getLeagueSnapshot } from "@/lib/fpl/snapshot";
import { computeSeasonHighlights, computeTeamStats } from "@/lib/stats/teamStats";

// Errors thrown here are caught by the ErrorBoundary in the page.
export default async function LeagueTeamStats({ leagueId }: { leagueId: string }) {
  const snapshot = await getLeagueSnapshot(leagueId);
  if (!snapshot) {
    notFound();
  }
  const stats = computeTeamStats(snapshot);

  return (
    <>
      <LeagueNotices snapshot={snapshot} />
      <SeasonStatisticsTable stats={stats} highlights={computeSeasonHighlights(stats)} />
    </>
  );
}
