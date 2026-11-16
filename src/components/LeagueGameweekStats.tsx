// src/components/LeagueGameweekStats.tsx

import { notFound } from "next/navigation";
import GameweekPicker from "@/components/GameweekPicker";
import GameweekStatisticsTable from "@/components/GameweekStatisticsTable";
import LeagueNotices from "@/components/LeagueNotices";
import { getLeagueSnapshot } from "@/lib/fpl/snapshot";
import { computeGameweekHighlights, computeGameweekStats } from "@/lib/stats/gameweekStats";

// Errors thrown here are caught by the ErrorBoundary in the page.
export default async function LeagueGameweekStats({
  leagueId,
  requestedGameweek,
}: {
  leagueId: string;
  /** The gameweek asked for in the address; null for the current one. */
  requestedGameweek: number | null;
}) {
  const snapshot = await getLeagueSnapshot(leagueId);
  if (!snapshot) {
    notFound();
  }
  // A gameweek that has not been played (a mistyped or stale link) shows the
  // current one instead.
  const gw =
    requestedGameweek !== null && snapshot.gameweekIds.includes(requestedGameweek)
      ? requestedGameweek
      : snapshot.currentGw;
  const gameweek = snapshot.bootstrap.gameweeks.find((g) => g.id === gw);
  const stats = computeGameweekStats(snapshot, gw);

  return (
    <>
      <LeagueNotices snapshot={snapshot} />
      {gameweek && (
        <GameweekPicker
          gameweeks={snapshot.gameweekIds}
          selected={gameweek.id}
          status={gameweek.finished ? "Final scores." : "In progress. Scores can still change."}
        />
      )}
      <GameweekStatisticsTable
        stats={stats}
        highlights={computeGameweekHighlights(stats)}
        leagueName={snapshot.league.name}
      />
    </>
  );
}
