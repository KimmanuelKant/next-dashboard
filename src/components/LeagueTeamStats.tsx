// src/components/LeagueTeamStats.tsx

import { notFound } from "next/navigation";
import TeamStatisticsTable from "@/components/TeamStatisticsTable";
import LeagueNotices from "@/components/LeagueNotices";
import { getLeagueSnapshot } from "@/lib/fpl/snapshot";
import { computeTeamStats } from "@/lib/stats/teamStats";

// Errors thrown here are caught by the ErrorBoundary in the page.
export default async function LeagueTeamStats({ leagueId }: { leagueId: string }) {
  const snapshot = await getLeagueSnapshot(leagueId);
  if (!snapshot) {
    notFound();
  }

  return (
    <>
      <LeagueNotices snapshot={snapshot} />
      <TeamStatisticsTable stats={computeTeamStats(snapshot)} />
    </>
  );
}
