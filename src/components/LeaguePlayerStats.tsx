// src/components/LeaguePlayerStats.tsx

import { notFound } from "next/navigation";
import PlayerStatisticsTable from "@/components/PlayerStatisticsTable";
import LeagueNotices from "@/components/LeagueNotices";
import { getLeagueSnapshot } from "@/lib/fpl/snapshot";
import { computePlayerStats } from "@/lib/stats/playerStats";

// Errors thrown here are caught by the ErrorBoundary in the page.
export default async function LeaguePlayerStats({ leagueId }: { leagueId: string }) {
  const snapshot = await getLeagueSnapshot(leagueId);
  if (!snapshot) {
    notFound();
  }

  return (
    <>
      <LeagueNotices snapshot={snapshot} />
      {snapshot.currentGw !== null && (
        <p className="text-secondary small">
          Squads and ownership for gameweek {snapshot.currentGw}.
        </p>
      )}
      <PlayerStatisticsTable players={computePlayerStats(snapshot)} />
    </>
  );
}
