// src/components/LeaguePlayerStats.tsx

import { notFound } from "next/navigation";
import PlayerStatisticsTable from "@/components/PlayerStatisticsTable";
import LeagueNotices from "@/components/LeagueNotices";
import LiveStatus from "@/components/LiveStatus";
import { getLeagueSnapshot } from "@/lib/fpl/snapshot";
import { matchTimes } from "@/lib/stats/live";
import { computePlayerStats } from "@/lib/stats/playerStats";

// Errors thrown here are caught by the ErrorBoundary in the page.
export default async function LeaguePlayerStats({ leagueId }: { leagueId: string }) {
  const snapshot = await getLeagueSnapshot(leagueId);
  if (!snapshot) {
    notFound();
  }
  const fixtures = snapshot.liveFixtures;

  return (
    <>
      <LeagueNotices snapshot={snapshot} />
      {snapshot.currentGw !== null && (
        <p className="text-secondary small">
          Scout players for informed transfers: who is rare in this league, who
          everyone has, and who nobody owns yet. Squads and ownership are for
          gameweek {snapshot.currentGw}.{" "}
          {/* While it is played, the Live view keeps itself up to date. */}
          {fixtures && <LiveStatus {...matchTimes(fixtures)} updatedAt={snapshot.liveUpdatedAt} />}
        </p>
      )}
      <PlayerStatisticsTable players={computePlayerStats(snapshot)} isLive={fixtures !== null} />
    </>
  );
}
